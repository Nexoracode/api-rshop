import { Body, Controller, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestDto } from './dto/request.dto';
import { VerifyOtpDto } from './dto/verify.dto';
import { Response } from 'express';
import { Public } from 'src/common/decorator/public.decorator';
import { ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtTypeToken, JwtUtil } from 'src/common/utils/jwt.util';
@ApiTags('01 - 🛡️ Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private jwtUtil: JwtUtil,
    ) { }
    @Post('request-otp')
    @Public()
    requestOtp(@Body() dto: RequestDto) {
        return this.authService.requestOtp(dto);
    }

    @Post('verify-otp')
    @Public()
    async verifyDto(@Body() dto: VerifyOtpDto, @Res({ passthrough: true }) res: Response) {
        const { token, refreshToken, user } = await this.authService.verifyOtp(dto);
        this.jwtUtil.setTokenInCookie(res, token, JwtTypeToken.ACCESS);
        this.jwtUtil.setTokenInCookie(res, refreshToken, JwtTypeToken.REFRESH);
        const { password, role, ...result } = user;
        return { user: result }
    }

    @Post('login')
    @Public()
    @HttpCode(200)
    login(@Body() data: LoginDto, @Res() res: Response) {
        return this.authService.login(data, res);
    }
}
