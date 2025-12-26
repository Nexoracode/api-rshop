import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { JwtUtil } from 'src/common/utils/jwt.util';
import { OtpService } from '../otps/otps.service';
import { Otp } from '../otps/entities/otp.entity';
import { SmsService } from '../otps/sms.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Otp])],
  providers: [OtpService, SmsService, AuthService, JwtService, JwtUtil],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule { }
