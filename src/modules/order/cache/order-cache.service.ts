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

    /**
     * Namespace برای Redis (از config شما)
     */
    private readonly NAMESPACE = 'rshop';

    constructor(
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache,
    ) { }

    /**
     * دریافت store اول از لیست stores
     */
    private getStore(): any {
        const stores: any = this.cacheManager.stores;

        // اگر stores یک آرایه است، اولین store رو برمی‌گردونه
        if (Array.isArray(stores) && stores.length > 0) {
            return stores[0];
        }

        // اگر stores یک شیء است
        if (stores && typeof stores === 'object') {
            return stores;
        }

        return null;
    }

    /**
     * دریافت Redis Client از store
     */
    private getRedisClient(): any {
        const stores: any = this.cacheManager.stores;

        if (Array.isArray(stores) && stores.length > 0) {
            const store = stores[0];

            // ✅ دسترسی به Redis از wrapper سفارشی
            if (store?.opts?.store?.redis) {
                return store.opts.store.redis;
            }

            // سایر مسیرها
            if (store?.redis) {
                return store.redis;
            }

            if (store?._store?.redis) {
                return store._store.redis;
            }
        }

        if (stores && typeof stores === 'object' && !Array.isArray(stores)) {
            if (stores?.opts?.store?.redis) {
                return stores.opts.store.redis;
            }

            if (stores?.redis) {
                return stores.redis;
            }
        }

        return null;
    }

    // ==================== لیست سفارشات ادمین ====================

    async getAdminOrderList(page: number, limit: number, filters: string): Promise<any> {
        console.log('✅ get order list in catch');
        return await this.cacheManager.get(
            this.CACHE_KEYS.ADMIN_ORDER_LIST(page, limit, filters)
        );
    }

    async setAdminOrderList(page: number, limit: number, filters: string, data: any): Promise<void> {
        console.log('📦 save order in catch')
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
        return await this.cacheManager.get(
            this.CACHE_KEYS.USER_ORDER_STATS(userId)
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
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                console.log('🔍 پاک کردن تمام cache سفارشات با Redis...');

                const pattern = `${this.NAMESPACE}:order:*`;
                const keys = await redisClient.keys(pattern);

                if (keys && keys.length > 0) {
                    const pipeline = redisClient.pipeline();
                    keys.forEach((key: string) => pipeline.del(key));
                    await pipeline.exec();

                    console.log(`✅ ${keys.length} کلید cache سفارش پاک شد`);
                } else {
                    console.log('ℹ️ هیچ کلید سفارشی برای پاک کردن پیدا نشد');
                }
                return;
            }

            // فال‌بک: استفاده از Iterator
            const store = this.getStore();

            if (store && typeof store.iterator === 'function') {
                console.log('🔍 پاک کردن cache سفارشات با Iterator...');

                const keysToDelete: string[] = [];

                for await (const [key] of store.iterator(this.NAMESPACE)) {
                    if (key.startsWith('order:')) {
                        keysToDelete.push(key);
                    }
                }

                if (keysToDelete.length > 0) {
                    await Promise.allSettled(
                        keysToDelete.map(key => this.cacheManager.del(key))
                    );
                    console.log(`✅ ${keysToDelete.length} کلید cache سفارش پاک شد`);
                }
                return;
            }

            console.warn('⚠️ امکان پاک کردن کامل cache موجود نیست');
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

            console.log(`✅ [OrderCache] Cache سفارش ${orderId} پاک شد`);
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
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                const pattern = `${this.NAMESPACE}:order:user:${userId}:detail:*`;
                const keys = await redisClient.keys(pattern);

                if (keys && keys.length > 0) {
                    const pipeline = redisClient.pipeline();
                    keys.forEach((key: string) => pipeline.del(key));
                    await pipeline.exec();
                }
            } else {
                // فال‌بک با Iterator
                const store = this.getStore();

                if (store && typeof store.iterator === 'function') {
                    const keysToDelete: string[] = [];

                    for await (const [key] of store.iterator(this.NAMESPACE)) {
                        if (key.startsWith(`order:user:${userId}:detail:`)) {
                            keysToDelete.push(key);
                        }
                    }

                    if (keysToDelete.length > 0) {
                        await Promise.allSettled(
                            keysToDelete.map(key => this.cacheManager.del(key))
                        );
                    }
                }
            }

            console.log(`✅ [OrderCache] Cache کاربر ${userId} پاک شد`);
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
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                const pattern = `${this.NAMESPACE}:order:admin:list:*`;
                const keys = await redisClient.keys(pattern);

                if (keys && keys.length > 0) {
                    const pipeline = redisClient.pipeline();
                    keys.forEach((key: string) => pipeline.del(key));
                    await pipeline.exec();

                    console.log(`✅ [OrderCache] Cache لیست ادمین پاک شد (${keys.length} کلید)`);
                }
                return;
            }

            // فال‌بک
            const store = this.getStore();

            if (store && typeof store.iterator === 'function') {
                const keysToDelete: string[] = [];

                for await (const [key] of store.iterator(this.NAMESPACE)) {
                    if (key.startsWith('order:admin:list:')) {
                        keysToDelete.push(key);
                    }
                }

                if (keysToDelete.length > 0) {
                    await Promise.allSettled(
                        keysToDelete.map(key => this.cacheManager.del(key))
                    );
                    console.log(`✅ [OrderCache] Cache لیست ادمین پاک شد (${keysToDelete.length} کلید)`);
                }
            }
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
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                const pattern = `${this.NAMESPACE}:order:stats:*`;
                const keys = await redisClient.keys(pattern);

                if (keys && keys.length > 0) {
                    const pipeline = redisClient.pipeline();
                    keys.forEach((key: string) => pipeline.del(key));
                    await pipeline.exec();

                    console.log(`✅ [OrderCache] Cache آمار پاک شد`);
                }
                return;
            }

            // فال‌بک
            const store = this.getStore();

            if (store && typeof store.iterator === 'function') {
                const keysToDelete: string[] = [];

                for await (const [key] of store.iterator(this.NAMESPACE)) {
                    if (key.startsWith('order:stats:')) {
                        keysToDelete.push(key);
                    }
                }

                if (keysToDelete.length > 0) {
                    await Promise.allSettled(
                        keysToDelete.map(key => this.cacheManager.del(key))
                    );
                    console.log(`✅ [OrderCache] Cache آمار پاک شد`);
                }
            }
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
     * پاک کردن cache با pattern
     */
    async clearCacheByPattern(pattern: string): Promise<number> {
        try {
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                const fullPattern = `${this.NAMESPACE}:${pattern}`;
                const keys = await redisClient.keys(fullPattern);

                if (keys && keys.length > 0) {
                    const pipeline = redisClient.pipeline();
                    keys.forEach((key: string) => pipeline.del(key));
                    await pipeline.exec();

                    console.log(`✅ ${keys.length} کلید با pattern "${pattern}" پاک شد`);
                    return keys.length;
                }
            }

            return 0;
        } catch (error) {
            console.error(`❌ خطا در پاک کردن cache با pattern "${pattern}":`, error);
            return 0;
        }
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
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                const pattern = `${this.NAMESPACE}:order:*`;
                const keys = await redisClient.keys(pattern);

                if (!keys || keys.length === 0) {
                    return {
                        totalKeys: 0,
                        adminListKeys: 0,
                        userListKeys: 0,
                        detailKeys: 0,
                        statsKeys: 0,
                    };
                }

                // حذف namespace از کلیدها برای بررسی
                const cleanKeys = keys.map((key: string) =>
                    key.replace(`${this.NAMESPACE}:`, '')
                );

                const adminListKeys = cleanKeys.filter((key: string) =>
                    key.startsWith('order:admin:list:')
                );

                const userListKeys = cleanKeys.filter((key: string) =>
                    key.startsWith('order:user:') && key.includes(':list')
                );

                const detailKeys = cleanKeys.filter((key: string) =>
                    key.startsWith('order:detail:') ||
                    key.includes(':detail:')
                );

                const statsKeys = cleanKeys.filter((key: string) =>
                    key.startsWith('order:stats:')
                );

                return {
                    totalKeys: keys.length,
                    adminListKeys: adminListKeys.length,
                    userListKeys: userListKeys.length,
                    detailKeys: detailKeys.length,
                    statsKeys: statsKeys.length,
                };
            }

            return {
                totalKeys: 0,
                adminListKeys: 0,
                userListKeys: 0,
                detailKeys: 0,
                statsKeys: 0,
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

    /**
     * بررسی سلامت Redis
     */
    async checkRedisHealth(): Promise<{
        isConnected: boolean;
        canRead: boolean;
        canWrite: boolean;
        storeType: string;
        message: string;
    }> {
        try {
            const store = this.getStore();
            const redisClient = this.getRedisClient();

            if (!store) {
                return {
                    isConnected: false,
                    canRead: false,
                    canWrite: false,
                    storeType: 'none',
                    message: '❌ Store موجود نیست'
                };
            }

            if (!redisClient) {
                return {
                    isConnected: false,
                    canRead: false,
                    canWrite: false,
                    storeType: 'memory',
                    message: '⚠️ Redis Client موجود نیست - احتمالاً از memory cache استفاده می‌شود'
                };
            }

            // تست نوشتن
            const testKey = 'health:check:order:test';
            await this.cacheManager.set(testKey, 'test', 5000);

            // تست خواندن
            const testValue = await this.cacheManager.get(testKey);

            // پاک کردن کلید تست
            await this.cacheManager.del(testKey);

            return {
                isConnected: true,
                canRead: testValue === 'test',
                canWrite: true,
                storeType: 'redis',
                message: '✅ Redis سالم است و به درستی کار می‌کند'
            };
        } catch (error) {
            console.error('❌ [OrderCache] خطا در بررسی سلامت Redis:', error);
            return {
                isConnected: false,
                canRead: false,
                canWrite: false,
                storeType: 'unknown',
                message: `❌ خطا: ${error.message}`
            };
        }
    }
}