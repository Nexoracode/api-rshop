import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IProductResponse } from '../interfaces/product.response';

/**
 * سرویس مدیریت Cache برای Product
 * تمام عملیات cache مربوط به محصولات در اینجا متمرکز شده
 */
@Injectable()
export class ProductCacheService {
    /**
     * کلیدهای Cache
     */
    private readonly CACHE_KEYS = {
        // لیست محصولات
        PRODUCT_LIST: (page: number, limit: number, filters: string) =>
            `product:list:${page}:${limit}:${filters}`,

        // جزئیات محصول
        PRODUCT_BY_ID: (id: number) => `product:${id}`,
        PRODUCT_BY_SLUG: (slug: string) => `product:slug:${slug}`,

        // محصولات ویژه
        FEATURED_PRODUCTS: (limit: number) => `product:featured:${limit}`,
        NEW_PRODUCTS: (limit: number) => `product:new:${limit}`,
        BEST_SELLERS: (limit: number) => `product:bestsellers:${limit}`,
        ON_SALE: (limit: number) => `product:onsale:${limit}`,

        // محصولات دسته‌بندی
        CATEGORY_PRODUCTS: (categoryId: number, page: number, limit: number) =>
            `product:category:${categoryId}:${page}:${limit}`,

        // محصولات برند
        BRAND_PRODUCTS: (brandId: number, page: number, limit: number) =>
            `product:brand:${brandId}:${page}:${limit}`,

        // محصولات مرتبط
        RELATED_PRODUCTS: (productId: number, limit: number) =>
            `product:related:${productId}:${limit}`,

        // جستجو
        SEARCH_RESULTS: (query: string, page: number, limit: number) =>
            `product:search:${query}:${page}:${limit}`,
    };

