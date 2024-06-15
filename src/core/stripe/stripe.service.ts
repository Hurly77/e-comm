import { Injectable } from '@nestjs/common';
import { Stripe } from 'stripe';
import { ConfigService } from '@nestjs/config';
import { Cart } from '../../api/cart/entities/cart.entity';
import { ProductService } from '../../api/product/product.service';
import { Product } from '../../api/product/entities/product.entity';
import { User } from '../../api/user/entities/user.entity';
import { UserService } from '../../api/user/user.service';

@Injectable()
export class StripeService extends Stripe {
  constructor(
    public configService: ConfigService,
    public productService: ProductService,
    public userService: UserService,
  ) {
    super(configService.get('STRIPE_SECRET'));
  }

  // ================ Payment Intents =================
  public async createPaymentIntent(cart: Cart, customer: User, pm_id: string) {
    try {
      const amount = cart.items.reduce((acc, item) => acc + item.product?.price * item.quantity, 0);
      const stripeCustomer = await this.findOrCreateStripeCustomer(customer);

      const paymentIntent = await this.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        customer: stripeCustomer.id,
        payment_method: pm_id,
      });

      return paymentIntent;
    } catch (error) {
      console.error(error);
    }
  }

  public async createSetupIntent(user: User) {
    const stripeCustomer = await this.findOrCreateStripeCustomer(user);

    const setupIntent = await this.setupIntents.create({
      customer: stripeCustomer.id,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return setupIntent;
  }

  // ================== Products======================
  public async findOrCreateProduct(product: Product) {
    const foundProduct = await this.findProductByIdOrSearch(product);

    if (!foundProduct) return this.createProduct(product);

    return foundProduct;
  }

  public async batchCreateProducts(products: Product[]) {
    const StripeProducts = await Promise.all(
      products.map(async (product) => {
        try {
          return await this.findOrCreateProduct(product);
        } catch (error) {
          console.log(error);
        }
      }),
    );

    return StripeProducts;
  }

  public async createProduct(product: Product) {
    try {
      const stripeProduct = await this.products.create({
        name: product.title,
        shippable: true,
        images: product.images.map((img) => img.url),
        default_price_data: {
          currency: 'usd',
          tax_behavior: 'exclusive',
          unit_amount: product.price * 100,
          unit_amount_decimal: product.price.toFixed(2),
        },
        metadata: {
          productId: product.id,
          SKU: product.SKU,
          tcin: product.tcin || product?.specs?.['tcin'],
          upc: product.upc || product?.specs?.['upc'],
          dpci: product?.specs?.['item_number_(dpci)'],
        },
      });

      return stripeProduct;
    } catch (err) {
      console.error(err);
    }
  }

  public async findProductByIdOrSearch(product: Product) {
    const hasProductStripeId = product?.stripeProductId;

    if (hasProductStripeId) {
      const foundByStripeId = await this.products.retrieve(product.stripeProductId);
      if (foundByStripeId) return foundByStripeId;
    }

    const stripeProductSearchResult = await this.products.search({
      query: `metadata[\'SKU\']:\'${product.SKU}\'`,
      limit: 1,
    });

    const foundBySKU = stripeProductSearchResult?.data?.[0];

    if (foundBySKU) return foundBySKU;
    return null;
  }

  // ==================== Customers ======================
  public async findOrCreateStripeCustomer(user: User): Promise<Stripe.Customer> {
    const stripeCustomerId = user.stripe_customer_id;
    const customerEmail = user.email;

    try {
      if (stripeCustomerId) {
        const customerResult = await this.customers.retrieve(stripeCustomerId);
        if (customerResult.deleted) {
          console.log('Customer was deleted, creating new customer');
          const result = await this.createStripeCustomer(user);
          return result;
        }
      }

      const stripeCustomerSearchResults = await this.customers.list({ email: customerEmail });
      const existingCustomer = stripeCustomerSearchResults.data?.[0] as Stripe.Customer | undefined;
      if (existingCustomer) {
        this.userService.update(user.id, { stripe_customer_id: existingCustomer.id });
        return existingCustomer;
      }
      return this.createStripeCustomer(user);
    } catch (err) {
      console.error(err);
      throw new Error('Error finding or creating Stripe Customer');
    }
  }

  public async createStripeCustomer(user: User) {
    const stripeCustomer = await this.customers.create({
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      phone: user.phone_number,
    });

    user.stripe_customer_id = stripeCustomer.id;
    this.userService.update(user.id, user);

    return stripeCustomer;
  }

  public async updateCustomerDefaultPM(user: User, pm_id: string) {
    const stripeCustomer = await this.findOrCreateStripeCustomer(user);

    const updatedCustomer = await this.customers.update(stripeCustomer.id, {
      invoice_settings: {
        default_payment_method: pm_id,
      },
    });

    return updatedCustomer;
  }

  //================ PMs = Payment Methods ================
  public async getStripeCustomerPMs(user: User) {
    const stripeCustomer = await this.findOrCreateStripeCustomer(user);
    const paymentMethods = await this.paymentMethods.list({ customer: stripeCustomer.id });
    const defaultPaymentMethod = stripeCustomer.invoice_settings.default_payment_method;

    return {
      paymentMethods,
      default_pm_id: defaultPaymentMethod,
    };
  }

  public async attachPMToCustomer(user: User, pm_id: string) {
    const stripeCustomer = await this.findOrCreateStripeCustomer(user);

    const paymentMethod = await this.paymentMethods.attach(pm_id, { customer: stripeCustomer.id });

    return paymentMethod;
  }
}
