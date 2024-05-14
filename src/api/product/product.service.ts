import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { S3Service } from 'src/core/s3/s3.service';
import { ProductImage } from './entities/product-image.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product, 'ecommerce-db')
    private productRepo: Repository<Product>,
    @InjectRepository(ProductImage, 'ecommerce-db')
    private productImageRepo: Repository<ProductImage>,
    private s3Service: S3Service,
  ) {}
  async create(
    createProductDto: CreateProductDto,
    files?: Array<Express.Multer.File>,
  ) {
    console.log('Create Product Dto: ', createProductDto);
    const existingProduct = await this.productRepo.findOne({
      where: { SKU: createProductDto.SKU },
    });

    console.log('Existing Product: ', existingProduct);

    if (existingProduct) {
      throw new HttpException(
        `Product with SKU:${existingProduct.SKU} already exists`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const product = await this.productRepo.save(createProductDto);

    try {
      const productImages = await Promise.all(
        files.map(async (file) => {
          const res = await this.s3Service.uploadFileToS3(file, {
            path: `product/${product.id}/${file.originalname}`,
            bucket: process.env.AWS_S3_BUCKET_NAME,
          });
          if ('Location' in res) {
            return this.productImageRepo.save({
              s3_location: res.Location,
              s3_key: res.Key,
              product_id: product.id,
              url: res.Location,
            });
          }
        }),
      );

      product.thumbnail = productImages[0];
      console.log('Images: ', productImages);
      await this.productRepo.save(product);
    } catch (error) {
      console.log(error);
    }

    return product;
  }

  async findAll() {
    const products = await this.productRepo.find({
      relations: ['thumbnail'],
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

  findOne(id: number) {
    return this.productRepo.findOne({
      where: { id },
    });
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return this.productRepo.update(id, updateProductDto);
  }

  remove(id: number) {
    return this.productRepo.delete(id);
  }
}
