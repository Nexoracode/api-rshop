import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Response } from "express";

export enum JwtTypeToken {
    ACCESS = 'access_token',
    REFRESH = 'refresh_token',
}

@Injectable()
export class JwtUtil {
    constructor(
        private jwtService: JwtService,
    ) { }

    generateToken(payload: any, type: JwtTypeToken) {
        const token = this.jwtService.sign(payload, {
            secret: type === JwtTypeToken.ACCESS ? process.env.JWT_SECRET : process.env.JWT_REFRESH_SECRET,
            expiresIn: type === JwtTypeToken.ACCESS ? process.env.JWT_EXPIRATION : process.env.JWT_REFRESH_EXPIRATION,
        });
        return token;
    }

    verifyToken(token: string, type: JwtTypeToken) {
        const secret = type === JwtTypeToken.ACCESS ? process.env.JWT_SECRET : process.env.JWT_REFRESH_SECRET;
        return this.jwtService.verify(token, {
            secret,
            ignoreExpiration: type === JwtTypeToken.REFRESH ? true : false,
        });
    }

    decodeToken(token: string) {
        try {
            return this.jwtService.decode(token);
        } catch (error) {
            return null;
        }
    }


    setTokenInCookie(res: Response, token: string, type: JwtTypeToken) {
        res.cookie(type, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // ✅ فقط روی HTTPS فعال
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // ✅ برای Front روی دامنه دیگر
            maxAge: type === JwtTypeToken.ACCESS
                ? 15 * 60 * 1000
                : 7 * 24 * 60 * 60 * 1000,
            path: '/', // ✅ حتماً مسیر رو ست کن
        });

    }

    removeTokenFromCookie(res: Response, type: JwtTypeToken) {
        res.clearCookie(type);
    }
}