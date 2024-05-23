import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { In, MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { S3Service } from 'src/core/s3/s3.service';
import { ProductImage } from './entities/product-image.entity';
import { Category } from '../category/entities/category.entity';
import { CategoryService } from '../category/category.service';
import { CheckFilters } from './dto/product-filters.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product, 'ecommerce-db')
    private productRepo: Repository<Product>,
    @InjectRepository(ProductImage, 'ecommerce-db')
    private productImageRepo: Repository<ProductImage>,
    private s3Service: S3Service,
    private categoryService: CategoryService,
  ) {}
  async create(createProductDto: CreateProductDto, category: Category | null, files?: Array<Express.Multer.File>) {
    const existingProduct = await this.productRepo.findOne({
      where: { SKU: createProductDto.SKU },
    });

    if (existingProduct) {
      throw new HttpException(`Product with SKU:${existingProduct.SKU} already exists`, HttpStatus.BAD_REQUEST);
    }
    const product = await this.productRepo.save({ ...createProductDto, category });

    try {
      const productImages = await Promise.all(
        files.map(async (file, idx) => {
          const res = await this.s3Service.uploadFileToS3(file, {
            path: `product/${product.id}/${file.originalname}`,
            bucket: process.env.AWS_S3_BUCKET_NAME,
          });
          if ('Location' in res) {
            return new ProductImage({
              s3_location: res.Location,
              s3_key: res.Key,
              product: product,
              url: res.Location,
              isThumbnail: idx === 0,
            });
          } else {
            return undefined;
          }
        }),
      );

      const savedImages = productImages.filter((image) => image !== undefined);
      const thumbnail = savedImages[0];
      await this.productImageRepo.save(savedImages);

      await this.productRepo.update(product.id, { thumbnail });
    } catch (error) {
      console.log(error);
    }

    return product;
  }

  async findAll(filters?: CheckFilters) {
    const products = await this.productRepo.find({
      relations: ['thumbnail', 'category'],
      take: filters?.take,
      skip: filters?.skip,
      where: filters?.deals ? { regularPrice: MoreThan(0) } : undefined,
    });

    return await Promise.all(
      products.map(async (product) => {
        const signedUrl = product.thumbnail
          ? await this.s3Service.getSignedUrl({
              key: product.thumbnail.s3_key,
              bucket: process.env.AWS_S3_BUCKET_NAME,
            })
          : null;
        return {
          ...product,
          thumbnailUrl: signedUrl,
        };
      }),
    );
  }

  async findOne(id: number) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['thumbnail', 'images', 'category', 'category.products', 'category.products.thumbnail'],
    });

    const category = await this.categoryService.findCategory(product.category);

    const productImages = await Promise.all(
      product.images.map(async (image) => {
        const signedUrl = await this.s3Service.getSignedUrl({
          key: image.s3_key,
          bucket: process.env.AWS_S3_BUCKET_NAME,
        });

        return { ...image, url: signedUrl };
      }),
    );

    return { ...product, images: productImages, category };

    // return { product, s3_keys: product.images.map((image) => image.s3_key) };
  }

  async findAllByCategory(categoryId: number) {
    const category = await this.categoryService.findCategoryById(categoryId);

    const products = await this.productRepo.find({
      where: { category },
      relations: ['thumbnail', 'images'],
    });

    return await Promise.all(
      products.map(async (p) => ({
        ...p,
        thumbnailUrl: await this.s3Service.getSignedUrl({
          key: p.thumbnail.s3_key,
          bucket: process.env.AWS_S3_BUCKET_NAME,
        }),
      })),
    );
  }

  async update(id: number, updateProductDto: UpdateProductDto, files?: Express.Multer.File[]) {
    const product = this.productRepo.findOne({
      where: { id },
      relations: ['thumbnail', 'images'],
    });

    return this.productRepo.update(id, updateProductDto);
  }

  async remove(id: number) {
    const product = await this.productRepo.findOne({ where: { id }, relations: ['thumbnail', 'images'] });

    if (product.thumbnail) {
      await this.s3Service.deleteFileFromS3({ key: product.thumbnail.s3_key, bucket: process.env.AWS_S3_BUCKET_NAME });
    }

    await Promise.all(
      product.images.map(async (image) => {
        await this.s3Service.deleteFileFromS3({ key: image.s3_key, bucket: process.env.AWS_S3_BUCKET_NAME });
      }),
    );

    await this.productImageRepo.remove(product.images);
    return this.productRepo.remove(product);
  }

  async findCategoryImages(categoryIds: number[]) {
    const categories = await this.categoryService.findAllByIds(categoryIds);
    const products = await this.productRepo.find({
      where: { category: In(categories.map((c) => c.id)) },
      relations: ['thumbnail', 'images'],
    });

    return products.map((product) => {
      return {
        ...product,
        images: product.images.map((image) => {
          return {
            ...image,
            signedUrl: this.s3Service.getSignedUrl({
              key: image.s3_key,
              bucket: process.env.AWS_S3_BUCKET_NAME,
            }),
          };
        }),
      };
    });
  }
}
