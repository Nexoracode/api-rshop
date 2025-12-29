import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ICategoryResponse } from '../interfaces/category.response.interface';
import { Category } from '../entities/category.entity';
import { RedisHelper } from 'src/common/helpers/redis.helper';

/**
 * سرویس مدیریت Cache برای Category
 * تمام عملیات cache مربوط به دسته‌بندی‌ها در اینجا متمرکز شده
 */
@Injectable()
export class CategoryCacheService {
    private readonly logger = new Logger(CategoryCacheService.name);
    /**
     * کلیدهای Cache
     */
    private readonly CACHE_KEYS = {
        CATEGORY_TREE: 'category:tree',
        CATEGORY_TREE_PAGINATED: (page: number, limit: number, filters?: string) =>
            `category:tree:${page}:${limit}${filters ? ':' + filters : ''}`,
        CATEGORY_BY_ID: (id: number) => `category:${id}`,
        CATEGORY_BY_SLUG: (slug: string) => `category:slug:${slug}`,
        ACTIVE_CATEGORIES: 'category:active',
        CATEGORY_WITH_PRODUCTS: (id: number) => `category:${id}:products`,
    };

    /**
     * مدت زمان Cache (به میلی‌ثانیه)
     * ⚠️ توجه: cache-manager-redis-yet از میلی‌ثانیه استفاده می‌کند
     */
    private readonly CACHE_TTL = {
        CATEGORY_TREE: 3600 * 1000,      // 1 ساعت
        CATEGORY_DETAIL: 1800 * 1000,    // 30 دقیقه
        CATEGORY_LIST: 600 * 1000,       // 10 دقیقه
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
        return RedisHelper.getRedisClient(this.cacheManager);
    }

    /**
     * دریافت tree کامل از cache
     */
    async getCategoryTree(): Promise<ICategoryResponse[] | undefined> {
        const result = await this.cacheManager.get<ICategoryResponse[]>(
            this.CACHE_KEYS.CATEGORY_TREE
        );
        return result;
    }

