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

    constructor(
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache,
    ) { }

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
            // @ts-ignore
            const keys = await this.cacheManager.store.keys();
            const categoryKeys = keys.filter((key: string) =>
                key.startsWith(`catalog:category:${slug}:`)
            );

            await Promise.all(
                categoryKeys.map((key: string) => this.cacheManager.del(key))
            );

            console.log(`🗑️ پاک شد ${categoryKeys.length} کلید برای category ${slug}`);
        } catch (error) {
            console.error(`خطا در پاک کردن cache category ${slug}:`, error);
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
            // @ts-ignore
            const keys = await this.cacheManager.store.keys();
            const searchKeys = keys.filter((key: string) =>
                key.startsWith('catalog:search:') || key.startsWith('catalog:suggest:')
            );

            await Promise.all(
                searchKeys.map((key: string) => this.cacheManager.del(key))
            );

            console.log(`🗑️ پاک شد ${searchKeys.length} کلید جستجو`);
        } catch (error) {
            console.error('خطا در پاک کردن cache جستجو:', error);
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
        
        console.log(`🗑️ تمام cache دسته‌بندی ${slug} پاک شد`);
    }

    /**
     * پاک کردن کامل cache catalog
     */
    async clearAllCatalogCache(): Promise<void> {
        try {
            // @ts-ignore
            const keys = await this.cacheManager.store.keys();
            const catalogKeys = keys.filter((key: string) =>
                key.startsWith('catalog:')
            );

            await Promise.all(
                catalogKeys.map((key: string) => this.cacheManager.del(key))
            );

            console.log(`🗑️ پاک شد ${catalogKeys.length} کلید catalog`);
        } catch (error) {
            console.error('خطا در پاک کردن cache catalog:', error);
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
            // @ts-ignore
            const keys = await this.cacheManager.store.keys();
            const catalogKeys = keys.filter((key: string) => key.startsWith('catalog:'));

            return {
                totalKeys: catalogKeys.length,
                categoryKeys: catalogKeys.filter((k: string) => k.includes('category:')).length,
                searchKeys: catalogKeys.filter((k: string) => k.includes('search:') || k.includes('suggest:')).length,
                filterKeys: catalogKeys.filter((k: string) => k.includes('filters:') || k.includes('brands:') || k.includes('price-range:') || k.includes('attr:')).length,
            };
        } catch (error) {
            console.error('خطا در گرفتن آمار cache:', error);
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
            console.warn('Cache read error:', err.message);
            return undefined;
        }
    }

    /**
     * ذخیره generic
     */
    async set<T>(key: string, value: T, ttl = 300): Promise<void> {
        try {
            await this.cacheManager.set(key, value, ttl);
        } catch (err) {
            console.warn('Cache write error:', err.message);
        }
    }

    /**
     * پاک کردن generic
     */
    async clear(): Promise<void> {
        await this.clearAllCatalogCache();
    }
}
