import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { S3Module } from 'src/core/s3/s3.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category], 'ecommerce-db'), S3Module],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
