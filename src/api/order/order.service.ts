import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Repository } from 'typeorm';
import { ProductService } from '../product/product.service';
import { UserService } from '../user/user.service';
import { CartService } from '../cart/cart.service';
import { OrderStatus } from './dto/order-status.dto';
import { S3Service } from 'src/core/s3/s3.service';
import { StripeService } from 'src/core/stripe/stripe.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order, 'ecommerce-db')
    private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem, 'ecommerce-db')
    private orderItemRepo: Repository<OrderItem>,
    private userService: UserService,
    private productService: ProductService,
    private cartService: CartService,
    private s3Service: S3Service,
    private stripeService: StripeService,
  ) {}
  async create(createOrderDto: CreateOrderDto) {
    const { user_id, cart_id, shipping_address_id, stripe_pm_intent_id, stripe_pm_id } = createOrderDto;

    console.log('Retrieving Cart and User');
    const [cart, user, shipping] = await Promise.all([
      await this.cartService.retrieveCartForProcessing(cart_id),
      await this.userService.findOne(user_id),
      await this.userService.findUserShippingAddressById(user_id, shipping_address_id),
    ]);

    console.log('Calculating Order Totals');
    const sub_total = parseFloat(
      cart.items.reduce((acc, item) => acc + item.product.price * item.quantity, 0).toFixed(2),
    );
    const collected_tax = parseFloat((sub_total * 0.07).toFixed(2));
    const total_price = parseFloat((sub_total + collected_tax).toFixed(2));

    console.log('Creating Order');
    const order = await this.orderRepo.save({
      user,
      stripe_pm_id,
      stripe_pm_intent_id,
      sub_total,
      total_price,
      collected_tax,
      status: OrderStatus.PROCESSING,
      shipping_address: shipping,
    });

    console.log('Createing Order ITems');
    const orderItems = await Promise.all(
      cart?.items.map(async (item) => {
        return new OrderItem({
          product: item?.product,
          quantity: item.quantity,
          price: parseFloat(item.product.price?.toFixed(2)),
          order: order,
        });
      }),
    );

    this.orderItemRepo.save(orderItems);

    console.log('Emptying Cart');
    await this.cartService.emptyCart(cart);
    return order;
  }

  async findAllOrdersByUserId(user_id: number) {
    const orders = await this.orderRepo.find({
      where: { user: { id: user_id } },
      relations: ['items', 'items.product', 'items.product.thumbnail', 'shipping_address', 'items.product.category'],
      withDeleted: true,
      order: {
        order_date: 'DESC',
      },
    });

    const processedOrders = await Promise.all(
      orders.map(async (order) => {
        const processedItems = await Promise.all(
          order.items.map(async (item) => {
            const thumbnailUrl = await this.s3Service.getSignedUrl({
              key: item.product.thumbnail.s3_key,
              bucket: process.env.AWS_S3_BUCKET_NAME,
            });

            return {
              ...item,
              product: {
                ...item.product,
                thumbnailUrl,
              },
            };
          }),
        );

        return {
          ...order,
          items: processedItems,
        };
      }),
    );

    return processedOrders;
  }

  async findOne(id: number, user_id: number) {
    const order = await this.orderRepo.findOne({
      where: { id, user: { id: user_id } },
      withDeleted: true,
      relations: ['items', 'items.product', 'items.product.thumbnail', 'shipping_address', 'items.product.category'],
      order: {
        order_date: 'DESC',
      },
    });

    const paymentMethod = await this.stripeService.paymentMethods.retrieve(order.stripe_pm_id);

    const processedItems = await Promise.all(
      order.items.map(async (item) => {
        const thumbnailUrl = await this.s3Service.getSignedUrl({
          key: item.product.thumbnail.s3_key,
          bucket: process.env.AWS_S3_BUCKET_NAME,
        });

        return {
          ...item,
          product: {
            ...item.product,
            thumbnailUrl,
          },
        };
      }),
    );

    return {
      ...order,
      items: processedItems,
      payment_method: paymentMethod.card,
    };
  }
}
