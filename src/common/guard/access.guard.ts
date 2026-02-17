import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { TokenStrategy } from "./enum.strategy";
import { IS_PUBLIC_KEY } from "../decorator/public.decorator";

@Injectable()
export class AccessGuard extends AuthGuard(TokenStrategy.ACCESS) {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        // چک کن که آیا route یا class با @Public() تگ شده
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any) {
        if (err || !user) {
            throw new UnauthorizedException('token is missed');
        }
        return user;
    }
}
