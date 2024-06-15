import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { UserModule } from '../user/user.module';
import { ProductModule } from '../product/product.module';
import { S3Module } from 'src/core/s3/s3.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem], 'ecommerce-db'), UserModule, ProductModule, S3Module],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
