import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { StripeService } from '../../core/stripe/stripe.service';
import { UserService } from '../user/user.service';
import { CartService } from '../cart/cart.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Controller('checkout')
export class CheckoutController {
  constructor(
    public stripeService: StripeService,
    public userService: UserService,
    public cartService: CartService,
  ) {}

  @Get('/pm/customer/:user_id')
  async getStripeCustomer(@Param('user_id') user_id: string) {
    const { user } = await this.cartService.retrieveCart(+user_id);

    if (!user) return {};

    return this.stripeService.findOrCreateStripeCustomer(user);
  }

  @Get('/pm/methods/customer/:user_id')
  async getCustomerPaymentMethods(@Param('user_id') user_id: string) {
    const { user } = await this.cartService.retrieveCart(+user_id);

    if (!user) return {};

    return this.stripeService.getStripeCustomerPMs(user);
  }

  @Get('/pm/setup-intent/customer/:user_id') // Actually Create a Stripe Setup Intent
  async getCustomerSetupIntent(@Param('user_id') user_id: string) {
    const { user } = await this.cartService.retrieveCart(+user_id);

    if (!user) return {};
    return this.stripeService.createSetupIntent(user);
  }

  @Post('/pm/payment-intent')
  async createPaymentIntent(@Body() createPaymentIntentDto: CreatePaymentIntentDto) {
    const { pm_id, user_id } = createPaymentIntentDto;

    const { cart, user } = await this.cartService.retrieveCart(user_id);
    if (!user) return {};

    return this.stripeService.createPaymentIntent(cart, user, pm_id);
  }
}
