import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ConfigModule } from '@nestjs/config';
import { ProductModule } from 'src/api/product/product.module';
import { UserModule } from 'src/api/user/user.module';
import { StripeJobService } from './stripe-job.service';

@Module({
  imports: [ConfigModule, ProductModule, UserModule],
  providers: [StripeService, StripeJobService],
  exports: [StripeService],
})
export class StripeModule {}
