import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CardStatusService } from '../card/card-status.service';

/**
 * سرویس مدیریت Task های زمان‌بندی شده
 * شامل پاکسازی خودکار داده‌های قدیمی
 */
@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        private readonly cardStatusService: CardStatusService,
    ) { }

    /**
     * پاکسازی Cart های ABANDONED قدیمی‌تر از 30 روز
     * زمان اجرا: هر روز ساعت 2:00 صبح
     */
    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async cleanupAbandonedCarts() {
        try {
            this.logger.log('🧹 شروع پاکسازی Cart های قدیمی...');

            const daysOld = 30; // پاک کردن Cart های قدیمی‌تر از 30 روز
            const deleted = await this.cardStatusService.cleanupAbandonedCarts(daysOld);

            this.logger.log(`✅ ${deleted} Cart قدیمی پاک شد (قدیمی‌تر از ${daysOld} روز)`);
        } catch (error) {
            this.logger.error('❌ خطا در پاکسازی Cart ها:', error.stack);
        }
    }

    /**
     * TODO: می‌تونی Task های دیگه هم اضافه کنی:
     * - پاکسازی OTP های منقضی شده
     * - پاکسازی Session های قدیمی
     * - بررسی موجودی محصولات
     * - ارسال یادآوری سفارشات معلق
     */

    /**
     * مثال: پاکسازی هفتگی (هر یکشنبه ساعت 3 صبح)
     */
    // @Cron(CronExpression.EVERY_WEEK)
    // async weeklyCleanup() {
    //     this.logger.log('🧹 شروع پاکسازی هفتگی...');
    //     // ... کد پاکسازی
    // }

    /**
     * مثال: چک روزانه (هر ساعت)
     */
    // @Cron(CronExpression.EVERY_HOUR)
    // async hourlyCheck() {
    //     this.logger.log('🔍 چک روزانه...');
    //     // ... کد چک
    // }
}
