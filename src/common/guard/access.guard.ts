import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { TokenStrategy } from "./enum.strategy";

@Injectable()
export class AccessGuard extends AuthGuard(TokenStrategy.ACCESS) {
    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any) {
        if (err || !user) {
            throw new UnauthorizedException('token is missed');
        }
        return user;
    }
}