import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * سرویس مدیریت Cache برای Order
 * ⚠️ این سرویس فقط برای خواندن استفاده می‌شود
 * ⚠️ هیچ تغییری در لاجیک Order Service ایجاد نمی‌کند
 */
@Injectable()
export class OrderCacheService {
    /**
     * کلیدهای Cache
     */
    private readonly CACHE_KEYS = {
        // لیست سفارشات ادمین با فیلتر و pagination
        ADMIN_ORDER_LIST: (page: number, limit: number, filters: string) =>
            `order:admin:list:${page}:${limit}:${filters}`,

        // لیست سفارشات یک کاربر
        USER_ORDER_LIST: (userId: number) =>
            `order:user:${userId}:list`,

        // جزئیات یک سفارش
        ORDER_DETAIL: (orderId: number) =>
            `order:detail:${orderId}`,

        // جزئیات سفارش برای یک کاربر (با بررسی دسترسی)
        USER_ORDER_DETAIL: (userId: number, orderId: number) =>
            `order:user:${userId}:detail:${orderId}`,

        // آمار سفارشات (برای داشبورد ادمین)
        ORDER_STATS: () =>
            `order:stats:all`,

        // آمار سفارشات یک کاربر
        USER_ORDER_STATS: (userId: number) =>
            `order:stats:user:${userId}`,

        // سفارش در انتظار پرداخت یک کاربر
        USER_PENDING_ORDER: (userId: number) =>
            `order:pending:user:${userId}`,
    };

    /**
     * مدت زمان Cache (به میلی‌ثانیه)
     * ⚠️ توجه: cache-manager-redis-yet از میلی‌ثانیه استفاده می‌کند
     */
    private readonly CACHE_TTL = {
        ADMIN_LIST: 300 * 1000,         // 5 دقیقه - لیست ادمین
        USER_LIST: 600 * 1000,          // 10 دقیقه - لیست کاربر
        ORDER_DETAIL: 600 * 1000,       // 10 دقیقه - جزئیات سفارش
        STATS: 900 * 1000,              // 15 دقیقه - آمار
        PENDING_ORDER: 60 * 1000,       // 1 دقیقه - سفارش در انتظار (کوتاه‌مدت)
    };

    constructor(
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache,
    ) { }

    // ==================== لیست سفارشات ادمین ====================

    async getAdminOrderList(page: number, limit: number, filters: string): Promise<any> {
        return await this.cacheManager.get(
            this.CACHE_KEYS.ADMIN_ORDER_LIST(page, limit, filters)
        );
    }

