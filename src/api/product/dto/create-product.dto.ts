import { IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';
import { Product } from '../entities/product.entity';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @Length(8, 12)
  SKU: string;

  description: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  price: number;

  stock: number;
}
