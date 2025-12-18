import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, In } from 'typeorm';
import { Card, CardStatus } from './entities/card.entity';

@Injectable()
export class CardStatusService {
    constructor(
        @InjectRepository(Card)
        private readonly cardRepo: Repository<Card>,
    ) { }

    /**
     * لاک کردن Cart وقتی Order ایجاد می‌شه
     */
    async lockCart(userId: number, manager?: EntityManager): Promise<void> {
        const repo = manager ? manager.getRepository(Card) : this.cardRepo;

        await repo.update(
            {
                user: { id: userId },
                status: CardStatus.OPEN
            },
            { status: CardStatus.LOCKED }
        );
    }

    /**
     * آزاد کردن Cart (برای تلاش مجدد)
     * زمان استفاده:
     * - پرداخت رد شد
     * - Order منقضی شد
     * - پرداخت fail شد
     */
    async unlockCart(userId: number, manager?: EntityManager): Promise<void> {
        const repo = manager ? manager.getRepository(Card) : this.cardRepo;

        await repo.update(
            {
                user: { id: userId },
                status: CardStatus.LOCKED
            },
            { status: CardStatus.OPEN }
        );
    }

    /**
     * Abandon کردن Cart
     * زمان استفاده:
     * - سفارش تحویل داده شد (DELIVERED)
     * - سفارش لغو شد (CANCELLED)
     * - سفارش refund شد (REFUNDED)
     * - پرداخت موفق شد (کارت به کارت تایید شد)
     */
    async abandonCart(userId: number, manager?: EntityManager): Promise<void> {
        const repo = manager ? manager.getRepository(Card) : this.cardRepo;

        await repo.update(
            {
                user: { id: userId },
                status: CardStatus.LOCKED
            },
            { status: CardStatus.ABANDONED }
        );
    }

    /**
     * ایجاد Cart جدید و Abandon کردن Cart قبلی
     * ✅ FIX: حالا ABANDONED cart ها رو هم handle می‌کنه
     */
    async getOrCreateOpenCart(userId: number, manager?: EntityManager): Promise<Card> {
        const repo = manager ? manager.getRepository(Card) : this.cardRepo;

        // ✅ 1. بررسی Cart باز
        let openCart = await repo.findOne({
            where: {
                user: { id: userId },
                status: CardStatus.OPEN,
            },
        });

        if (openCart) {
            return openCart;
        }

        // ✅ 2. Abandon کردن Cart های LOCKED یا ABANDONED قدیمی
        // (اگه کاربر Cart قدیمی ABANDONED داره، اون رو نگه می‌داریم)
        await repo.update(
            {
                user: { id: userId },
                status: In([CardStatus.LOCKED, CardStatus.OPEN]), // ✅ OPEN هم شامل میشه (برای safety)
            },
            { status: CardStatus.ABANDONED }
        );

        // ✅ 3. ایجاد Cart جدید
        const newCart = repo.create({
            user: { id: userId },
            status: CardStatus.OPEN,
            itemsCount: 0,
            totalQuantity: 0,
            subtotal: 0,
            discountTotal: 0,
            total: 0,
        });

        return await repo.save(newCart);
    }

    /**
     * ✅ NEW: پاک کردن Cart های قدیمی ABANDONED
     * می‌تونه توسط Cron Job روزانه اجرا بشه
     */
    async cleanupAbandonedCarts(daysOld: number = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.setDate(cutoffDate.getDate() - daysOld));

        const result = await this.cardRepo
            .createQueryBuilder()
            .delete()
            .from(Card)
            .where('status = :status', { status: CardStatus.ABANDONED })
            .andWhere('updated_at < :cutoffDate', { cutoffDate })
            .execute();

        return result.affected || 0;
    }
}
