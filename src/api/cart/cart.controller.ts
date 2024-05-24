import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { Roles } from 'src/decorators/Role';
import { AuthRole } from 'src/types/enums';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { DeleteCartItemDto } from './dto/delete-cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('/:userId')
  @Roles(AuthRole.CUSTOMER)
  async getCart(@Param('userId') userId: number) {
    const { cart } = await this.cartService.retrieveCart(userId);
    return cart;
  }

  @Post('/item')
  @Roles(AuthRole.CUSTOMER)
  createCartItem(@Body() createCartItemDto: CreateCartItemDto) {
    const { productId, userId } = createCartItemDto;
    return this.cartService.addItemToCart(productId, userId);
  }

  @Patch('/item')
  @Roles(AuthRole.CUSTOMER)
  updateCartItem(@Body() updateCartItemDto: UpdateCartItemDto) {
    return this.cartService.updateCartItem(updateCartItemDto);
  }

  @Delete('/item')
  @Roles(AuthRole.CUSTOMER)
  deleteCartItem(@Body() deleteCartItemDto: DeleteCartItemDto) {
    return this.cartService.removeItemFromCart(deleteCartItemDto.cartItemId, deleteCartItemDto.userId);
  }
}
