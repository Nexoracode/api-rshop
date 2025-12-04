import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, LessThan } from 'typeorm';
import { Order } from '../order/entities/order.entity';
import { OrderStatus } from '../order/enums/order-status.enum';
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

    /**
     * هر 10 دقیقه یکبار Order های منقضی شده رو چک کن
     * Order هایی که بیش از 30 دقیقه در وضعیت AWAITING_PAYMENT هستند
     */
    @Cron(CronExpression.EVERY_10_MINUTES)
    async handleExpiredOrders() {
        this.logger.log('🕐 Checking for expired orders...');

        const timeoutMinutes = 30;
        const timeoutDate = new Date();
        timeoutDate.setMinutes(timeoutDate.getMinutes() - timeoutMinutes);

        try {
            const result = await runInTransaction(this.dataSource, async (manager) => {
                // پیدا کردن Order های منقضی
                const expiredOrders = await manager.find(Order, {
                    where: {
                        status: OrderStatus.AWAITING_PAYMENT,
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
                    await manager.save(Order, order);

                    // 2. آزاد کردن Cart
                    await this.cardStatusService.unlockCart(order.user.id, manager);

                    this.logger.log(`✅ Order ${order.id} expired and cart unlocked for user ${order.user.id}`);
                }

                return { count: expiredOrders.length };
            });

            if (result.count > 0) {
                this.logger.log(`✅ Successfully expired ${result.count} orders`);
            }
        } catch (error) {
            this.logger.error('❌ Error expiring orders:', error);
        }
    }

    /**
     * هر روز ساعت 2 صبح Cart های قدیمی LOCKED رو Abandon کن
     * Cart هایی که Order هاشون DELIVERED, CANCELLED, یا REFUNDED هستند
     */
    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async handleOldLockedCarts() {
        this.logger.log('🧹 Cleaning up old locked carts...');

        try {
            const result = await runInTransaction(this.dataSource, async (manager) => {
                // پیدا کردن Order های تکمیل شده که Cart هاشون هنوز LOCKED هستند
                const completedOrders = await manager.find(Order, {
                    where: [
                        { status: OrderStatus.DELIVERED },
                        { status: OrderStatus.CANCELLED },
                        { status: OrderStatus.REFUNDED },
                    ],
                    relations: ['user'],
                });

                if (completedOrders.length === 0) {
                    return { count: 0 };
                }

                const uniqueUserIds = [...new Set(completedOrders.map(o => o.user.id))];
                this.logger.log(`🔍 Found ${completedOrders.length} completed orders from ${uniqueUserIds.length} users`);

                for (const userId of uniqueUserIds) {
                    await this.cardStatusService.abandonCart(userId, manager);
                }

                return { count: uniqueUserIds.length };
            });

            if (result.count > 0) {
                this.logger.log(`✅ Successfully abandoned carts for ${result.count} users`);
            }
        } catch (error) {
            this.logger.error('❌ Error abandoning carts:', error);
        }
    }

    /**
     * هر هفته یکبار گزارش آمار Cart Abandonment
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

            this.logger.log('📊 Weekly Cart Stats:', stats[0]);
        } catch (error) {
            this.logger.error('❌ Error generating stats:', error);
        }
    }
}