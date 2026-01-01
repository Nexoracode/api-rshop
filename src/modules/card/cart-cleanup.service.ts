import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, LessThan } from 'typeorm';
import { Order } from '../order/entities/order.entity';
import { OrderStatus } from '../order/enums/order-status.enum';
import { Card, CardStatus } from './entities/card.entity';
import { CardStatusService } from './card-status.service';
import { runInTransaction } from 'src/common/helpers/transaction.helper';

@Injectable()
export class CartCleanupService {
    private readonly logger = new Logger(CartCleanupService.name);

    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
        private readonly cardStatusService: CardStatusService,
    ) { }

    // ═══════════════════════════════════════════════════════════════
    // 🕐 هر 30 دقیقه: Expire کردن Order های منقضی شده
    // ═══════════════════════════════════════════════════════════════
    /**
     * ✅ Order هایی که بیش از 30 دقیقه در وضعیت پرداخت نشده هستند رو منقضی می‌کنه
     * 
     * چرا این کار لازمه؟
     * - موجودی محصولات Reserve شده باید آزاد بشه
     * - کاربر نباید بتونه با قیمت قدیمی خرید کنه (اگه قیمت تغییر کرده)
     * - Cart باید Unlock بشه تا کاربر بتونه دوباره سفارش بده
     */
    @Cron(CronExpression.EVERY_30_MINUTES)
    async handleExpiredOrders() {
        this.logger.log('🕐 Checking for expired orders...');

        const TIMEOUT_MINUTES = 30;
        const timeoutDate = new Date();
        timeoutDate.setMinutes(timeoutDate.getMinutes() - TIMEOUT_MINUTES);

        try {
            const result = await runInTransaction(this.dataSource, async (manager) => {
                const orderRepo = manager.getRepository(Order);

                // ✅ فقط Order هایی که هنوز در حال پرداخت هستند
                const expiredOrders = await orderRepo.find({
                    where: {
                        status: In([
                            OrderStatus.START_ORDER,           // سفارش شروع شده ولی به درگاه نرفته
                            OrderStatus.AWAITING_PAYMENT,      // در درگاه پرداخت
                            OrderStatus.PAYMENT_CONFIRMATION_PENDING, // در حال تأیید
                            OrderStatus.PAYMENT_FAILED,        // پرداخت ناموفق
                        ]),
                        createdAt: LessThan(timeoutDate),
                    },
                    relations: ['user'],
                });

                if (expiredOrders.length === 0) {
                    return { count: 0 };
                }

                this.logger.log(`⏰ Found ${expiredOrders.length} expired orders`);

                for (const order of expiredOrders) {
                    // 1. تغییر وضعیت Order به EXPIRED
                    order.status = OrderStatus.EXPIRED;
                    await orderRepo.save(order);

                    // 2. ✅ Unlock کردن Cart (نه Abandon!)
                    // چون ممکنه کاربر بخواد دوباره همون محصولات رو سفارش بده
                    await this.cardStatusService.unlockCart(order.user.id, manager);

                    this.logger.log(
                        `✅ Order ${order.id} expired and cart unlocked for user ${order.user.id}`
                    );
                }

                return { count: expiredOrders.length };
            });

            if (result.count > 0) {
                this.logger.log(`✅ Successfully expired ${result.count} orders`);
            }
        } catch (error) {
            this.logger.error('❌ Error expiring orders:', error.stack);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🧹 هر 6 ساعت: پاک‌سازی Cart های گیر کرده در حالت LOCKED
    // ═══════════════════════════════════════════════════════════════
    /**
     * ✅ Cart هایی که بیش از 2 ساعت LOCKED هستند ولی Order فعالی ندارند
     * 
     * چرا این کار لازمه؟
     * - گاهی ممکنه به خاطر باگ یا crash، Cart ها LOCKED بمونن
     * - این Cart ها رو باید Unlock کنیم تا کاربر بتونه سفارش جدید بده
     * 
     * ⚠️ توجه: فقط Cart هایی که Order فعال ندارند!
     */
    @Cron(CronExpression.EVERY_6_HOURS)
    async handleStuckLockedCarts() {
        this.logger.log('🔓 Checking for stuck locked carts...');

        const HOURS_OLD = 2;
        const stuckDate = new Date();
        stuckDate.setHours(stuckDate.getHours() - HOURS_OLD);

        try {
            const result = await runInTransaction(this.dataSource, async (manager) => {
                const cartRepo = manager.getRepository(Card);
                const orderRepo = manager.getRepository(Order);

                // پیدا کردن Cart های LOCKED قدیمی
                const lockedCarts = await cartRepo.find({
                    where: {
                        status: CardStatus.LOCKED,
                        updatedAt: LessThan(stuckDate),
                    },
                    relations: ['user'],
                });

                if (lockedCarts.length === 0) {
                    return { count: 0 };
                }

                this.logger.log(`🔍 Found ${lockedCarts.length} potentially stuck locked carts`);

                let unlockedCount = 0;

                for (const cart of lockedCarts) {
                    // ✅ بررسی کن آیا این کاربر Order فعال (در حال پرداخت) داره؟
                    const activeOrder = await orderRepo.findOne({
                        where: {
                            user: { id: cart.user.id },
                            status: In([
                                OrderStatus.AWAITING_PAYMENT,
                                OrderStatus.PAYMENT_CONFIRMATION_PENDING,
                            ]),
                        },
                    });

                    // اگه Order فعال داره، Cart رو دست نزن
                    if (activeOrder) {
                        this.logger.debug(
                            `⏭️ Skipping cart ${cart.id} - user has active order ${activeOrder.id}`
                        );
                        continue;
                    }

                    // اگه Order فعال نداره، Cart رو Unlock کن
                    await this.cardStatusService.unlockCart(cart.user.id, manager);
                    unlockedCount++;

                    this.logger.log(
                        `✅ Unlocked stuck cart ${cart.id} for user ${cart.user.id}`
                    );
                }

                return { count: unlockedCount };
            });

            if (result.count > 0) {
                this.logger.log(`✅ Successfully unlocked ${result.count} stuck carts`);
            } else {
                this.logger.log('ℹ️ No stuck carts found');
            }
        } catch (error) {
            this.logger.error('❌ Error unlocking stuck carts:', error.stack);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🗑️ هر روز ساعت 3 صبح: پاک‌سازی Cart های ABANDONED قدیمی
    // ═══════════════════════════════════════════════════════════════
    /**
     * ✅ Cart های ABANDONED که بیش از 30 روز قدمت دارند رو پاک می‌کنه
     * 
     * چرا این کار لازمه؟
     * - کاهش حجم دیتابیس
     * - بهبود performance
     * - Cart های ABANDONED دیگه هیچ کاربردی ندارند
     */
    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async cleanupOldAbandonedCarts() {
        this.logger.log('🗑️ Cleaning up old abandoned carts...');

        try {
            const DAYS_OLD = 30;
            const deleted = await this.cardStatusService.cleanupAbandonedCarts(DAYS_OLD);

            if (deleted > 0) {
                this.logger.log(
                    `✅ Successfully deleted ${deleted} abandoned carts older than ${DAYS_OLD} days`
                );
            } else {
                this.logger.log(`ℹ️ No abandoned carts older than ${DAYS_OLD} days found`);
            }
        } catch (error) {
            this.logger.error('❌ Error cleaning up abandoned carts:', error.stack);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 📊 هر هفته: گزارش آمار Cart Abandonment
    // ═══════════════════════════════════════════════════════════════
    /**
     * ✅ گزارش آماری از Cart های هفته گذشته
     * 
     * این آمار برای تحلیل رفتار کاربران و بهبود فرآیند خرید مفیده
     */
    @Cron(CronExpression.EVERY_WEEK)
    async reportAbandonmentStats() {
        this.logger.log('📊 Generating cart abandonment report...');

        try {
            const stats = await this.dataSource.query(`
                SELECT 
                    COUNT(*) as total_carts,
                    SUM(CASE WHEN status = 'abandoned' THEN 1 ELSE 0 END) as abandoned_carts,
                    SUM(CASE WHEN status = 'locked' THEN 1 ELSE 0 END) as locked_carts,
                    SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_carts,
                    ROUND(
                        SUM(CASE WHEN status = 'abandoned' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
                        2
                    ) as abandonment_rate
                FROM cards
                WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
            `);

            this.logger.log('📊 Weekly Cart Stats:', JSON.stringify(stats[0], null, 2));
        } catch (error) {
            this.logger.error('❌ Error generating stats:', error.stack);
        }
    }
}
