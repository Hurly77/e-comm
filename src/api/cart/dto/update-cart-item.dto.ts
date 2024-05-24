import { PartialType } from '@nestjs/mapped-types';
import { CreateCartItemDto } from './create-cart-item.dto';
import { IsString } from 'class-validator';

export class UpdateCartItemDto extends PartialType(CreateCartItemDto) {
  cartItemId: string;
  userId: number;
}
