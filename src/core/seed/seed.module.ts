import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { ProductModule } from 'src/api/product/product.module';
import { S3Module } from '../s3/s3.module';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/api/auth/auth.module';
import { CategoryModule } from 'src/api/category/category.module';

@Module({
  imports: [ProductModule, S3Module, DatabaseModule, ConfigModule, AuthModule, CategoryModule],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
