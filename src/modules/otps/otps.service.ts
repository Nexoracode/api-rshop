import { Injectable, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Otp } from './entities/otp.entity';
import { SmsService } from './sms.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  // ⚙️ تنظیمات
  private readonly OTP_EXPIRY_MINUTES = 2;
  private readonly RATE_LIMIT_SECONDS = 30;
  private readonly CLEANUP_DAYS = 7; // OTP های قدیمی‌تر از 7 روز حذف می‌شن

  constructor(
    @InjectRepository(Otp) private otpRepo: Repository<Otp>,
    private smsService: SmsService,
  ) { }

  async generate(identifier: string): Promise<void> {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expireAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    try {
      // ✅ گام 1: بررسی OTP فعال قبلی
      const existingOtp = await this.otpRepo.findOne({
        where: {
          identifier,
          expireAt: MoreThan(new Date()),
          verified: false,
        },
        order: { createdAt: 'DESC' },
      });

      // ✅ گام 2: Rate Limiting
      if (existingOtp) {
        const timeSinceCreation = Date.now() - existingOtp.createdAt.getTime();
        const remainingSeconds = Math.ceil((this.RATE_LIMIT_SECONDS * 1000 - timeSinceCreation) / 1000);

        if (remainingSeconds > 0) {
          this.logger.warn(`⚠️ Rate limit برای ${identifier} - باید ${remainingSeconds}s صبر کنه`);
          throw new BadRequestException(
            `لطفاً ${remainingSeconds} ثانیه صبر کنید و دوباره تلاش کنید`
          );
        }

        // ✅ گام 3: غیرفعال کردن OTP قبلی (بدون حذف!)
        existingOtp.verified = true;
        await this.otpRepo.save(existingOtp);
        this.logger.log(`🔄 OTP قبلی ${identifier} غیرفعال شد`);
      }

      // ✅ گام 4: ساخت OTP جدید
      const otp = this.otpRepo.create({
        identifier,
        code: isDevelopment ? '123456' : code,
        expireAt: expireAt,
      });

      await this.otpRepo.save(otp);

      // ✅ گام 5: ارسال SMS (غیرهمزمان - بدون blocking)
      if (!isDevelopment) {
        this.smsService.sendOtp(identifier, code).catch(error => {
          this.logger.error(`❌ خطا در ارسال SMS به ${identifier}:`, error);
        });
      }

      this.logger.log(`✅ OTP جدید برای ${identifier} ایجاد شد`);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`❌ خطا در generate OTP برای ${identifier}:`, error);
      throw new UnauthorizedException('خطا در ایجاد کد تایید. لطفاً دوباره تلاش کنید');
    }
  }

  async verify(identifier: string, code: string): Promise<boolean> {
    try {
      // ✅ فقط OTP های فعال و معتبر رو چک می‌کنیم
      const otp = await this.otpRepo.findOne({
        where: {
          identifier,
          code,
          verified: false,
          expireAt: MoreThan(new Date()),
        },
        order: { createdAt: 'DESC' },
      });

      if (!otp) {
        this.logger.warn(`⚠️ کد نامعتبر یا منقضی شده برای ${identifier}`);
        throw new UnauthorizedException('کد وارد شده معتبر نیست یا منقضی شده است');
      }

      // ✅ علامت‌گذاری به عنوان استفاده شده
      otp.verified = true;
      await this.otpRepo.save(otp);

      this.logger.log(`✅ OTP برای ${identifier} تایید شد`);
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`❌ خطا در verify OTP برای ${identifier}:`, error);
      throw new UnauthorizedException('خطا در تایید کد');
    }
  }

  async cleanupExpired(): Promise<void> {
    try {
      // ✅ حذف OTP های قدیمی‌تر از X روز
      const cutoffDate = new Date(Date.now() - this.CLEANUP_DAYS * 24 * 60 * 60 * 1000);

      const result = await this.otpRepo
        .createQueryBuilder()
        .delete()
        .from(Otp)
        .where('createdAt < :cutoffDate', { cutoffDate })
        .execute();

      if (result.affected && result.affected > 0) {
        this.logger.log(`🗑️ ${result.affected} OTP قدیمی پاک شد`);
      }
    } catch (error) {
      this.logger.error('❌ خطا در cleanup OTP:', error);
      // ⚠️ خطا رو throw نمی‌کنیم چون نباید cleanup سرور رو crash کنه
    }
  }

  /**
   * متد کمکی: بررسی تعداد OTP های ارسالی در یک بازه زمانی
   * می‌تونه برای مانیتورینگ یا جلوگیری از abuse استفاده بشه
   */
  async getRecentOtpCount(identifier: string, minutesAgo: number = 60): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - minutesAgo * 60 * 1000);

      const count = await this.otpRepo.count({
        where: {
          identifier,
          createdAt: MoreThan(cutoffDate),
        },
      });

      return count;
    } catch (error) {
      this.logger.error(`❌ خطا در getRecentOtpCount برای ${identifier}:`, error);
      return 0;
    }
  }
}