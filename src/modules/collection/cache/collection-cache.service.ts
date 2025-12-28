// src/collection/services/collection-cache.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * سرویس مدیریت Cache برای Collection
 */
@Injectable()
export class CollectionCacheService {
    private readonly logger = new Logger(CollectionCacheService.name);

    /**
     * کلیدهای Cache
     */
    private readonly CACHE_KEYS = {
        // Public Lists
        ALL_ACTIVE: 'collection:all:active',
        DETAIL_BY_SLUG: (slug: string) => `collection:detail:${slug}`,
        PRODUCTS_BY_SLUG: (slug: string) => `collection:products:${slug}`,

        // Admin Lists
        ALL_ADMIN: 'collection:admin:all',
        DETAIL_BY_ID: (id: number) => `collection:detail:id:${id}`,
    };

    /**
     * مدت زمان Cache (به میلی‌ثانیه)
     */
    private readonly CACHE_TTL = {
        ALL_ACTIVE: 600 * 1000,         // 10 دقیقه
        DETAIL: 1800 * 1000,            // 30 دقیقه
        PRODUCTS: 600 * 1000,           // 10 دقیقه
        ALL_ADMIN: 300 * 1000,          // 5 دقیقه
    };

    /**
     * Namespace برای Redis
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

        if (Array.isArray(stores) && stores.length > 0) {
            return stores[0];
        }

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

    // ==================== Public Collections ====================

    /**
     * دریافت لیست تمام مجموعه‌های فعال
     */
    async getAllActive(): Promise<any> {
        try {
            return await this.cacheManager.get(this.CACHE_KEYS.ALL_ACTIVE);
        } catch (error) {
            this.logger.warn('خطا در خواندن cache لیست فعال:', error.message);
            return undefined;
        }
    }

    /**
     * ذخیره لیست تمام مجموعه‌های فعال
     */
    async setAllActive(data: any): Promise<void> {
        try {
            await this.cacheManager.set(
                this.CACHE_KEYS.ALL_ACTIVE,
                data,
                this.CACHE_TTL.ALL_ACTIVE
            );
        } catch (error) {
            this.logger.warn('خطا در ذخیره cache لیست فعال:', error.message);
        }
    }

    /**
     * دریافت جزئیات مجموعه با slug
     */
    async getDetailBySlug(slug: string): Promise<any> {
        try {
            return await this.cacheManager.get(this.CACHE_KEYS.DETAIL_BY_SLUG(slug));
        } catch (error) {
            this.logger.warn(`خطا در خواندن cache جزئیات ${slug}:`, error.message);
            return undefined;
        }
    }

    /**
     * ذخیره جزئیات مجموعه با slug
     */
    async setDetailBySlug(slug: string, data: any): Promise<void> {
        try {
            await this.cacheManager.set(
                this.CACHE_KEYS.DETAIL_BY_SLUG(slug),
                data,
                this.CACHE_TTL.DETAIL
            );
        } catch (error) {
            this.logger.warn(`خطا در ذخیره cache جزئیات ${slug}:`, error.message);
        }
    }

    /**
     * دریافت محصولات مجموعه
     */
    async getProducts(slug: string): Promise<any> {
        try {
            return await this.cacheManager.get(this.CACHE_KEYS.PRODUCTS_BY_SLUG(slug));
        } catch (error) {
            this.logger.warn(`خطا در خواندن cache محصولات ${slug}:`, error.message);
            return undefined;
        }
    }

    /**
     * ذخیره محصولات مجموعه
     */
    async setProducts(slug: string, data: any): Promise<void> {
        try {
            await this.cacheManager.set(
                this.CACHE_KEYS.PRODUCTS_BY_SLUG(slug),
                data,
                this.CACHE_TTL.PRODUCTS
            );
        } catch (error) {
            this.logger.warn(`خطا در ذخیره cache محصولات ${slug}:`, error.message);
        }
    }

    // ==================== Admin Collections ====================

    /**
     * دریافت لیست تمام مجموعه‌ها (Admin)
     */
    async getAllAdmin(): Promise<any> {
        try {
            return await this.cacheManager.get(this.CACHE_KEYS.ALL_ADMIN);
        } catch (error) {
            this.logger.warn('خطا در خواندن cache لیست ادمین:', error.message);
            return undefined;
        }
    }

    /**
     * ذخیره لیست تمام مجموعه‌ها (Admin)
     */
    async setAllAdmin(data: any): Promise<void> {
        try {
            await this.cacheManager.set(
                this.CACHE_KEYS.ALL_ADMIN,
                data,
                this.CACHE_TTL.ALL_ADMIN
            );
        } catch (error) {
            this.logger.warn('خطا در ذخیره cache لیست ادمین:', error.message);
        }
    }

    /**
     * دریافت جزئیات مجموعه با ID
     */
    async getDetailById(id: number): Promise<any> {
        try {
            return await this.cacheManager.get(this.CACHE_KEYS.DETAIL_BY_ID(id));
        } catch (error) {
            this.logger.warn(`خطا در خواندن cache جزئیات ID ${id}:`, error.message);
            return undefined;
        }
    }

    /**
     * ذخیره جزئیات مجموعه با ID
     */
    async setDetailById(id: number, data: any): Promise<void> {
        try {
            await this.cacheManager.set(
                this.CACHE_KEYS.DETAIL_BY_ID(id),
                data,
                this.CACHE_TTL.DETAIL
            );
        } catch (error) {
            this.logger.warn(`خطا در ذخیره cache جزئیات ID ${id}:`, error.message);
        }
    }

    // ==================== Invalidation (پاک‌سازی) ====================

