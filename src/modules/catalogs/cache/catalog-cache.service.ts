import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { createHash } from 'crypto';

/**
 * سرویس مدیریت Cache برای Catalog
 * این ماژول بیشترین traffic را دارد و نیاز به cache پیچیده دارد
 */
@Injectable()
export class CatalogCacheService {
    /**
     * کلیدهای Cache
     */
    private readonly CACHE_KEYS = {
        // Category Products
        CATEGORY_PRODUCTS: (slug: string, queryHash: string) =>
            `catalog:category:${slug}:${queryHash}`,
        CATEGORY_FILTERS: (slug: string) =>
            `catalog:filters:${slug}`,

        // Search
        SEARCH_RESULTS: (term: string, limit: number) =>
            `catalog:search:${this.normalizeSearchTerm(term)}:${limit}`,
        SEARCH_SUGGESTIONS: (term: string) =>
            `catalog:suggest:${this.normalizeSearchTerm(term)}`,

        // Filters Components
        BRAND_LIST: (categorySlug?: string) =>
            categorySlug ? `catalog:brands:category:${categorySlug}` : 'catalog:brands:all',
        PRICE_RANGE: (categorySlug: string) =>
            `catalog:price-range:${categorySlug}`,
        ATTRIBUTE_VALUES: (categorySlug: string, attrId: number) =>
            `catalog:attr:${categorySlug}:${attrId}`,
    };

    /**
     * مدت زمان Cache (به میلی‌ثانیه)
     * ⚠️ توجه: cache-manager-redis-yet از میلی‌ثانیه استفاده می‌کند
     */
    private readonly CACHE_TTL = {
        CATEGORY_PRODUCTS: 300 * 1000,      // 5 دقیقه (تغییرات زیاد)
        CATEGORY_FILTERS: 1800 * 1000,      // 30 دقیقه (کمتر تغییر می‌کند)
        SEARCH_RESULTS: 300 * 1000,         // 5 دقیقه
        SEARCH_SUGGESTIONS: 120 * 1000,     // 2 دقیقه (سریع و کوچک)
        BRAND_LIST: 1800 * 1000,            // 30 دقیقه
        PRICE_RANGE: 600 * 1000,            // 10 دقیقه
        ATTRIBUTE_VALUES: 1800 * 1000,      // 30 دقیقه
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

    // ==================== Helper Methods ====================

    /**
     * نرمال‌سازی کلید جستجو (lowercase + trim)
     */
    private normalizeSearchTerm(term: string): string {
        return term.toLowerCase().trim();
    }

    /**
     * ساخت hash از query object برای کلید cache
     * چون query می‌تونه خیلی بزرگ باشه
     */
    generateQueryHash(query: any): string {
        const normalized = {
            page: query.page || 1,
            limit: query.limit || 20,
            sortBy: query.sortBy || 'id',
            filter: {
                brand: query['filter[brand]'] || null,
                price_min: query['filter[price_min]'] || null,
                price_max: query['filter[price_max]'] || null,
                special_offer: query['filter[special_offer]'] || null,
                discounted: query['filter[discounted]'] || null,
                same_day_shipping: query['filter[same_day_shipping]'] || null,
                in_stock: query['filter[in_stock]'] || null,
                attributes: query['filter[attributes]'] || null,
            }
        };

        const str = JSON.stringify(normalized);
        return createHash('md5').update(str).digest('hex').substring(0, 16);
    }

    // ==================== Category Products ====================

    /**
     * دریافت محصولات دسته‌بندی
     */
    async getCategoryProducts(slug: string, query: any): Promise<any> {
        const queryHash = this.generateQueryHash(query);
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.CATEGORY_PRODUCTS(slug, queryHash)
        );
        return result;
    }

    /**
     * ذخیره محصولات دسته‌بندی
     */
    async setCategoryProducts(slug: string, query: any, data: any): Promise<void> {
        const queryHash = this.generateQueryHash(query);
        await this.cacheManager.set(
            this.CACHE_KEYS.CATEGORY_PRODUCTS(slug, queryHash),
            data,
            this.CACHE_TTL.CATEGORY_PRODUCTS
        );
    }

