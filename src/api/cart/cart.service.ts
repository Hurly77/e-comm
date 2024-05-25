import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { ProductService } from '../product/product.service';
import { User } from '../user/entities/user.entity';
import { S3Service } from 'src/core/s3/s3.service';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart, 'ecommerce-db') private cartRepo: Repository<Cart>,
    @InjectRepository(CartItem, 'ecommerce-db') private cartItemRepo: Repository<CartItem>,
    private userService: UserService,
    private productService: ProductService,
    private s3Service: S3Service,
  ) {}

  async updateCartItem(updateCartItemDto: UpdateCartItemDto) {
    const { cartItemId, quantity, userId } = updateCartItemDto;
    const { cart } = await this.retrieveCart(userId);
    const item = cart.items.find((item) => item.id === cartItemId);

    if (!item || !cart) throw new Error('Item not found');

    item.quantity = quantity;

    await this.cartItemRepo.save(item);

    return this.signCartItemProductThumbnails(cart);
  }

  async addItemToCart(productId: number, userId: number) {
    const { cart } = await this.retrieveCart(userId);
    const product = await this.productService.findOne(productId);

    const existingItem = cart.items.find((item) => item.product.id === productId);

    if (!existingItem) {
      await this.cartItemRepo.save({
        product,
        cart,
        quantity: 1,
      });
    }

    return this.signCartItemProductThumbnails(cart);
  }

  async removeItemFromCart(itemId: string, userId: number) {
    const { cart } = await this.retrieveCart(userId);
    const item = cart.items.find((item) => item.id === itemId);

    if (!item) throw new Error('Item not found');

    await this.cartItemRepo.remove(item);

    return this.signCartItemProductThumbnails(cart);
  }

  async createCart(user: User): Promise<Cart> {
    const cart = new Cart();
    cart.user = user;

    return this.cartRepo.save(cart);
  }

  async retrieveCart(userId: number): Promise<{ cart: Cart; user: User }> {
    const user = await this.userService.findUserAndCart(userId);
    if (!user) throw new Error('User not found');
    let cart = user.cart;

    if (!cart) cart = await this.createCart(user);

    return { cart: await this.signCartItemProductThumbnails(cart), user };
  }

  async signCartItemProductThumbnails(cart: Cart): Promise<Cart> {
    try {
      const signedCartItems = await Promise.all(
        cart.items.map(async (item) => {
          const { s3_key } = item.product.thumbnail;
          const signedUrl = await this.s3Service.getSignedUrl({
            key: s3_key,
            bucket: process.env.AWS_S3_BUCKET_NAME,
          });
          return { ...item, product: { ...item?.product, thumbnailUrl: signedUrl } };
        }),
      );

      return {
        ...cart,
        items: signedCartItems.sort((a, b) => a.created_at.getTime() - b.created_at.getTime()),
      };
    } catch (error) {
      console.log(error);
    }
  }
}
