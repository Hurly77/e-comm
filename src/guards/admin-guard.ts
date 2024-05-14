import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_KEY } from 'src/decorators/Role';
import { AuthRole } from 'src/types/enums';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AuthRole[]>(
      ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    console.log('User: ', user);
    return requiredRoles.some((role) => user?.role?.includes(role));
  }
}