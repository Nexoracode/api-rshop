import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { RequestUser } from '../interfaces/request-user.interface';

export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): RequestUser | undefined => {
        const request = ctx.switchToHttp().getRequest<Request>();
        const user = request.user as any;
        if (!user) return undefined;

        return {
            id: user.sub,
            email: user.email ?? null,
            phone: user.phone ?? null,
            role: user.role ?? null,
        };
    },
);