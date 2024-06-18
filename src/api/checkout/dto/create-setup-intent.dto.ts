import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateSetupIntentDto {
  @IsNotEmpty()
  @IsNumber()
  user_id: number;
}
