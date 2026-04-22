import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../guards/roles.guard';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.tenantId;
  },
);