    /**
     * ذخیره tree کامل در cache
     */
    async setCategoryTree(data: ICategoryResponse[]): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.CATEGORY_TREE,
            data,
            this.CACHE_TTL.CATEGORY_TREE
        );
    }

    /**
     * دریافت tree صفحه‌بندی شده از cache
     */
    async getCategoryTreePaginated(
        page: number,
        limit: number,
        filters?: string
    ): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.CATEGORY_TREE_PAGINATED(page, limit, filters)
        );
        return result;
    }

    /**
     * ذخیره tree صفحه‌بندی شده در cache
     */
    async setCategoryTreePaginated(
        page: number,
        limit: number,
        data: any,
        filters?: string
    ): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.CATEGORY_TREE_PAGINATED(page, limit, filters),
            data,
            this.CACHE_TTL.CATEGORY_LIST
        );
    }

    /**
     * دریافت category با ID از cache
     */
    async getCategoryById(id: number): Promise<ICategoryResponse | undefined> {
        const result = await this.cacheManager.get<ICategoryResponse>(
            this.CACHE_KEYS.CATEGORY_BY_ID(id)
        );
        return result;
    }

    /**
     * ذخیره category با ID در cache
     */
    async setCategoryById(id: number, data: ICategoryResponse): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.CATEGORY_BY_ID(id),
            data,
            this.CACHE_TTL.CATEGORY_DETAIL
        );
    }

    /**
     * دریافت category با slug از cache
     */
    async getCategoryBySlug(slug: string): Promise<ICategoryResponse | undefined> {
        const result = await this.cacheManager.get<ICategoryResponse>(
            this.CACHE_KEYS.CATEGORY_BY_SLUG(slug)
        );
        return result;
    }

    /**
     * ذخیره category با slug در cache
     */
    async setCategoryBySlug(slug: string, data: Category): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.CATEGORY_BY_SLUG(slug),
            data,
            this.CACHE_TTL.CATEGORY_DETAIL
        );
    }

    /**
     * دریافت دسته‌بندی‌های فعال از cache
     */
    async getActiveCategories(): Promise<ICategoryResponse[] | undefined> {
        const result = await this.cacheManager.get<ICategoryResponse[]>(
            this.CACHE_KEYS.ACTIVE_CATEGORIES
        );
        return result;
    }

    /**
     * ذخیره دسته‌بندی‌های فعال در cache
     */
    async setActiveCategories(data: ICategoryResponse[]): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.ACTIVE_CATEGORIES,
            data,
            this.CACHE_TTL.CATEGORY_LIST
        );
    }

    /**
     * دریافت category با محصولاتش از cache
     */
    async getCategoryWithProducts(id: number): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.CATEGORY_WITH_PRODUCTS(id)
        );
        return result;
    }

    /**
     * ذخیره category با محصولاتش در cache
     */
    async setCategoryWithProducts(id: number, data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.CATEGORY_WITH_PRODUCTS(id),
            data,
            this.CACHE_TTL.CATEGORY_DETAIL
        );
    }

    /**
     * پاک کردن کامل cache دسته‌بندی‌ها
     */
    async clearAllCategoryCache(): Promise<void> {
        try {
            const deletedCount = await RedisHelper.deleteKeysByPattern(
                this.cacheManager,
                'category:*'
            );

            this.logger.log(`✅ ${deletedCount} کلید category پاک شد`);
        } catch (error) {
            this.logger.error('❌ خطا در پاک کردن cache:', error);
        }
    }

    /**
     * پاک کردن cache یک دسته‌بندی خاص
     */
    async clearCategoryCache(categoryId: number, slug?: string): Promise<void> {
        try {
            // پاک کردن cache این category
            await this.cacheManager.del(this.CACHE_KEYS.CATEGORY_BY_ID(categoryId));

            // پاک کردن cache slug
            if (slug) {
                await this.cacheManager.del(this.CACHE_KEYS.CATEGORY_BY_SLUG(slug));
            }

            // پاک کردن cache محصولات این category
            await this.cacheManager.del(
                this.CACHE_KEYS.CATEGORY_WITH_PRODUCTS(categoryId)
            );

            // پاک کردن tree و active categories چون تغییر کرده
            await this.clearAllCategoryCache();

            this.logger.log(`✅ Cache دسته‌بندی ${categoryId} پاک شد`);
        } catch (error) {
            this.logger.error(`❌ خطا در پاک کردن cache دسته‌بندی ${categoryId}:`, error);
        }
    }

    /**
     * پاک کردن cache pagination با استفاده از Redis Client
     * ✅ این متد با Keyv + Redis و stores کار می‌کنه
     */
    async clearPaginationCache(): Promise<void> {
        try {
            const redisClient = this.getRedisClient();

            // روش 1: استفاده از Redis Client (بهترین روش)
            if (redisClient && typeof redisClient.keys === 'function') {
                this.logger.log('🔍 استفاده از Redis Client برای پاک کردن cache...');

                // الگوی جستجو با namespace
                const pattern = `*:category:tree:*`;
                const keys = await redisClient.keys(pattern);

                if (keys && keys.length > 0) {
                    this.logger.log(`📋 ${keys.length} کلید pagination پیدا شد`);

                    // استفاده از pipeline برای سرعت بیشتر
                    if (typeof redisClient.pipeline === 'function') {
                        const pipeline = redisClient.pipeline();
                        keys.forEach((key: string) => {
                            pipeline.del(key);
                        });
                        await pipeline.exec();
                    } else {
                        // Fallback: یک‌به‌یک delete
                        await Promise.all(keys.map((key: string) => redisClient.del(key)));
                    }
                    this.logger.log(`✅ ${keys.length} کلید pagination با Redis پاک شد`);
                } else {
                    this.logger.log('ℹ️ هیچ کلید pagination‌ای برای پاک کردن پیدا نشد');
                }

                // پاک کردن کلیدهای اصلی
                await this.clearMainKeys();
                return;
            }

            // روش 2: استفاده از Keyv Iterator (فال‌بک)
            const store = this.getStore();

            if (store && typeof store.iterator === 'function') {
                this.logger.log('🔍 استفاده از Keyv Iterator برای پاک کردن cache...');

                const keysToDelete: string[] = [];

                try {
                    // دریافت تمام کلیدها
                    for await (const [key] of store.iterator(this.NAMESPACE)) {
                        // فیلتر کلیدهای pagination
                        if (key.includes('category:tree:') &&
                            key !== this.CACHE_KEYS.CATEGORY_TREE) {
                            keysToDelete.push(key);
                        }
                    }

                    if (keysToDelete.length > 0) {
                        await Promise.allSettled(
                            keysToDelete.map(key => this.cacheManager.del(key))
                        );
                        this.logger.log(`✅ ${keysToDelete.length} کلید pagination با Iterator پاک شد`);
                    } else {
                        this.logger.log('ℹ️ هیچ کلید pagination‌ای برای پاک کردن پیدا نشد');
                    }

                    await this.clearMainKeys();
                    return;
                } catch (iteratorError) {
                    console.warn('⚠️ خطا در استفاده از Iterator:', iteratorError.message);
                }
            }

            // روش 3: فال‌بک نهایی - پاک کردن فقط کلیدهای اصلی
            this.logger.warn('⚠️ Redis Client و Iterator موجود نیست، فقط کلیدهای اصلی پاک می‌شوند');
            await this.clearMainKeys();

        } catch (error) {
            this.logger.error('❌ خطا در پاک کردن cache pagination:', error);

            // فال‌بک نهایی
            try {
                await this.clearMainKeys();
            } catch (fallbackError) {
                this.logger.error('❌ خطا در fallback پاک کردن cache:', fallbackError);
            }
        }
    }

    /**
     * پاک کردن کلیدهای اصلی cache
     * متد کمکی برای استفاده در clearPaginationCache
     */
    private async clearMainKeys(): Promise<void> {
        const mainKeys = [
            this.CACHE_KEYS.CATEGORY_TREE,
            this.CACHE_KEYS.ACTIVE_CATEGORIES,
        ];

        await Promise.allSettled(
            mainKeys.map(key => this.cacheManager.del(key))
        );

        this.logger.log('✅ کلیدهای اصلی cache پاک شد');
    }

    /**
     * پاک کردن تمام cache‌های مرتبط با یک pattern خاص
     * متد عمومی برای استفاده در جاهای دیگر
     */
    async clearCacheByPattern(pattern: string): Promise<number> {
        try {
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                const fullPattern = `*:${pattern}`;
                const keys = await redisClient.keys(fullPattern);

                if (keys && keys.length > 0) {
                    if (typeof redisClient.pipeline === 'function') {
                        const pipeline = redisClient.pipeline();
                        keys.forEach((key: string) => pipeline.del(key));
                        await pipeline.exec();
                    } else {
                        await Promise.all(keys.map((key: string) => redisClient.del(key)));
                    }

                    this.logger.log(`✅ ${keys.length} کلید با pattern "${pattern}" پاک شد`);
                    return keys.length;
                }
            }

            return 0;
        } catch (error) {
            this.logger.error(`❌ خطا در پاک کردن cache با pattern "${pattern}":`, error);
            return 0;
        }
    }

    // src/category/cache/category-cache.service.ts
    /**
     * گرفتن آمار cache
     */
    /**
 * گرفتن آمار cache
 */
    async getCacheStats(): Promise<{
        totalKeys: number;
        hasTree: boolean;
        hasActiveCategories: boolean;
        totalPaginationKeys: number;
        message: string;
    }> {
        try {
            // ✅ استفاده از Helper با pattern درست
            const keys = await RedisHelper.getKeysByPattern(
                this.cacheManager,
                'category:*'
            );

            if (keys.length === 0) {
                return {
                    totalKeys: 0,
                    hasTree: false,
                    hasActiveCategories: false,
                    totalPaginationKeys: 0,
                    message: 'هیچ کلید category‌ای در cache وجود ندارد'
                };
            }

            // پاک کردن namespace های اضافی
            const cleanKeys = keys.map(key => RedisHelper.cleanKey(key));

            const hasTree = cleanKeys.some(k => k === 'category:tree');
            const hasActiveCategories = cleanKeys.some(k => k === 'category:tree:active');
            const totalPaginationKeys = cleanKeys.filter(k => k.includes(':page:')).length;

            return {
                totalKeys: keys.length,
                hasTree,
                hasActiveCategories,
                totalPaginationKeys,
                message: hasTree
                    ? '✅ Cache فعال است'
                    : '⚠️ Cache درخت دسته‌بندی موجود نیست'
            };
        } catch (error) {
            this.logger.log('❌ خطا در گرفتن آمار cache:', error);
            return {
                totalKeys: 0,
                hasTree: false,
                hasActiveCategories: false,
                totalPaginationKeys: 0,
                message: `❌ خطا: ${error.message}`
            };
        }
    }
    /**
        * بررسی سلامت Redis با تست واقعی cache
    */
    async checkRedisHealth(): Promise<{
        isConnected: boolean;
        canRead: boolean;
        canWrite: boolean;
        storeType: string;
        message: string;
    }> {
        try {
            // ✅ تست واقعی Read/Write
            const testKey = 'health:check:test';
            const testValue = `test-${Date.now()}`;

            // تست نوشتن
            await this.cacheManager.set(testKey, testValue, 5000);

            // تست خواندن
            const retrievedValue = await this.cacheManager.get(testKey);

            // پاک کردن
            await this.cacheManager.del(testKey);

            // بررسی نتیجه
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

            // ✅ اگر کار کرد، ببین Redis هست یا Memory
            const store = this.getStore();
            let storeType = 'unknown';

            // چک کردن نوع store
            if (store) {
                // اگر هر یک از اینا وجود داشت، Redis هست
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