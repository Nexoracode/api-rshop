import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { RequestDto } from './dto/request.dto';
import { VerifyOtpDto } from './dto/verify.dto';
import { JwtTypeToken as TypeToken, JwtUtil, JwtTypeToken } from 'src/common/utils/jwt.util';
import { Response, Request } from 'express';
import * as bcrypt from 'bcrypt';
import { IAuthService } from './interfaces/auth.service.interface';
import { RegisterDto } from './dto/register.dto';
import { IAuthResponse } from './interfaces/auth-response.interface';
import { UserMapper } from '../user/mappers/user.mapper';
import { AuthMapper } from './mappers/auth.mapper';
import { LoginDto } from './dto/login.dto';
import { RequestUser } from 'src/common/interfaces/request-user.interface';
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
        // await this.otpService.verify(dto.identifier, dto.code);
        await this.otpService.verify(dto.identifier, dto.code);

        let user = await this.userRepo.findOne({
            where: [{ phone: dto.identifier }, { email: dto.identifier }],
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


    // async requestOtp(dto: RequestDto) {
    //     const code = Math.floor(100000 + Math.random() * 900000).toString();
    //     this.otpService.set('code', code);
    //     this.otpService.set('identifier', dto.identifier);
    //     console.log(`send code for ${dto.identifier} : ${code}`)
    //     return {
    //         message: 'send code successfully',
    //         data: null
    //     };
    // }

    // async verifyOtp(dto: VerifyOtpDto) {
    //     var response = { status: 200, message: 'login successfully' };
    //     const realCode = this.otpService.get('code');
    //     const identifier = this.otpService.get('identifier');
    //     let user = await this.userRepo.findOne({
    //         where: [
    //             { phone: dto.identifier },
    //             { email: dto.identifier }
    //         ],
    //         select: ['id', 'phone', 'email', 'role', 'apiToken'],
    //     });
    //     // if (realCode != dto.identifier) {
    //     //     throw new UnauthorizedException('code is valid')
    //     // }
    //     if (dto.code !== '123456') {
    //         throw new UnauthorizedException('کد احراز هویت منقضی شده است..')
    //     }
    //     if (identifier != dto.identifier) {
    //         throw new UnauthorizedException('شماره وارد شده معتبر نمی باشد.')
    //     }
    //     if (!user) {
    //         if (dto.identifier.includes('@')) {
    //             user = this.userRepo.create({ email: dto.identifier });
    //         } else {
    //             user = this.userRepo.create({ phone: dto.identifier });
    //         }
    //         response.status = 201;
    //         response.message = 'register user successfully';
    //     }
    //     user.isPhoneVerified = true;
    //     this.otpService.delete('code');
    //     this.otpService.delete('identifier');
    //     const payload = { sub: user.id, phone: user.phone, email: user.email, role: user.role };
    //     const token = this.jwtUtil.generateToken(payload, TypeToken.ACCESS);
    //     const refreshToken = this.jwtUtil.generateToken(payload, TypeToken.REFRESH);
    //     user.apiToken = refreshToken;
    //     //save user
    //     const savedUser = await this.userRepo.save(user);
    //     return {
    //         user: savedUser,
    //         token,
    //         refreshToken,
    //     };
    // }
}