    async setAdminOrderList(page: number, limit: number, filters: string, data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.ADMIN_ORDER_LIST(page, limit, filters),
            data,
            this.CACHE_TTL.ADMIN_LIST
        );
    }

    // ==================== لیست سفارشات کاربر ====================

    async getUserOrderList(userId: number): Promise<any> {
        const key = this.CACHE_KEYS.USER_ORDER_LIST(userId);
        console.log('🔍 [GET] Key:', key);

        const result = await this.cacheManager.get(key);
        console.log('📦 [GET] Result:', result ? 'موجوده ✅' : 'خالیه ❌');

        return result;
    }

    async setUserOrderList(userId: number, data: any): Promise<void> {
        const key = this.CACHE_KEYS.USER_ORDER_LIST(userId);
        console.log('💾 [SET] Key:', key);
        console.log('💾 [SET] Data length:', data?.length);

        await this.cacheManager.set(key, data, this.CACHE_TTL.USER_LIST);

        console.log('✅ [SET] Saved!');
    }

    // ==================== جزئیات سفارش ====================

    async getOrderDetail(orderId: number): Promise<any> {
        return await this.cacheManager.get(
            this.CACHE_KEYS.ORDER_DETAIL(orderId)
        );
    }

    async setOrderDetail(orderId: number, data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.ORDER_DETAIL(orderId),
            data,
            this.CACHE_TTL.ORDER_DETAIL
        );
    }

    // ==================== جزئیات سفارش برای کاربر ====================

    async getUserOrderDetail(userId: number, orderId: number): Promise<any> {
        return await this.cacheManager.get(
            this.CACHE_KEYS.USER_ORDER_DETAIL(userId, orderId)
        );
    }

    async setUserOrderDetail(userId: number, orderId: number, data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.USER_ORDER_DETAIL(userId, orderId),
            data,
            this.CACHE_TTL.ORDER_DETAIL
        );
    }

    // ==================== آمار سفارشات ====================

    async getOrderStats(): Promise<any> {
        return await this.cacheManager.get(
            this.CACHE_KEYS.ORDER_STATS()
        );
    }

    async setOrderStats(data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.ORDER_STATS(),
            data,
            this.CACHE_TTL.STATS
        );
    }

    // ==================== آمار سفارشات کاربر ====================

    async getUserOrderStats(userId: number): Promise<any> {
        return await this.cacheManager.get(this.CACHE_KEYS.USER_ORDER_STATS(userId)
        );
    }

    async setUserOrderStats(userId: number, data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.USER_ORDER_STATS(userId),
            data,
            this.CACHE_TTL.STATS
        );
    }

    // ==================== سفارش در انتظار ====================

    async getPendingOrder(userId: number): Promise<any> {
        return await this.cacheManager.get(
            this.CACHE_KEYS.USER_PENDING_ORDER(userId)
        );
    }

    async setPendingOrder(userId: number, data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.USER_PENDING_ORDER(userId),
            data,
            this.CACHE_TTL.PENDING_ORDER
        );
    }

    // ==================== پاک‌سازی Cache ====================

    /**
     * پاک کردن کامل cache سفارشات
     * 🔴 استفاده: وقتی تغییرات گسترده در سیستم سفارش‌ها داریم
     */
    async clearAllOrderCache(): Promise<void> {
        try {
            // @ts-ignore
            const keys = await this.cacheManager.store.keys();
            const orderKeys = keys.filter((key: string) =>
                key.startsWith('order:')
            );

            await Promise.all(
                orderKeys.map((key: string) => this.cacheManager.del(key))
            );

            console.log(`🗑️ [OrderCache] پاک شد ${orderKeys.length} کلید cache سفارش`);
        } catch (error) {
            console.error('❌ [OrderCache] خطا در پاک کردن کامل cache:', error);
        }
    }

    /**
     * پاک کردن cache یک سفارش خاص
     * 🔴 استفاده: بعد از هر تغییر در وضعیت یا جزئیات سفارش
     */
    async clearOrderCache(orderId: number, userId?: number): Promise<void> {
        try {
            // پاک کردن جزئیات سفارش
            await this.cacheManager.del(this.CACHE_KEYS.ORDER_DETAIL(orderId));

            // پاک کردن جزئیات سفارش برای کاربر
            if (userId) {
                await this.cacheManager.del(
                    this.CACHE_KEYS.USER_ORDER_DETAIL(userId, orderId)
                );
            }

            console.log(`🗑️ [OrderCache] Cache پاک شد برای سفارش ${orderId}`);
        } catch (error) {
            console.error(`❌ [OrderCache] خطا در پاک کردن cache سفارش ${orderId}:`, error);
        }
    }

    /**
     * پاک کردن cache لیست سفارشات یک کاربر
     * 🔴 استفاده: بعد از ایجاد، حذف یا تغییر سفارش کاربر
     */
    async clearUserOrderCache(userId: number): Promise<void> {
        try {
            // پاک کردن لیست سفارشات کاربر
            await this.cacheManager.del(this.CACHE_KEYS.USER_ORDER_LIST(userId));

            // پاک کردن آمار کاربر
            await this.cacheManager.del(this.CACHE_KEYS.USER_ORDER_STATS(userId));

            // پاک کردن سفارش در انتظار
            await this.cacheManager.del(this.CACHE_KEYS.USER_PENDING_ORDER(userId));

            // پاک کردن همه جزئیات سفارشات این کاربر
            // @ts-ignore
            const keys = await this.cacheManager.store.keys();
            const userDetailKeys = keys.filter((key: string) =>
                key.startsWith(`order:user:${userId}:detail:`)
            );

            await Promise.all(
                userDetailKeys.map((key: string) => this.cacheManager.del(key))
            );

            console.log(`🗑️ [OrderCache] Cache کاربر ${userId} پاک شد`);
        } catch (error) {
            console.error(`❌ [OrderCache] خطا در پاک کردن cache کاربر ${userId}:`, error);
        }
    }

    /**
     * پاک کردن cache لیست‌های ادمین
     * 🔴 استفاده: بعد از هر تغییر در سفارشات
     */
    async clearAdminListCache(): Promise<void> {
        try {
            // @ts-ignore
            const keys = await this.cacheManager.store.keys();
            const adminListKeys = keys.filter((key: string) =>
                key.startsWith('order:admin:list:')
            );

            await Promise.all(
                adminListKeys.map((key: string) => this.cacheManager.del(key))
            );

            console.log(`🗑️ [OrderCache] Cache لیست ادمین پاک شد (${adminListKeys.length} کلید)`);
        } catch (error) {
            console.error('❌ [OrderCache] خطا در پاک کردن cache لیست ادمین:', error);
        }
    }

    /**
     * پاک کردن cache آمار
     * 🔴 استفاده: بعد از تغییرات مهم در سفارشات
     */
    async clearStatsCache(): Promise<void> {
        try {
            // @ts-ignore
            const keys = await this.cacheManager.store.keys();
            const statsKeys = keys.filter((key: string) =>
                key.startsWith('order:stats:')
            );

            await Promise.all(
                statsKeys.map((key: string) => this.cacheManager.del(key))
            );

            console.log(`🗑️ [OrderCache] Cache آمار پاک شد`);
        } catch (error) {
            console.error('❌ [OrderCache] خطا در پاک کردن cache آمار:', error);
        }
    }

    /**
     * پاک کردن cache بعد از ایجاد سفارش جدید
     * 🔴 استفاده: در createFromCard و createManualOrder
     */
    async clearCacheAfterCreate(userId: number): Promise<void> {
        await Promise.all([
            this.clearUserOrderCache(userId),
            this.clearAdminListCache(),
            this.clearStatsCache(),
        ]);
        console.log(`✅ [OrderCache] Cache پاک شد بعد از ایجاد سفارش کاربر ${userId}`);
    }

    /**
     * پاک کردن cache بعد از تغییر وضعیت سفارش
     * 🔴 استفاده: در updateStatus, confirmOrderPayment, markAsDelivered, cancelOrder, refundOrder
     */
    async clearCacheAfterStatusChange(orderId: number, userId: number): Promise<void> {
        await Promise.all([
            this.clearOrderCache(orderId, userId),
            this.clearUserOrderCache(userId),
            this.clearAdminListCache(),
            this.clearStatsCache(),
        ]);
        console.log(`✅ [OrderCache] Cache پاک شد بعد از تغییر وضعیت سفارش ${orderId}`);
    }

    /**
     * پاک کردن cache بعد از حذف سفارش
     * 🔴 استفاده: در remove
     */
    async clearCacheAfterDelete(orderId: number, userId: number): Promise<void> {
        await Promise.all([
            this.clearOrderCache(orderId, userId),
            this.clearUserOrderCache(userId),
            this.clearAdminListCache(),
            this.clearStatsCache(),
        ]);
        console.log(`✅ [OrderCache] Cache پاک شد بعد از حذف سفارش ${orderId}`);
    }

    /**
     * گرفتن آمار cache
     */
    async getCacheStats(): Promise<{
        totalKeys: number;
        adminListKeys: number;
        userListKeys: number;
        detailKeys: number;
        statsKeys: number;
    }> {
        try {
            // @ts-ignore
            const keys = await this.cacheManager.store.keys();
            const orderKeys = keys.filter((key: string) =>
                key.startsWith('order:')
            );

            const adminListKeys = orderKeys.filter((key: string) =>
                key.startsWith('order:admin:list:')
            );

            const userListKeys = orderKeys.filter((key: string) =>
                key.startsWith('order:user:') && key.includes(':list')
            );

            const detailKeys = orderKeys.filter((key: string) =>
                key.startsWith('order:detail:') ||
                key.includes(':detail:')
            );

            const statsKeys = orderKeys.filter((key: string) =>
                key.startsWith('order:stats:')
            );

            return {
                totalKeys: orderKeys.length,
                adminListKeys: adminListKeys.length,
                userListKeys: userListKeys.length,
                detailKeys: detailKeys.length,
                statsKeys: statsKeys.length,
            };
        } catch (error) {
            console.error('❌ [OrderCache] خطا در گرفتن آمار cache:', error);
            return {
                totalKeys: 0,
                adminListKeys: 0,
                userListKeys: 0,
                detailKeys: 0,
                statsKeys: 0,
            };
        }
    }
}
