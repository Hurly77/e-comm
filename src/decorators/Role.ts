import { SetMetadata } from '@nestjs/common';
import { AuthRole } from '../types/enums';

export const ROLE_KEY = 'roles';
export const Roles = (...roles: AuthRole[]) => SetMetadata(ROLE_KEY, roles);
