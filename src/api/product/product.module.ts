import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from './entities/product.entity';
import { S3Module } from 'src/core/s3/s3.module';
import { ProductImage } from './entities/product-image.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage], 'ecommerce-db'),
    S3Module,
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
