import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdatePaymentAddressDto {
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @IsNumber()
  @IsNotEmpty()
  address_id: number;
}
