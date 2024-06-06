import { User } from 'src/api/user/entities/user.entity';

export class AuthSession {
  session: {
    user: Partial<User>;
    token: string;
    exp: number;
  };
}

export type JWTToken<T = Record<string, string>> = {
  iat: number;
  exp: number;
} & T;
