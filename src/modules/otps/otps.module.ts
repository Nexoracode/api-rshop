import { Module } from '@nestjs/common';
import { OtpController } from './otps.controller';
import { OtpService } from './otps.service';
import { SmsService } from './sms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Otp } from './entities/otp.entity';
import { OtpCleanupTask } from './otp.clean';

@Module({
  imports: [TypeOrmModule.forFeature([Otp])],
  controllers: [OtpController],
  providers: [OtpService, SmsService, OtpCleanupTask],
  exports: [OtpService, SmsService],
})
export class OtpModule { }
