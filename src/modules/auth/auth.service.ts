import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { RequestDto } from './dto/request.dto';
import { VerifyOtpDto } from './dto/verify.dto';
import { JwtTypeToken as TypeToken, JwtUtil, JwtTypeToken } from 'src/common/utils/jwt.util';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { IAuthService } from './interfaces/auth.service.interface';
import { RegisterDto } from './dto/register.dto';
import { IAuthResponse } from './interfaces/auth-response.interface';
import { AuthMapper } from './mappers/auth.mapper';
import { LoginDto } from './dto/login.dto';
import { OtpService } from '../otps/otps.service';
@Injectable()
export class AuthService implements IAuthService {
    constructor(
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private readonly otpService: OtpService,
        private jwtUtil: JwtUtil
    ) { }

    private async generateRefreshTokenAndSetCookie(user: User, res: Response) {
        const payload = { sub: user.id, phone: user.phone, email: user.email, role: user.role };
        const token = this.jwtUtil.generateToken(payload, TypeToken.ACCESS);
        const refreshToken = this.jwtUtil.generateToken(payload, TypeToken.REFRESH);
        user.apiToken = refreshToken;
        //save user
        await this.userRepo.save(user);
        //set token in cookie
        this.jwtUtil.setTokenInCookie(res, token, TypeToken.ACCESS);
        this.jwtUtil.setTokenInCookie(res, refreshToken, TypeToken.REFRESH);
        return user;
    }

    async login(data: LoginDto, res: Response): Promise<IAuthResponse> {
        const user = await this.userRepo.findOne({
            where: { phone: data.identifier }, select: [
                'id', 'phone', 'email', 'firstName', 'lastName', 'createdAt', 'lastLoginAt', 'role', 'password'
            ]
        })
        if (!user) throw new NotFoundException('نام کاربری یا رمز عبور صحیح نمی باشد.');
        const matchPassword = await bcrypt.compare(data.password, user.password);
        if (!matchPassword) throw new NotFoundException('نام کاربری یا رمز عبور صحیح نمی باشد.');
        const NewUser = await this.generateRefreshTokenAndSetCookie(user, res);
        return AuthMapper.toResponse(NewUser);
    }

    async register(data: RegisterDto): Promise<IAuthResponse> {
        throw new Error('Method not implemented.');
    }

    async logout(userId: number, res: Response) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('کاربر یافت نشد.');
        user.apiToken = null;
        this.jwtUtil.removeTokenFromCookie(res, JwtTypeToken.ACCESS)
        this.jwtUtil.removeTokenFromCookie(res, JwtTypeToken.REFRESH)
        await this.userRepo.save(user);
        res.json({
            message: 'خروج با موفقیت انجام شد',
            data: null,
        })
    }

    async getUserById(id: number) {
        const user = await this.userRepo.findOne({
            where: [{ id: id },],
            select: ['id', 'phone', 'email', 'role', 'apiToken'],
        });
        if (!user) {
            throw new NotFoundException('user not found');
        }
        return user;
    }

    async requestOtp(dto: RequestDto) {
        await this.otpService.generate(dto.identifier);
        return { message: 'کد احراز هویت ارسال شد.' };
    }

    async verifyOtp(dto: VerifyOtpDto) {
        await this.otpService.verify(dto.identifier, dto.code);

        let user = await this.userRepo.findOne({
            where: [{ phone: dto.identifier }, { email: dto.identifier }],
            select: ['firstName', 'lastName', 'id', 'phone', 'email', 'role'],
        });

        if (!user) {
            user = this.userRepo.create(
                dto.identifier.includes('@')
                    ? { email: dto.identifier }
                    : { phone: dto.identifier },
            );
        }

        user.isPhoneVerified = true;
        const savedUser = await this.userRepo.save(user);

        const payload = { sub: user.id, phone: user.phone, email: user.email, role: user.role };
        const token = this.jwtUtil.generateToken(payload, TypeToken.ACCESS);
        const refreshToken = this.jwtUtil.generateToken(payload, TypeToken.REFRESH);
        user.apiToken = refreshToken;
        await this.userRepo.save(user);

        return { user: savedUser, token, refreshToken };
    }
}
