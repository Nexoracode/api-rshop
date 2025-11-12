import { Module } from '@nestjs/common';
import { OtpController } from './otps.controller';
import { OtpService } from './otps.service';
import { SmsService } from './sms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Otp } from './entities/otp.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Otp])],
  controllers: [OtpController],
  providers: [OtpService, SmsService],
  exports: [OtpService, SmsService],
})
export class OtpModule { }
