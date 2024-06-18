import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, Max, Min, ValidateNested } from 'class-validator';

export class UpdatePaymentCardDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Max(12)
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  exp_month: number;

  @IsOptional()
  @IsNumber()
  @Min(new Date().getFullYear())
  @Transform(({ value }) => parseInt(value))
  exp_year: number;
}

export class UpdatePaymentMethodDto {
  @IsNotEmpty()
  @IsString()
  pm_id: string;

  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @IsOptional()
  @IsNumber()
  shipping_address_id?: number;

  @IsOptional()
  @IsBoolean()
  set_as_default?: boolean;

  @IsOptional()
  @Type(() => UpdatePaymentCardDto)
  @ValidateNested()
  card!: UpdatePaymentCardDto;
}
