import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';

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

  @Patch('/pm/customer/default')
  async setDefaultPaymentMethod(@Body() { user_id, pm_id }: { user_id: string; pm_id: string }) {
    const user = await this.userService.findOne(+user_id);

    if (!user) throw new NotFoundException('User not found');

    return this.stripeService.updateCustomerDefaultPM(user, pm_id);
  }

  @Get('/pm/methods/customer/:user_id')
  async getCustomerPaymentMethods(@Param('user_id') user_id: string) {
    const { user } = await this.cartService.retrieveCart(+user_id);

    if (!user) throw new NotFoundException('User not found');

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
