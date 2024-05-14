import { AuthRole } from '../../../types/enums';

export class CreateAuthDto {
  email: string;
  password: string;
  role: AuthRole;
}
