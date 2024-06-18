import { createParamDecorator } from '@nestjs/common';

export const CurrentUser = createParamDecorator((data, ctx) => {
  const user = ctx.switchToHttp().getRequest().user;

  if (!user) return null;

  return data ? user[data] : user;
});
