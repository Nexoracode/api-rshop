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

    constructor(
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache,
    ) { }

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
            // @ts-ignore
            const keys = await this.cacheManager.store.keys();
            const productKeys = keys.filter((key: string) =>
                key.startsWith('product:')
            );

            await Promise.all(
                productKeys.map((key: string) => this.cacheManager.del(key))
            );

            console.log(`🗑️ پاک شد ${productKeys.length} کلید cache محصول`);
        } catch (error) {
            console.error('خطا در پاک کردن cache محصولات:', error);
        }
    }

    /**
     * پاک کردن cache یک محصول خاص
     */
    async clearProductCache(productId: number, slug?: string): Promise<void> {
        // پاک کردن cache این محصول
        await this.cacheManager.del(this.CACHE_KEYS.PRODUCT_BY_ID(productId));

        // پاک کردن cache slug
        if (slug) {
            await this.cacheManager.del(this.CACHE_KEYS.PRODUCT_BY_SLUG(slug));
        }

        // پاک کردن لیست‌ها (چون محصول تغییر کرده)
        await this.clearListCaches();

        console.log(`🗑️ Cache پاک شد برای محصول ${productId}`);
    }

    /**
     * پاک کردن cache لیست‌ها
     */
    async clearListCaches(): Promise<void> {
        try {
            // @ts-ignore
            const keys = await this.cacheManager.store.keys();
            const listKeys = keys.filter((key: string) =>
                key.startsWith('product:list:') ||
                key.startsWith('product:featured:') ||
                key.startsWith('product:new:') ||
                key.startsWith('product:bestsellers:') ||
                key.startsWith('product:onsale:') ||
                key.startsWith('product:category:') ||
                key.startsWith('product:brand:') ||
                key.startsWith('product:search:')
            );

            await Promise.all(
                listKeys.map((key: string) => this.cacheManager.del(key))
            );
        } catch (error) {
            console.error('خطا در پاک کردن cache لیست‌ها:', error);
        }
    }

    /**
     * پاک کردن cache محصولات یک دسته‌بندی
     */
    async clearCategoryProductsCache(categoryId: number): Promise<void> {
        try {
            // @ts-ignore
            const keys = await this.cacheManager.store.keys();
            const categoryKeys = keys.filter((key: string) =>
                key.startsWith(`product:category:${categoryId}:`)
            );

            await Promise.all(
                categoryKeys.map((key: string) => this.cacheManager.del(key))
            );

            console.log(`🗑️ Cache محصولات دسته ${categoryId} پاک شد`);
        } catch (error) {
            console.error('خطا در پاک کردن cache محصولات دسته:', error);
        }
    }

    /**
     * پاک کردن cache محصولات یک برند
     */
    async clearBrandProductsCache(brandId: number): Promise<void> {
        try {
            // @ts-ignore
            const keys = await this.cacheManager.store.keys();
            const brandKeys = keys.filter((key: string) =>
                key.startsWith(`product:brand:${brandId}:`)
            );

            await Promise.all(
                brandKeys.map((key: string) => this.cacheManager.del(key))
            );

            console.log(`🗑️ Cache محصولات برند ${brandId} پاک شد`);
        } catch (error) {
            console.error('خطا در پاک کردن cache محصولات برند:', error);
        }
    }

    /**
     * پاک کردن cache جستجو
     */
    async clearSearchCache(): Promise<void> {
        try {
            // @ts-ignore
            const keys = await this.cacheManager.store.keys();
            const searchKeys = keys.filter((key: string) =>
                key.startsWith('product:search:')
            );

            await Promise.all(
                searchKeys.map((key: string) => this.cacheManager.del(key))
            );

            console.log('🗑️ Cache جستجو پاک شد');
        } catch (error) {
            console.error('خطا در پاک کردن cache جستجو:', error);
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
            // @ts-ignore
            const keys = await this.cacheManager.store.keys();
            const productKeys = keys.filter((key: string) =>
                key.startsWith('product:')
            );

            const detailKeys = productKeys.filter((key: string) =>
                key.match(/^product:\d+$/) || key.startsWith('product:slug:')
            );

            const listKeys = productKeys.filter((key: string) =>
                key.startsWith('product:list:')
            );

            const specialKeys = productKeys.filter((key: string) =>
                key.startsWith('product:featured:') ||
                key.startsWith('product:new:') ||
                key.startsWith('product:bestsellers:') ||
                key.startsWith('product:onsale:')
            );

            return {
                totalKeys: productKeys.length,
                detailKeys: detailKeys.length,
                listKeys: listKeys.length,
                specialKeys: specialKeys.length,
            };
        } catch (error) {
            console.error('خطا در گرفتن آمار cache:', error);
            return {
                totalKeys: 0,
                detailKeys: 0,
                listKeys: 0,
                specialKeys: 0,
            };
        }
    }
}
