import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Otp } from './entities/otp.entity';
import { SmsService } from './sms.service';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp) private otpRepo: Repository<Otp>,
    private smsService: SmsService,
  ) { }

  async generate(identifier: string): Promise<void> {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expireAt = new Date(Date.now() + 2 * 60 * 1000); // 2 دقیقه اعتبار

    const otpDublicate = await this.otpRepo.findOne({ where: { identifier } })
    if (otpDublicate) {
      await this.otpRepo.delete({ identifier }); // حذف OTPهای قبلی
    }

    const otp = this.otpRepo.create({
      identifier,
      code: isDevelopment ? '123456' : code,
      expireAt: expireAt,
    });
    await this.otpRepo.save(otp);
    if (!isDevelopment)
      await this.smsService.sendOtp(identifier, code);
  }

  async verify(identifier: string, code: string): Promise<boolean> {
    const otp = await this.otpRepo.findOne({
      where: { identifier, code },
    });
    if (!otp) throw new UnauthorizedException('کد وارد شده معتبر نیست');
    if (otp.verified) throw new UnauthorizedException('این کد قبلاً استفاده شده است');
    if (new Date() > otp.expireAt)
      throw new UnauthorizedException('کد منقضی شده است');

    otp.verified = true;
    await this.otpRepo.save(otp);
    return true;
  }

  async cleanupExpired() {
    await this.otpRepo.delete({ expireAt: LessThan(new Date()) });
  }
}
