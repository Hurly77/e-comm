import { PartialType } from '@nestjs/mapped-types';
import { CreateCartItemDto } from './create-cart-item.dto';

export class UpdateCartItemDto extends PartialType(CreateCartItemDto) {
  cartItemId: string;
  userId: number;
}