    /**
     * پاک کردن cache یک مجموعه خاص
     */
    async clearCollectionCache(slug: string, id?: number): Promise<void> {
        try {
            const promises: Promise<any>[] = [
                this.cacheManager.del(this.CACHE_KEYS.DETAIL_BY_SLUG(slug)),
                this.cacheManager.del(this.CACHE_KEYS.PRODUCTS_BY_SLUG(slug)),
            ];

            if (id) {
                promises.push(
                    this.cacheManager.del(this.CACHE_KEYS.DETAIL_BY_ID(id))
                );
            }

            await Promise.allSettled(promises);
            this.logger.log(`✅ Cache مجموعه ${slug} پاک شد`);
        } catch (error) {
            this.logger.error(`❌ خطا در پاک کردن cache مجموعه ${slug}:`, error);
        }
    }

    /**
     * پاک کردن تمام لیست‌ها (وقتی collection ایجاد، ویرایش یا حذف میشه)
     */
    async clearAllLists(): Promise<void> {
        try {
            await Promise.allSettled([
                this.cacheManager.del(this.CACHE_KEYS.ALL_ACTIVE),
                this.cacheManager.del(this.CACHE_KEYS.ALL_ADMIN),
            ]);
            this.logger.log('✅ تمام لیست‌های collection پاک شد');
        } catch (error) {
            this.logger.error('❌ خطا در پاک کردن لیست‌ها:', error);
        }
    }

    /**
     * پاک کردن کامل cache collection
     */
    async clearAllCollectionCache(): Promise<void> {
        try {
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                this.logger.log('🔍 پاک کردن تمام cache collection با Redis...');

                const pattern = `${this.NAMESPACE}:collection:*`;
                const keys = await redisClient.keys(pattern);

                if (keys && keys.length > 0) {
                    const pipeline = redisClient.pipeline();
                    keys.forEach((key: string) => pipeline.del(key));
                    await pipeline.exec();

                    this.logger.log(`✅ ${keys.length} کلید collection پاک شد`);
                } else {
                    this.logger.log('ℹ️ هیچ کلید collection‌ای برای پاک کردن پیدا نشد');
                }
                return;
            }

            // فال‌بک
            const store = this.getStore();

            if (store && typeof store.iterator === 'function') {
                this.logger.log('🔍 پاک کردن cache collection با Iterator...');

                const keysToDelete: string[] = [];

                for await (const [key] of store.iterator(this.NAMESPACE)) {
                    if (key.startsWith('collection:')) {
                        keysToDelete.push(key);
                    }
                }

                if (keysToDelete.length > 0) {
                    await Promise.allSettled(
                        keysToDelete.map(key => this.cacheManager.del(key))
                    );
                    this.logger.log(`✅ ${keysToDelete.length} کلید collection پاک شد`);
                }
                return;
            }

            this.logger.warn('⚠️ امکان پاک کردن کامل cache موجود نیست');
        } catch (error) {
            this.logger.error('❌ خطا در پاک کردن cache collection:', error);
        }
    }

    /**
     * گرفتن آمار cache
     */
    async getCacheStats(): Promise<{
        totalKeys: number;
        publicKeys: number;
        adminKeys: number;
    }> {
        try {
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                const pattern = `${this.NAMESPACE}:collection:*`;
                const keys = await redisClient.keys(pattern);

                if (!keys || keys.length === 0) {
                    return {
                        totalKeys: 0,
                        publicKeys: 0,
                        adminKeys: 0,
                    };
                }

                const cleanKeys = keys.map((key: string) =>
                    key.replace(`${this.NAMESPACE}:`, '')
                );

                return {
                    totalKeys: keys.length,
                    publicKeys: cleanKeys.filter((k: string) =>
                        !k.includes('admin')
                    ).length,
                    adminKeys: cleanKeys.filter((k: string) =>
                        k.includes('admin')
                    ).length,
                };
            }

            return {
                totalKeys: 0,
                publicKeys: 0,
                adminKeys: 0,
            };
        } catch (error) {
            this.logger.error('❌ خطا در گرفتن آمار cache:', error);
            return {
                totalKeys: 0,
                publicKeys: 0,
                adminKeys: 0,
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
            const testKey = 'health:check:collection:test';
            const testValue = `test-${Date.now()}`;

            await this.cacheManager.set(testKey, testValue, 5000);
            const retrievedValue = await this.cacheManager.get(testKey);
            await this.cacheManager.del(testKey);

            const isWorking = retrievedValue === testValue;

            if (!isWorking) {
                return {
                    isConnected: false,
                    canRead: false,
                    canWrite: false,
                    storeType: 'unknown',
                    message: '❌ تست Read/Write ناموفق بود'
                };
            }

            const store = this.getStore();
            let storeType = 'unknown';

            if (store) {
                if (
                    store.redis ||
                    store.opts?.store?.redis ||
                    store._store?.redis ||
                    store.client ||
                    store.opts?.store?.client
                ) {
                    storeType = 'redis';
                } else {
                    storeType = 'memory';
                }
            }

            return {
                isConnected: true,
                canRead: true,
                canWrite: true,
                storeType: storeType,
                message: storeType === 'redis'
                    ? '✅ Redis سالم است و به درستی کار می‌کند'
                    : '⚠️ Cache کار می‌کند اما از Memory استفاده می‌شود'
            };
        } catch (error) {
            this.logger.error('❌ خطا در بررسی سلامت cache:', error);
            return {
                isConnected: false,
                canRead: false,
                canWrite: false,
                storeType: 'error',
                message: `❌ خطا: ${error.message}`
            };
        }
    }
}