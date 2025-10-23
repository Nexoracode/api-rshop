import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "src/modules/auth/auth.service";
import { Request, Response } from "express";
import { JwtTypeToken, JwtUtil } from "src/common/utils/jwt.util";
import * as bcrypt from 'bcrypt';
import { IS_PUBLIC_KEY } from "../decorator/public.decorator";

@Injectable()
export class AutoRefreshGuard implements CanActivate {
    constructor(
        private readonly tokenService: JwtUtil,
        private readonly authService: AuthService,
        private readonly reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest<Request>();
        const res = context.switchToHttp().getResponse<Response>();

        //check if the route is public
        const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
        if (isPublic) return true;

        const accessToken = req.cookies[JwtTypeToken.ACCESS];
        const refreshToken = req.cookies[JwtTypeToken.REFRESH];

        try {
            this.tokenService.verifyToken(accessToken, JwtTypeToken.ACCESS);
            return true;
        } catch (error) {
            if (!refreshToken) throw new UnauthorizedException('refresh token not found');
            try {
                const decode = await this.tokenService.verifyToken(refreshToken, JwtTypeToken.REFRESH);
                const user = await this.authService.getUserById(decode.sub);
                const isMatch = await bcrypt.compare(refreshToken, user.apiToken!);
                if (!isMatch) throw new UnauthorizedException('refresh token not match');

                const payload = {
                    sub: user.id,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                }

                const newAccessToken = this.tokenService.generateToken(payload, JwtTypeToken.ACCESS);
                this.tokenService.setTokenInCookie(res, newAccessToken, JwtTypeToken.ACCESS);

                //update request object for future access
                req.cookies[JwtTypeToken.ACCESS] = newAccessToken;
                return true;

            } catch (error) {
                throw new UnauthorizedException('refresh token is invalid');
            }
        }
    }
}