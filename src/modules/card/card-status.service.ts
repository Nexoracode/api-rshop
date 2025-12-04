import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Card, CardStatus } from './entities/card.entity';
import { Order } from '../order/entities/order.entity';
import { OrderStatus } from '../order/enums/order-status.enum';

@Injectable()
export class CardStatusService {
    constructor(
        @InjectRepository(Card)
        private readonly cardRepo: Repository<Card>,
    ) {}

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
     */
    async getOrCreateOpenCart(userId: number, manager?: EntityManager): Promise<Card> {
        const repo = manager ? manager.getRepository(Card) : this.cardRepo;

        // بررسی Cart باز
        let openCart = await repo.findOne({
            where: {
                user: { id: userId },
                status: CardStatus.OPEN,
            },
        });

        if (openCart) {
            return openCart;
        }

        // Abandon کردن Cart های LOCKED قدیمی
        await this.abandonCart(userId, manager);

        // ایجاد Cart جدید
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
}
