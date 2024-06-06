import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository, Not, TreeRepository, ILike, MoreThan } from 'typeorm';
import { Category } from './entities/category.entity';
import { S3Service } from 'src/core/s3/s3.service';
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category, 'ecommerce-db') private categoryRepo: TreeRepository<Category>,
    private s3Service: S3Service,
  ) {}
  create(createCategoryDto: CreateCategoryDto) {
    return 'This action adds a new category';
  }

  async createCategory(createCategoryDto: CreateCategoryDto, imgFile: Express.Multer.File | null): Promise<Category> {
    let categoryImage: CompleteMultipartUploadCommandOutput | Error = null;

    const { name, parent, web_id } = createCategoryDto;
    const newCategory = new Category();
    newCategory.name = name;
    newCategory.parent = parent;
    newCategory.web_id = web_id;

    try {
      if (imgFile) {
        categoryImage = await this.s3Service.uploadFileToS3(imgFile, {
          path: `category/${createCategoryDto.web_id}/${imgFile.originalname}`,
          bucket: process.env.AWS_S3_BUCKET_NAME,
        });
      }

      if (categoryImage instanceof Error) {
        throw categoryImage;
      } else if (categoryImage && 'Location' in categoryImage) {
        newCategory.imgURL = categoryImage.Location;
        newCategory.s3_key = categoryImage.Key;
      }
    } catch (error) {
      console.error(error);
      throw error;
    }

    return this.categoryRepo.save(newCategory);
  }

  async findCategoryByName(name: string): Promise<Category> {
    return this.categoryRepo.findOne({ where: { name } });
  }

  async findCategoryById(id: number): Promise<Category> {
    return this.categoryRepo.findOne({
      where: { id },
    });
  }

  async findCategoryAndChildrenById(id: number): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      relations: ['children', 'parent', 'products', 'products.category', 'products.thumbnail'],
      where: { id },
    });

    const res = await this.categoryRepo.findDescendantsTree(category, {
      relations: ['children', 'parent', 'products', 'products.category', 'products.thumbnail'],
    });

    return await this.processSingleCategory(res);
  }

  async findByWebId(web_id: string) {
    const category = await this.categoryRepo.findOne({ where: { web_id } });
    return category;
  }

  async findAll() {
    const categories = await this.categoryRepo.find({
      where: { parent: IsNull() },
      relations: ['children', 'parent'],
    });

    return categories.map((category) => ({
      ...category,
      imgURL: this.s3Service.getSignedUrl({
        key: category.s3_key,
        bucket: process.env.AWS_S3_BUCKET_NAME,
      }),
    }));
  }

  async findFeaturedCategories() {
    const categoriesTrees = await this.categoryRepo.findTrees({
      // where: { parent: IsNull(), imgURL: Not(IsNull()) },
      relations: ['children', 'parent', 'products'],
      depth: 5,
    });

    const categories = categoriesTrees.filter((c) => c.imgURL !== null && c.parent === null)?.slice(0, 12);

    return this.processCategories(categories);
  }

  async findCategory(category: Category) {
    const categoryParents = await this.categoryRepo.findAncestorsTree(category, {
      relations: ['parent', 'products', 'products.category'],
    });

    const signedProducts = await Promise.all(
      category.products.map(async (product) => ({
        ...product,
        thumbnailUrl: product.thumbnail
          ? await this.s3Service.getSignedUrl({
              key: product.thumbnail.s3_key,
              bucket: process.env.AWS_S3_BUCKET_NAME,
            })
          : null,
      })),
    );

    return { ...categoryParents, products: signedProducts };
  }

  async findDealCategories() {
    const categories = await this.categoryRepo.find({
      where: {
        products: {
          regularPrice: MoreThan(0),
        },
      },
      relations: ['products', 'products.thumbnail', 'parent'],
    });

    const filtered = [];

    for (const c of categories) {
      const descendants = await this.categoryRepo.countDescendants(c);
      if (descendants > 1) filtered.push(c);
    }

    const categoryTrees = await Promise.all(
      filtered.map((category) => {
        return this.categoryRepo.findDescendantsTree(category, {
          relations: [
            'children',
            'parent',
            'products',
            'products.thumbnail',
            'children.products',
            'children.products.thumbnail',
          ],
        });
      }),
    );

    return this.processCategories(categoryTrees);
  }

  findAllByIds(ids: number[]) {
    return this.categoryRepo.find({
      where: { id: In(ids) },
    });
  }

  findOne(id: number) {
    return this.categoryRepo.findOne({
      where: { id },
      relations: ['children', 'parent'],
    });
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return `This action updates a #${id} category`;
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }

  private async processCategories(categories: Category[]): Promise<Category[]> {
    if (!categories) return [];
    const signedCategories = await Promise.all(
      categories?.map(async (category) => {
        const s3Key = category?.s3_key;
        const imgURL = category.imgURL;
        const signedUrl =
          s3Key && imgURL
            ? await this.s3Service.getSignedUrl({
                key: category.s3_key,
                bucket: process.env.AWS_S3_BUCKET_NAME,
              })
            : null;

        const children = await this.processCategories(category.children);
        const products = await Promise.all(
          category?.products?.map(async (product) => ({
            ...product,
            thumbnailUrl: product.thumbnail
              ? await this.s3Service.getSignedUrl({
                  key: product.thumbnail.s3_key,
                  bucket: process.env.AWS_S3_BUCKET_NAME,
                })
              : null,
          })),
        );

        return {
          ...category,
          imgURL: signedUrl,
          children: children,
          products: products,
        };
      }),
    );

    return signedCategories;
  }

  private async processSingleCategory(category: Category): Promise<Category> {
    const s3Key = category.s3_key;
    const imgURL = category.imgURL;
    const signedUrl =
      s3Key && imgURL
        ? await this.s3Service.getSignedUrl({
            key: s3Key,
            bucket: process.env.AWS_S3_BUCKET_NAME,
          })
        : null;

    const signedProducts = await Promise.all(
      category.products.map(async (product) => ({
        ...product,
        thumbnailUrl: product.thumbnail
          ? await this.s3Service.getSignedUrl({
              key: product.thumbnail.s3_key,
              bucket: process.env.AWS_S3_BUCKET_NAME,
            })
          : null,
      })),
    );

    const children = await this.processCategories(category.children);
    return {
      ...category,
      imgURL: signedUrl,
      children: children,
      products: signedProducts,
    };
  }
}
