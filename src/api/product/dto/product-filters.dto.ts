import { Transform, Type } from 'class-transformer';
import { IsOptional, IsArray, IsString } from 'class-validator';

export class CheckFilters {
  @Transform(({ value }) => {
    const strVal = new String(value)?.replace(/[\[\]]/g, '');
    return strVal.split(',').map((id) => parseInt(id, 10));
  })
  ids?: number[];

  @IsOptional()
  take: number;

  @IsOptional()
  skip: number;

  @IsOptional()
  deals: boolean;
}