    /**
     * پاک کردن محصولات یک دسته‌بندی
     */
    async clearCategoryProducts(slug: string): Promise<void> {
        try {
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                const pattern = `${this.NAMESPACE}:catalog:category:${slug}:*`;
                const keys = await redisClient.keys(pattern);

                if (keys && keys.length > 0) {
                    const pipeline = redisClient.pipeline();
                    keys.forEach((key: string) => pipeline.del(key));
                    await pipeline.exec();

                    console.log(`✅ ${keys.length} کلید محصولات category ${slug} پاک شد`);
                }
                return;
            }

            // فال‌بک
            const store = this.getStore();

            if (store && typeof store.iterator === 'function') {
                const keysToDelete: string[] = [];

                for await (const [key] of store.iterator(this.NAMESPACE)) {
                    if (key.startsWith(`catalog:category:${slug}:`)) {
                        keysToDelete.push(key);
                    }
                }

                if (keysToDelete.length > 0) {
                    await Promise.allSettled(
                        keysToDelete.map(key => this.cacheManager.del(key))
                    );
                    console.log(`✅ ${keysToDelete.length} کلید محصولات category ${slug} پاک شد`);
                }
            }
        } catch (error) {
            console.error(`❌ خطا در پاک کردن cache category ${slug}:`, error);
        }
    }

    // ==================== Category Filters ====================

    /**
     * دریافت فیلترهای دسته‌بندی
     */
    async getCategoryFilters(slug: string): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.CATEGORY_FILTERS(slug)
        );
        return result;
    }

    /**
     * ذخیره فیلترهای دسته‌بندی
     */
    async setCategoryFilters(slug: string, data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.CATEGORY_FILTERS(slug),
            data,
            this.CACHE_TTL.CATEGORY_FILTERS
        );
    }

    /**
     * پاک کردن فیلترهای دسته‌بندی
     */
    async clearCategoryFilters(slug: string): Promise<void> {
        await this.cacheManager.del(this.CACHE_KEYS.CATEGORY_FILTERS(slug));
    }

    // ==================== Search ====================

    /**
     * دریافت نتایج جستجو
     */
    async getSearchResults(term: string, limit: number = 20): Promise<any> {
        if (!term || term.trim().length < 2) return undefined;

        const result = await this.cacheManager.get(
            this.CACHE_KEYS.SEARCH_RESULTS(term, limit)
        );
        return result;
    }

    /**
     * ذخیره نتایج جستجو
     */
    async setSearchResults(term: string, limit: number, data: any): Promise<void> {
        if (!term || term.trim().length < 2) return;

        await this.cacheManager.set(
            this.CACHE_KEYS.SEARCH_RESULTS(term, limit),
            data,
            this.CACHE_TTL.SEARCH_RESULTS
        );
    }

    /**
     * دریافت پیشنهادات جستجو (autocomplete)
     */
    async getSearchSuggestions(term: string): Promise<any> {
        if (!term || term.trim().length < 2) return undefined;

        const result = await this.cacheManager.get(
            this.CACHE_KEYS.SEARCH_SUGGESTIONS(term)
        );
        return result;
    }

    /**
     * ذخیره پیشنهادات جستجو
     */
    async setSearchSuggestions(term: string, data: any): Promise<void> {
        if (!term || term.trim().length < 2) return;

        await this.cacheManager.set(
            this.CACHE_KEYS.SEARCH_SUGGESTIONS(term),
            data,
            this.CACHE_TTL.SEARCH_SUGGESTIONS
        );
    }

    /**
     * پاک کردن تمام کش جستجو
     */
    async clearSearchCache(): Promise<void> {
        try {
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                const patterns = [
                    `${this.NAMESPACE}:catalog:search:*`,
                    `${this.NAMESPACE}:catalog:suggest:*`
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

                console.log(`✅ ${totalDeleted} کلید جستجو پاک شد`);
                return;
            }

            // فال‌بک
            const store = this.getStore();

            if (store && typeof store.iterator === 'function') {
                const keysToDelete: string[] = [];

                for await (const [key] of store.iterator(this.NAMESPACE)) {
                    if (key.startsWith('catalog:search:') || key.startsWith('catalog:suggest:')) {
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

    // ==================== Filter Components ====================

    /**
     * دریافت لیست برندها
     */
    async getBrandList(categorySlug?: string): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.BRAND_LIST(categorySlug)
        );
        return result;
    }

    /**
     * ذخیره لیست برندها
     */
    async setBrandList(data: any, categorySlug?: string): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.BRAND_LIST(categorySlug),
            data,
            this.CACHE_TTL.BRAND_LIST
        );
    }

    /**
     * دریافت محدوده قیمت
     */
    async getPriceRange(categorySlug: string): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.PRICE_RANGE(categorySlug)
        );
        return result;
    }

    /**
     * ذخیره محدوده قیمت
     */
    async setPriceRange(categorySlug: string, data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.PRICE_RANGE(categorySlug),
            data,
            this.CACHE_TTL.PRICE_RANGE
        );
    }

    /**
     * دریافت مقادیر attribute
     */
    async getAttributeValues(categorySlug: string, attrId: number): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.ATTRIBUTE_VALUES(categorySlug, attrId)
        );
        return result;
    }

    /**
     * ذخیره مقادیر attribute
     */
    async setAttributeValues(categorySlug: string, attrId: number, data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.ATTRIBUTE_VALUES(categorySlug, attrId),
            data,
            this.CACHE_TTL.ATTRIBUTE_VALUES
        );
    }

    // ==================== پاک‌سازی کلی ====================

    /**
     * پاک کردن تمام cache مربوط به یک دسته‌بندی
     * شامل: products + filters + price range + attributes
     */
    async clearAllCategoryCache(slug: string): Promise<void> {
        await this.clearCategoryProducts(slug);
        await this.clearCategoryFilters(slug);
        await this.cacheManager.del(this.CACHE_KEYS.PRICE_RANGE(slug));

        console.log(`✅ تمام cache دسته‌بندی ${slug} پاک شد`);
    }

    /**
     * پاک کردن کامل cache catalog
     */
    async clearAllCatalogCache(): Promise<void> {
        try {
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                console.log('🔍 پاک کردن تمام cache catalog با Redis...');

                const pattern = `${this.NAMESPACE}:catalog:*`;
                const keys = await redisClient.keys(pattern);

                if (keys && keys.length > 0) {
                    const pipeline = redisClient.pipeline();
                    keys.forEach((key: string) => pipeline.del(key));
                    await pipeline.exec();

                    console.log(`✅ ${keys.length} کلید catalog پاک شد`);
                } else {
                    console.log('ℹ️ هیچ کلید catalog‌ای برای پاک کردن پیدا نشد');
                }
                return;
            }

            // فال‌بک
            const store = this.getStore();

            if (store && typeof store.iterator === 'function') {
                console.log('🔍 پاک کردن cache catalog با Iterator...');

                const keysToDelete: string[] = [];

                for await (const [key] of store.iterator(this.NAMESPACE)) {
                    if (key.startsWith('catalog:')) {
                        keysToDelete.push(key);
                    }
                }

                if (keysToDelete.length > 0) {
                    await Promise.allSettled(
                        keysToDelete.map(key => this.cacheManager.del(key))
                    );
                    console.log(`✅ ${keysToDelete.length} کلید catalog پاک شد`);
                }
                return;
            }

            console.warn('⚠️ امکان پاک کردن کامل cache موجود نیست');
        } catch (error) {
            console.error('❌ خطا در پاک کردن cache catalog:', error);
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
        categoryKeys: number;
        searchKeys: number;
        filterKeys: number;
    }> {
        try {
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                const pattern = `${this.NAMESPACE}:catalog:*`;
                const keys = await redisClient.keys(pattern);

                if (!keys || keys.length === 0) {
                    return {
                        totalKeys: 0,
                        categoryKeys: 0,
                        searchKeys: 0,
                        filterKeys: 0,
                    };
                }

                // حذف namespace از کلیدها برای بررسی
                const cleanKeys = keys.map((key: string) =>
                    key.replace(`${this.NAMESPACE}:`, '')
                );

                return {
                    totalKeys: keys.length,
                    categoryKeys: cleanKeys.filter((k: string) => k.includes('category:')).length,
                    searchKeys: cleanKeys.filter((k: string) => k.includes('search:') || k.includes('suggest:')).length,
                    filterKeys: cleanKeys.filter((k: string) => k.includes('filters:') || k.includes('brands:') || k.includes('price-range:') || k.includes('attr:')).length,
                };
            }

            return {
                totalKeys: 0,
                categoryKeys: 0,
                searchKeys: 0,
                filterKeys: 0,
            };
        } catch (error) {
            console.error('❌ خطا در گرفتن آمار cache:', error);
            return {
                totalKeys: 0,
                categoryKeys: 0,
                searchKeys: 0,
                filterKeys: 0,
            };
        }
    }

    // ==================== Generic Methods (برای سازگاری با کد قبلی) ====================

    /**
     * دریافت generic
     */
    async get<T>(key: string): Promise<T | undefined> {
        try {
            const result = await this.cacheManager.get<T>(key);
            return result;
        } catch (err) {
            console.warn('❌ Cache read error:', err.message);
            return undefined;
        }
    }

    /**
     * ذخیره generic
     */
    async set<T>(key: string, value: T, ttl = 300): Promise<void> {
        try {
            await this.cacheManager.set(key, value, ttl * 1000); // ✅ تبدیل به میلی‌ثانیه
        } catch (err) {
            console.warn('❌ Cache write error:', err.message);
        }
    }

    /**
     * پاک کردن generic
     */
    async clear(): Promise<void> {
        await this.clearAllCatalogCache();
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
            const testKey = 'health:check:catalog:test';
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
            console.error('❌ خطا در بررسی سلامت cache:', error);
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