import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, LessThan } from 'typeorm';
import { Card, CardStatus } from './entities/card.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class CardStatusService {
    private readonly logger = new Logger(CardStatusService.name);

    constructor(
        @InjectRepository(Card)
        private readonly cardRepo: Repository<Card>,
    ) { }

    // ═══════════════════════════════════════════════════════════════
    // 🛒 دریافت یا ایجاد Cart فعال کاربر
    // ═══════════════════════════════════════════════════════════════
    /**
     * ✅ دریافت Cart فعال (OPEN) کاربر
     * اگه نداشت، یکی جدید می‌سازه
     * 
     * ⚠️ CRITICAL: هر کاربر فقط یک Cart OPEN داره
     */
    async getOrCreateActiveCart(
        userId: number,
        manager?: EntityManager,
    ): Promise<Card> {
        const repo = manager ? manager.getRepository(Card) : this.cardRepo;

        // ✅ پیدا کردن Cart فعال
        let activeCart = await repo.findOne({
            where: {
                user: { id: userId },
                status: CardStatus.OPEN,
            },
            relations: ['user'],
            order: {
                createdAt: 'DESC', // جدیدترین Cart
            },
        });

        if (activeCart) {
            this.logger.debug(`Found active cart ${activeCart.id} for user ${userId}`);
            return activeCart;
        }

        // ✅ ایجاد Cart جدید
        const user = await (manager ? manager : this.cardRepo.manager)
            .getRepository(User)
            .findOne({ where: { id: userId } });

        if (!user) {
            throw new Error(`User ${userId} not found`);
        }

        activeCart = repo.create({
            user,
            status: CardStatus.OPEN,
        });

        await repo.save(activeCart);
        this.logger.log(`Created new cart ${activeCart.id} for user ${userId}`);

        return activeCart;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔒 قفل کردن Cart (وقتی Order می‌سازیم)
    // ═══════════════════════════════════════════════════════════════
    /**
     * ✅ قفل کردن Cart فعال کاربر
     * این کار قبل از رفتن به درگاه پرداخت انجام می‌شه
     * 
     * ⚠️ CRITICAL: فقط Cart های OPEN رو lock می‌کنه
     */
    async lockCart(userId: number, manager?: EntityManager): Promise<void> {
        const repo = manager ? manager.getRepository(Card) : this.cardRepo;

        // ✅ فقط Cart های OPEN رو lock کن
        const result = await repo.update(
            {
                user: { id: userId },
                status: CardStatus.OPEN,
            },
            {
                status: CardStatus.LOCKED,
            },
        );

        if (result.affected === 0) {
            this.logger.warn(`No open cart found to lock for user ${userId}`);
        } else {
            this.logger.log(`Locked ${result.affected} cart(s) for user ${userId}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔓 باز کردن قفل Cart (پرداخت کنسل/ناموفق شد)
    // ═══════════════════════════════════════════════════════════════
    /**
     * ✅ باز کردن قفل Cart کاربر
     * این کار وقتی پرداخت کنسل یا ناموفق می‌شه انجام می‌شه
     * 
     * ⚠️ CRITICAL: فقط Cart های LOCKED رو unlock می‌کنه
     */
    async unlockCart(userId: number, manager?: EntityManager): Promise<void> {
        const repo = manager ? manager.getRepository(Card) : this.cardRepo;

        // ✅ فقط Cart های LOCKED رو unlock کن
        const result = await repo.update(
            {
                user: { id: userId },
                status: CardStatus.LOCKED,
            },
            {
                status: CardStatus.OPEN,
            },
        );

        if (result.affected === 0) {
            this.logger.warn(`No locked cart found to unlock for user ${userId}`);
        } else {
            this.logger.log(`Unlocked ${result.affected} cart(s) for user ${userId}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🗑️ رها کردن Cart (پرداخت موفق شد)
    // ═══════════════════════════════════════════════════════════════
    /**
     * ✅ رها کردن Cart قدیمی و ایجاد Cart جدید
     * این کار فقط وقتی پرداخت موفق می‌شه انجام می‌شه
     * 
     * گام‌ها:
     * 1. تمام Cart های LOCKED این کاربر رو ABANDONED کن
     * 2. یک Cart جدید OPEN بساز
     * 
     * ⚠️ CRITICAL: این تضمین می‌کنه کاربر فقط یک Cart OPEN داره
     */
    async abandonCart(userId: number, manager?: EntityManager): Promise<void> {
        const repo = manager ? manager.getRepository(Card) : this.cardRepo;

        // ✅ STEP 1: تمام Cart های LOCKED رو ABANDONED کن
        const result = await repo.update(
            {
                user: { id: userId },
                status: CardStatus.LOCKED,
            },
            {
                status: CardStatus.ABANDONED,
            },
        );

        this.logger.log(
            `Abandoned ${result.affected} cart(s) for user ${userId} after successful payment`,
        );

        // ✅ STEP 2: یک Cart جدید OPEN بساز
        await this.getOrCreateActiveCart(userId, manager);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🧹 پاک‌سازی Cart های ABANDONED قدیمی
    // ═══════════════════════════════════════════════════════════════
    /**
     * ✅ پاک کردن Cart های ABANDONED که X روز قدمت دارند
     * این کار برای کاهش حجم دیتابیس انجام می‌شه
     */
    async cleanupAbandonedCarts(daysOld: number = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await this.cardRepo.delete({
            status: CardStatus.ABANDONED,
            createdAt: LessThan(cutoffDate),
        });

        return result.affected ?? 0;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔧 ابزار: تعمیر Cart های duplicate
    // ═══════════════════════════════════════════════════════════════
    /**
     * ✅ یکبار اجرا کن تا Cart های duplicate رو تمیز کنه
     * 
     * این متد:
     * 1. پیدا می‌کنه کاربرایی که بیش از یک Cart OPEN دارن
     * 2. جدیدترین Cart رو نگه می‌داره
     * 3. بقیه رو ABANDONED می‌کنه
     */
    async fixDuplicateCarts(): Promise<{
        affectedUsers: number;
        abandonedCarts: number;
    }> {
        this.logger.log('🔧 Starting duplicate cart cleanup...');

        // پیدا کردن کاربرایی که بیش از یک Cart OPEN دارن
        const duplicates = await this.cardRepo
            .createQueryBuilder('card')
            .select('card.user_id', 'userId')
            .addSelect('COUNT(*)', 'count')
            .where('card.status = :status', { status: CardStatus.OPEN })
            .groupBy('card.user_id')
            .having('COUNT(*) > 1')
            .getRawMany();

        if (duplicates.length === 0) {
            this.logger.log('✅ No duplicate carts found');
            return { affectedUsers: 0, abandonedCarts: 0 };
        }

        this.logger.warn(`Found ${duplicates.length} users with duplicate carts`);

        let totalAbandoned = 0;

        for (const dup of duplicates) {
            const userId = dup.userId;

            // پیدا کردن تمام Cart های OPEN این کاربر
            const userCarts = await this.cardRepo.find({
                where: {
                    user: { id: userId },
                    status: CardStatus.OPEN,
                },
                order: {
                    createdAt: 'DESC', // جدیدترین اول
                },
            });

            // اولی (جدیدترین) رو نگه دار، بقیه رو abandon کن
            const [keepCart, ...abandonCarts] = userCarts;

            this.logger.log(
                `User ${userId}: Keeping cart ${keepCart.id}, abandoning ${abandonCarts.length} cart(s)`,
            );

            for (const cart of abandonCarts) {
                cart.status = CardStatus.ABANDONED;
                await this.cardRepo.save(cart);
                totalAbandoned++;
            }
        }

        this.logger.log(
            `✅ Fixed ${duplicates.length} users, abandoned ${totalAbandoned} duplicate carts`,
        );

        return {
            affectedUsers: duplicates.length,
            abandonedCarts: totalAbandoned,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // 📊 ابزار: گزارش وضعیت Cart ها
    // ═══════════════════════════════════════════════════════════════
    /**
     * ✅ گزارش تعداد Cart های هر کاربر
     */
    async getCartStatusReport(): Promise<any> {
        const report = await this.cardRepo.query(`
            SELECT 
                u.id as user_id,
                u.phone,
                u.email,
                COUNT(CASE WHEN c.status = 'open' THEN 1 END) as open_carts,
                COUNT(CASE WHEN c.status = 'locked' THEN 1 END) as locked_carts,
                COUNT(CASE WHEN c.status = 'abandoned' THEN 1 END) as abandoned_carts,
                COUNT(*) as total_carts
            FROM users u
            LEFT JOIN cards c ON c.user_id = u.id
            GROUP BY u.id, u.phone, u.email
            HAVING open_carts > 1 OR locked_carts > 1
            ORDER BY open_carts DESC, locked_carts DESC
        `);

        return report;
    }

    // ═══════════════════════════════════════════════════════════════
    // 📊 ابزار: آمار کلی Cart ها
    // ═══════════════════════════════════════════════════════════════
    /**
     * ✅ آمار کلی Cart ها به تفکیک وضعیت
     */
    async getCartStats(): Promise<any> {
        const stats = await this.cardRepo.query(`
            SELECT 
                status,
                COUNT(*) as count,
                COUNT(DISTINCT user_id) as unique_users
            FROM cards
            GROUP BY status
            ORDER BY count DESC
        `);

        return stats;
    }
}
