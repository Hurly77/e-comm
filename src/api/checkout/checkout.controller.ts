import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';

import { StripeService } from '../../core/stripe/stripe.service';
import { UserService } from '../user/user.service';
import { CartService } from '../cart/cart.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import Stripe from 'stripe';
import { CreateSetupIntentDto } from './dto/create-setup-intent.dto';
import { UpdatePaymentMetadataDto } from './dto/update-payment-metadata.dto';
import { UpdatePaymentAddressDto } from './dto/update-payment-address.dto';
import { CurrentUser } from 'src/decorators/CurrentUser';
import { User } from '../user/entities/user.entity';

@Controller('checkout')
export class CheckoutController {
  constructor(
    public stripeService: StripeService,
    public userService: UserService,
    public cartService: CartService,
  ) {}

  // ======================= Specific To Strip Customer =======================
  @Get('/pm/customer/:user_id')
  async getStripeCustomer(@Param('user_id') user_id: string) {
    const { user } = await this.cartService.retrieveCart(+user_id);

    if (!user) return {};

    return this.stripeService.findOrCreateStripeCustomer(user);
  }

  @Get('/pm/methods/customer/:user_id')
  async getCustomerPaymentMethods(@Param('user_id') user_id: string) {
    const { user } = await this.cartService.retrieveCart(+user_id);

    if (!user) throw new NotFoundException('User not found');

    return this.stripeService.getStripeCustomerPMs(user);
  }

  // Used for setting the default payment method
  @Patch('/pm/customer/default')
  async setDefaultPaymentMethod(@Body() { user_id, pm_id }: { user_id: string; pm_id: string }) {
    const user = await this.userService.findOne(+user_id);

    if (!user) throw new NotFoundException('User not found');

    return this.stripeService.updateCustomerDefaultPM(user, pm_id);
  }

  // ======================= Specific To Making Payments =======================
  @Post('/pm/payment-intent')
  async createPaymentIntent(@Body() createPaymentIntentDto: CreatePaymentIntentDto) {
    const { pm_id, user_id } = createPaymentIntentDto;

    const { cart, user } = await this.cartService.retrieveCart(user_id);
    if (!user) return {};

    return this.stripeService.createPaymentIntent(cart, user, pm_id);
  }

  // ======================= Specific C.R.U.D Actions to PM  =======================
  // Used for updating the entire payment method
  // including Address, Card, and Shipping Address
  @Post('/pm/setup-intent') // Actually Create a Stripe Setup Intent
  async createSetupIntent(@Body() createSetupIntentDto: CreateSetupIntentDto) {
    const { user_id } = createSetupIntentDto;
    const user = await this.userService.findOne(user_id);

    if (!user) return {};
    return this.stripeService.createSetupIntent(user);
  }

  @Patch('/pm/update')
  async updatePaymentMethod(@Body() updatePaymentMethod: UpdatePaymentMethodDto) {
    const { pm_id, user_id, set_as_default, shipping_address_id, card } = updatePaymentMethod;
    try {
      const user = await this.userService.findOne(user_id);
      let stripeShippingAddress: Stripe.PaymentMethodUpdateParams['billing_details'] | undefined;

      if (shipping_address_id) {
        const userShippingAddress = await this.userService.findUserShippingAddressById(user_id, shipping_address_id);
        if (!userShippingAddress) throw new NotFoundException('Shipping Address not found');

        stripeShippingAddress = {
          name: `${userShippingAddress.first_name} ${userShippingAddress.last_name}`,
          phone: userShippingAddress.phone_number,
          address: {
            line1: userShippingAddress.line1,
            city: userShippingAddress.city,
            country: userShippingAddress.country,
            postal_code: userShippingAddress.postal_code,
            state: userShippingAddress.state,
          },
        };
      }

      if (set_as_default) await this.stripeService.updateCustomerDefaultPM(user, pm_id);
      const updatedPM = await this.stripeService.updatePM(pm_id, {
        card,
        metadata: { shipping_address_id },
        billing_details: stripeShippingAddress,
      });

      return updatedPM;
    } catch (err) {
      console.error('Caught Error:', err);
      throw err ? err : new Error('Error updating Payment Method');
    }
  }

  @Patch('/pm/metadata/update')
  async updatePaymentMetadata(@Body() updatePaymentMetadata: UpdatePaymentMetadataDto) {
    const { pm_id, upsert, metadata } = updatePaymentMetadata;

    const paymentMethod = await this.stripeService.paymentMethods.retrieve(pm_id);

    if (!paymentMethod) throw new NotFoundException('Payment Method not found');
    const metaEntries = Object.entries(metadata);
    // stripe remove metadata if the value is empty
    // So if upsert is false, we set all the metadata to empty
    // then when it is destructured, all the values not included in the incoming metadata
    // will be set to empty
    const restMetadata = metaEntries.reduce((acc, [key]) => {
      acc[key] = '';
      return acc;
    }, {});

    return this.stripeService.paymentMethods.update(pm_id, {
      metadata: upsert
        ? {
            ...restMetadata,
            ...metadata,
          }
        : {
            ...paymentMethod.metadata,
            ...metadata,
          },
    });
  }

  @Patch('/pm/address/update')
  async updatePaymentMethodAddress(@Body() updatePMAddressDto: UpdatePaymentAddressDto) {
    const { address_id, user_id } = updatePMAddressDto;
    const stripe_customer_id = await this.userService.getStripeCustomerId(user_id);

    const [paymentMethods, shippingAddress] = await Promise.all([
      await this.stripeService.customers.listPaymentMethods(stripe_customer_id),
      await this.userService.findUserShippingAddressById(user_id, address_id),
    ]);

    const matchingPaymentMethods = paymentMethods?.data.filter(({ metadata }) => {
      const metadataShippingAddressId = parseInt(metadata?.shipping_address_id);

      return metadataShippingAddressId === address_id;
    });

    const { first_name, last_name, phone_number, line1, line2, city, country, postal_code, state } = shippingAddress;

    return await Promise.all(
      matchingPaymentMethods.map(async (pm) => {
        return await this.stripeService.paymentMethods.update(pm.id, {
          billing_details: {
            name: `${first_name} ${last_name}`,
            phone: phone_number,
            address: {
              city: city,
              country: country,
              line1: line1,
              line2: line2,
              postal_code: postal_code,
              state: state,
            },
          },
        });
      }),
    );
  }

  @Delete('/pm/detach/:pm_id')
  async detachPaymentMethod(@Param('pm_id') pm_id: string, @CurrentUser() currentUser: User) {
    const stripeCustomerId = await this.userService.getStripeCustomerId(currentUser.id);
    const customerPaymentMethods = await this.stripeService.customers.listPaymentMethods(stripeCustomerId);

    const pmIds = customerPaymentMethods.data.map((pm) => pm.id);

    if (pmIds.includes(pm_id)) {
      return await this.stripeService.paymentMethods.detach(pm_id);
    }
  }
}
