import { User } from 'src/api/user/entities/user.entity';

export class AuthSession {
  session: {
    user: Partial<User>;
    token: string;
  };
}
