import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class AcceptedMetadata {
  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  shipping_address_id: number;

  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  user_id: number;
}

export class UpdatePaymentMetadataDto {
  @IsString()
  @IsNotEmpty()
  pm_id: string;

  @IsOptional()
  @IsBoolean()
  upsert: boolean;

  @Type(() => PartialType(AcceptedMetadata))
  @ValidateNested()
  metadata: AcceptedMetadata;
}
