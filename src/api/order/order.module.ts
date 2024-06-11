import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { UserModule } from '../user/user.module';
import { ProductModule } from '../product/product.module';
import { CartModule } from '../cart/cart.module';
import { S3Module } from 'src/core/s3/s3.module';
import { StripeModule } from 'src/core/stripe/stripe.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem], 'ecommerce-db'),
    UserModule,
    ProductModule,
    CartModule,
    S3Module,
    StripeModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
