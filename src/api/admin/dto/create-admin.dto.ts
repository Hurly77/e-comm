import { IsEmail, IsNotEmpty, IsStrongPassword, Length } from 'class-validator';
import { AuthRole } from 'src/types/enums';

export class CreateAdminDto {
  @IsNotEmpty()
  first_name: string;
  @IsNotEmpty()
  last_name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Length(8)
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;

  @IsNotEmpty()
  role: AuthRole;
}
