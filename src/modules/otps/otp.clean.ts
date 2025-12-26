import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OtpService } from './otps.service';

@Injectable()
export class OtpCleanupTask {
    private readonly logger = new Logger(OtpCleanupTask.name);

    constructor(private otpService: OtpService) { }

    // ✅ هر روز ساعت 3 صبح
    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    // @Cron(CronExpression.EVERY_5_MINUTES)
    async handleDailyCleanup() {
        this.logger.log('🧹 شروع cleanup روزانه OTP ها...');
        try {
            await this.otpService.cleanupExpired();
            this.logger.log('✅ Cleanup روزانه با موفقیت انجام شد');
        } catch (error) {
            this.logger.error('❌ خطا در cleanup روزانه:', error);
        }
    }
}