    /**
     * مدت زمان Cache (به میلی‌ثانیه)
     * ⚠️ توجه: cache-manager-redis-yet از میلی‌ثانیه استفاده می‌کند
     */
    private readonly CACHE_TTL = {
        PRODUCT_LIST: 600 * 1000,        // 10 دقیقه
        PRODUCT_DETAIL: 1800 * 1000,     // 30 دقیقه
        FEATURED: 3600 * 1000,           // 1 ساعت
        SPECIAL_LISTS: 1800 * 1000,      // 30 دقیقه (new, bestsellers, etc)
        SEARCH: 300 * 1000,              // 5 دقیقه
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

    // ==================== لیست محصولات ====================

    async getProductList(page: number, limit: number, filters: string): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.PRODUCT_LIST(page, limit, filters)
        );
        return result;
    }

    async setProductList(page: number, limit: number, filters: string, data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.PRODUCT_LIST(page, limit, filters),
            data,
            this.CACHE_TTL.PRODUCT_LIST
        );
    }

    // ==================== جزئیات محصول ====================

    async getProductById(id: number): Promise<IProductResponse | undefined> {
        const result = await this.cacheManager.get<IProductResponse>(
            this.CACHE_KEYS.PRODUCT_BY_ID(id)
        );
        return result;
    }

    async setProductById(id: number, data: IProductResponse): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.PRODUCT_BY_ID(id),
            data,
            this.CACHE_TTL.PRODUCT_DETAIL
        );
    }

    async getProductBySlug(slug: string): Promise<IProductResponse | undefined> {
        const result = await this.cacheManager.get<IProductResponse>(
            this.CACHE_KEYS.PRODUCT_BY_SLUG(slug)
        );
        return result;
    }

    async setProductBySlug(slug: string, data: IProductResponse): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.PRODUCT_BY_SLUG(slug),
            data,
            this.CACHE_TTL.PRODUCT_DETAIL
        );
    }

    // ==================== محصولات ویژه ====================

    async getFeaturedProducts(limit: number): Promise<IProductResponse[] | undefined> {
        const result = await this.cacheManager.get<IProductResponse[]>(
            this.CACHE_KEYS.FEATURED_PRODUCTS(limit)
        );
        return result;
    }

    async setFeaturedProducts(limit: number, data: IProductResponse[]): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.FEATURED_PRODUCTS(limit),
            data,
            this.CACHE_TTL.FEATURED
        );
    }

    async getNewProducts(limit: number): Promise<IProductResponse[] | undefined> {
        const result = await this.cacheManager.get<IProductResponse[]>(
            this.CACHE_KEYS.NEW_PRODUCTS(limit)
        );
        return result;
    }

    async setNewProducts(limit: number, data: IProductResponse[]): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.NEW_PRODUCTS(limit),
            data,
            this.CACHE_TTL.SPECIAL_LISTS
        );
    }

    async getBestSellers(limit: number): Promise<IProductResponse[] | undefined> {
        const result = await this.cacheManager.get<IProductResponse[]>(
            this.CACHE_KEYS.BEST_SELLERS(limit)
        );
        return result;
    }

    async setBestSellers(limit: number, data: IProductResponse[]): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.BEST_SELLERS(limit),
            data,
            this.CACHE_TTL.SPECIAL_LISTS
        );
    }

    async getOnSaleProducts(limit: number): Promise<IProductResponse[] | undefined> {
        const result = await this.cacheManager.get<IProductResponse[]>(
            this.CACHE_KEYS.ON_SALE(limit)
        );
        return result;
    }

    async setOnSaleProducts(limit: number, data: IProductResponse[]): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.ON_SALE(limit),
            data,
            this.CACHE_TTL.SPECIAL_LISTS
        );
    }

    // ==================== محصولات دسته‌بندی ====================

    async getCategoryProducts(categoryId: number, page: number, limit: number): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.CATEGORY_PRODUCTS(categoryId, page, limit)
        );
        return result;
    }

    async setCategoryProducts(
        categoryId: number,
        page: number,
        limit: number,
        data: any
    ): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.CATEGORY_PRODUCTS(categoryId, page, limit),
            data,
            this.CACHE_TTL.PRODUCT_LIST
        );
    }

    // ==================== محصولات برند ====================

    async getBrandProducts(brandId: number, page: number, limit: number): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.BRAND_PRODUCTS(brandId, page, limit)
        );
        return result;
    }

    async setBrandProducts(
        brandId: number,
        page: number,
        limit: number,
        data: any
    ): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.BRAND_PRODUCTS(brandId, page, limit),
            data,
            this.CACHE_TTL.PRODUCT_LIST
        );
    }

    // ==================== محصولات مرتبط ====================

    async getRelatedProducts(productId: number, limit: number): Promise<IProductResponse[] | undefined> {
        const result = await this.cacheManager.get<IProductResponse[]>(
            this.CACHE_KEYS.RELATED_PRODUCTS(productId, limit)
        );
        return result;
    }

    async setRelatedProducts(
        productId: number,
        limit: number,
        data: IProductResponse[]
    ): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.RELATED_PRODUCTS(productId, limit),
            data,
            this.CACHE_TTL.PRODUCT_DETAIL
        );
    }

    // ==================== جستجو ====================

    async getSearchResults(query: string, page: number, limit: number): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.SEARCH_RESULTS(query, page, limit)
        );
        return result;
    }

    async setSearchResults(
        query: string,
        page: number,
        limit: number,
        data: any
    ): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.SEARCH_RESULTS(query, page, limit),
            data,
            this.CACHE_TTL.SEARCH
        );
    }

    // ==================== پاک‌سازی ====================

    /**
     * پاک کردن کامل cache محصولات
     */
    async clearAllProductCache(): Promise<void> {
        try {
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                console.log('🔍 پاک کردن تمام cache محصولات با Redis...');

                const pattern = `${this.NAMESPACE}:product:*`;
                const keys = await redisClient.keys(pattern);

                if (keys && keys.length > 0) {
                    const pipeline = redisClient.pipeline();
                    keys.forEach((key: string) => pipeline.del(key));
                    await pipeline.exec();

                    console.log(`✅ ${keys.length} کلید cache محصول پاک شد`);
                } else {
                    console.log('ℹ️ هیچ کلید محصولی برای پاک کردن پیدا نشد');
                }
                return;
            }

            // فال‌بک: استفاده از Iterator
            const store = this.getStore();

            if (store && typeof store.iterator === 'function') {
                console.log('🔍 پاک کردن cache محصولات با Iterator...');

                const keysToDelete: string[] = [];

                for await (const [key] of store.iterator(this.NAMESPACE)) {
                    if (key.startsWith('product:')) {
                        keysToDelete.push(key);
                    }
                }

                if (keysToDelete.length > 0) {
                    await Promise.allSettled(
                        keysToDelete.map(key => this.cacheManager.del(key))
                    );
                    console.log(`✅ ${keysToDelete.length} کلید cache محصول پاک شد`);
                }
                return;
            }

            console.warn('⚠️ امکان پاک کردن کامل cache موجود نیست');
        } catch (error) {
            console.error('❌ خطا در پاک کردن cache محصولات:', error);
        }
    }

    /**
     * پاک کردن cache یک محصول خاص
     */
    async clearProductCache(productId: number, slug?: string): Promise<void> {
        try {
            // پاک کردن cache این محصول
            await this.cacheManager.del(this.CACHE_KEYS.PRODUCT_BY_ID(productId));

            // پاک کردن cache slug
            if (slug) {
                await this.cacheManager.del(this.CACHE_KEYS.PRODUCT_BY_SLUG(slug));
            }

            // پاک کردن لیست‌ها (چون محصول تغییر کرده)
            await this.clearListCaches();

            console.log(`✅ Cache محصول ${productId} پاک شد`);
        } catch (error) {
            console.error(`❌ خطا در پاک کردن cache محصول ${productId}:`, error);
        }
    }

    /**
     * پاک کردن cache لیست‌ها
     */
    async clearListCaches(): Promise<void> {
        try {
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                console.log('🔍 پاک کردن cache لیست‌های محصولات...');

                const patterns = [
                    `${this.NAMESPACE}:product:list:*`,
                    `${this.NAMESPACE}:product:featured:*`,
                    `${this.NAMESPACE}:product:new:*`,
                    `${this.NAMESPACE}:product:bestsellers:*`,
                    `${this.NAMESPACE}:product:onsale:*`,
                    `${this.NAMESPACE}:product:category:*`,
                    `${this.NAMESPACE}:product:brand:*`,
                    `${this.NAMESPACE}:product:search:*`,
                ];

                let totalDeleted = 0;

                for (const pattern of patterns) {
                    const keys = await redisClient.keys(pattern);
                    if (keys && keys.length > 0) {
                        const pipeline = redisClient.pipeline();
                        keys.forEach((key: string) => pipeline.del(key));
                        await pipeline.exec();
                        totalDeleted += keys.length;
                    }
                }

                console.log(`✅ ${totalDeleted} کلید لیست پاک شد`);
                return;
            }

            // فال‌بک
            const store = this.getStore();

            if (store && typeof store.iterator === 'function') {
                console.log('🔍 پاک کردن لیست‌ها با Iterator...');

                const keysToDelete: string[] = [];

                for await (const [key] of store.iterator(this.NAMESPACE)) {
                    if (
                        key.startsWith('product:list:') ||
                        key.startsWith('product:featured:') ||
                        key.startsWith('product:new:') ||
                        key.startsWith('product:bestsellers:') ||
                        key.startsWith('product:onsale:') ||
                        key.startsWith('product:category:') ||
                        key.startsWith('product:brand:') ||
                        key.startsWith('product:search:')
                    ) {
                        keysToDelete.push(key);
                    }
                }

                if (keysToDelete.length > 0) {
                    await Promise.allSettled(
                        keysToDelete.map(key => this.cacheManager.del(key))
                    );
                    console.log(`✅ ${keysToDelete.length} کلید لیست پاک شد`);
                }
            }
        } catch (error) {
            console.error('❌ خطا در پاک کردن cache لیست‌ها:', error);
        }
    }

    /**
     * پاک کردن cache محصولات یک دسته‌بندی
     */
    async clearCategoryProductsCache(categoryId: number): Promise<void> {
        try {
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                const pattern = `${this.NAMESPACE}:product:category:${categoryId}:*`;
                const keys = await redisClient.keys(pattern);

                if (keys && keys.length > 0) {
                    const pipeline = redisClient.pipeline();
                    keys.forEach((key: string) => pipeline.del(key));
                    await pipeline.exec();

                    console.log(`✅ ${keys.length} کلید محصولات دسته ${categoryId} پاک شد`);
                }
                return;
            }

            // فال‌بک
            const store = this.getStore();

            if (store && typeof store.iterator === 'function') {
                const keysToDelete: string[] = [];

                for await (const [key] of store.iterator(this.NAMESPACE)) {
                    if (key.startsWith(`product:category:${categoryId}:`)) {
                        keysToDelete.push(key);
                    }
                }

                if (keysToDelete.length > 0) {
                    await Promise.allSettled(
                        keysToDelete.map(key => this.cacheManager.del(key))
                    );
                    console.log(`✅ ${keysToDelete.length} کلید محصولات دسته ${categoryId} پاک شد`);
                }
            }
        } catch (error) {
            console.error(`❌ خطا در پاک کردن cache محصولات دسته ${categoryId}:`, error);
        }
    }

    /**
     * پاک کردن cache محصولات یک برند
     */
    async clearBrandProductsCache(brandId: number): Promise<void> {
        try {
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                const pattern = `${this.NAMESPACE}:product:brand:${brandId}:*`;
                const keys = await redisClient.keys(pattern);

                if (keys && keys.length > 0) {
                    const pipeline = redisClient.pipeline();
                    keys.forEach((key: string) => pipeline.del(key));
                    await pipeline.exec();

                    console.log(`✅ ${keys.length} کلید محصولات برند ${brandId} پاک شد`);
                }
                return;
            }

            // فال‌بک
            const store = this.getStore();

            if (store && typeof store.iterator === 'function') {
                const keysToDelete: string[] = [];

                for await (const [key] of store.iterator(this.NAMESPACE)) {
                    if (key.startsWith(`product:brand:${brandId}:`)) {
                        keysToDelete.push(key);
                    }
                }

                if (keysToDelete.length > 0) {
                    await Promise.allSettled(
                        keysToDelete.map(key => this.cacheManager.del(key))
                    );
                    console.log(`✅ ${keysToDelete.length} کلید محصولات برند ${brandId} پاک شد`);
                }
            }
        } catch (error) {
            console.error(`❌ خطا در پاک کردن cache محصولات برند ${brandId}:`, error);
        }
    }

    /**
     * پاک کردن cache جستجو
     */
    async clearSearchCache(): Promise<void> {
        try {
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                const pattern = `${this.NAMESPACE}:product:search:*`;
                const keys = await redisClient.keys(pattern);

                if (keys && keys.length > 0) {
                    const pipeline = redisClient.pipeline();
                    keys.forEach((key: string) => pipeline.del(key));
                    await pipeline.exec();

                    console.log(`✅ ${keys.length} کلید جستجو پاک شد`);
                }
                return;
            }

            // فال‌بک
            const store = this.getStore();

            if (store && typeof store.iterator === 'function') {
                const keysToDelete: string[] = [];

                for await (const [key] of store.iterator(this.NAMESPACE)) {
                    if (key.startsWith('product:search:')) {
                        keysToDelete.push(key);
                    }
                }

                if (keysToDelete.length > 0) {
                    await Promise.allSettled(
                        keysToDelete.map(key => this.cacheManager.del(key))
                    );
                    console.log(`✅ ${keysToDelete.length} کلید جستجو پاک شد`);
                }
            }
        } catch (error) {
            console.error('❌ خطا در پاک کردن cache جستجو:', error);
        }
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
        detailKeys: number;
        listKeys: number;
        specialKeys: number;
    }> {
        try {
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                const pattern = `${this.NAMESPACE}:product:*`;
                const keys = await redisClient.keys(pattern);

                if (!keys || keys.length === 0) {
                    return {
                        totalKeys: 0,
                        detailKeys: 0,
                        listKeys: 0,
                        specialKeys: 0,
                    };
                }

                // حذف namespace از کلیدها برای بررسی
                const cleanKeys = keys.map((key: string) =>
                    key.replace(`${this.NAMESPACE}:`, '')
                );

                const detailKeys = cleanKeys.filter((key: string) =>
                    key.match(/^product:\d+$/) || key.startsWith('product:slug:')
                );

                const listKeys = cleanKeys.filter((key: string) =>
                    key.startsWith('product:list:')
                );

                const specialKeys = cleanKeys.filter((key: string) =>
                    key.startsWith('product:featured:') ||
                    key.startsWith('product:new:') ||
                    key.startsWith('product:bestsellers:') ||
                    key.startsWith('product:onsale:')
                );

                return {
                    totalKeys: keys.length,
                    detailKeys: detailKeys.length,
                    listKeys: listKeys.length,
                    specialKeys: specialKeys.length,
                };
            }

            return {
                totalKeys: 0,
                detailKeys: 0,
                listKeys: 0,
                specialKeys: 0,
            };
        } catch (error) {
            console.error('❌ خطا در گرفتن آمار cache:', error);
            return {
                totalKeys: 0,
                detailKeys: 0,
                listKeys: 0,
                specialKeys: 0,
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
            const testKey = 'health:check:product:test';
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
            console.error('❌ خطا در بررسی سلامت Redis:', error);
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