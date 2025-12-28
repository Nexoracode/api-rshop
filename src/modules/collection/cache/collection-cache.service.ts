// src/collection/services/collection-cache.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RedisHelper } from 'src/common/helpers/redis.helper';

/**
 * سرویس مدیریت Cache برای Collection
 */
@Injectable()
export class CollectionCacheService {
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
    ) {
        this.logger = new Logger(CollectionCacheService.name);
    }

    private readonly logger: Logger;

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
        return RedisHelper.getRedisClient(this.cacheManager);
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
            const deletedCount = await RedisHelper.deleteKeysByPattern(
                this.cacheManager,
                'collection:*'
            );

            this.logger.log(`✅ ${deletedCount} کلید collection پاک شد`);
        } catch (error) {
            this.logger.error('❌ خطا در پاک کردن cache:', error);
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
            const keys = await RedisHelper.getKeysByPattern(
                this.cacheManager,
                'collection:*'
            );

            if (keys.length === 0) {
                return {
                    totalKeys: 0,
                    publicKeys: 0,
                    adminKeys: 0,
                };
            }

            const cleanKeys = keys.map(key => RedisHelper.cleanKey(key));

            return {
                totalKeys: keys.length,
                publicKeys: cleanKeys.filter(k => !k.includes('admin')).length,
                adminKeys: cleanKeys.filter(k => k.includes('admin')).length,
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
     * پاک کردن cache با pattern
     */
    async clearCacheByPattern(pattern: string): Promise<number> {
        try {
            const deletedCount = await RedisHelper.deleteKeysByPattern(
                this.cacheManager,
                pattern
            );
            this.logger.log(`✅ ${deletedCount} کلید با pattern "${pattern}" پاک شد`);
            return deletedCount;
        } catch (error) {
            this.logger.error(`❌ خطا در پاک کردن cache:`, error);
            return 0;
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