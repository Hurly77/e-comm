import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { StripeModule } from 'src/core/stripe/stripe.module';
import { CartModule } from '../cart/cart.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule, CartModule, StripeModule],
  controllers: [CheckoutController],
  providers: [],
})
export class CheckoutModule {}
