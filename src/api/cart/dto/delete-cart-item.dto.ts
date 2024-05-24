import { IsNumber, IsString } from 'class-validator';

export class DeleteCartItemDto {
  @IsNumber()
  userId: number;
  @IsString()
  cartItemId: string;
}
