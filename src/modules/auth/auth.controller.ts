import { Body, Controller, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestDto } from './dto/request.dto';
import { VerifyOtpDto } from './dto/verify.dto';
import { Response } from 'express';
import { Public } from 'src/common/decorator/public.decorator';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('01 - 🛡️ Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }
    @Post('request-otp')
    @Public()
    requestOtp(@Body() dto: RequestDto) {
        return this.authService.requestOtp(dto);
    }

    @Post('verify-otp')
    @Public()
    verifyDto(@Body() dto: VerifyOtpDto, @Res() res: Response) {
        return this.authService.verifyOtp(dto, res);
    }
}
