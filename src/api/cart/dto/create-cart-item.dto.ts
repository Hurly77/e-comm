import { IsNumber, IsOptional } from 'class-validator';

export class CreateCartItemDto {
  @IsNumber()
  productId: number;
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsNumber()
  quantity: number;
}
