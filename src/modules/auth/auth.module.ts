import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { JwtUtil } from 'src/common/utils/jwt.util';
import { OtpModule } from '../otps/otps.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), OtpModule],
  providers: [AuthService, JwtService, JwtUtil],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule { }
