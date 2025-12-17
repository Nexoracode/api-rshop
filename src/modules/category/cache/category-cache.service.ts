import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ICategoryResponse } from '../interfaces/category.response.interface';

/**
 * سرویس مدیریت Cache برای Category
 * تمام عملیات cache مربوط به دسته‌بندی‌ها در اینجا متمرکز شده
 */
@Injectable()
export class CategoryCacheService {
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
     * مدت زمان Cache (به ثانیه)
     */
    private readonly CACHE_TTL = {
        CATEGORY_TREE: 3600,      // 1 ساعت
        CATEGORY_DETAIL: 1800,    // 30 دقیقه
        CATEGORY_LIST: 600,       // 10 دقیقه
    };

    constructor(
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache,
    ) { }

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
    async setCategoryBySlug(slug: string, data: ICategoryResponse): Promise<void> {
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
        // پاک کردن tree
        await this.cacheManager.del(this.CACHE_KEYS.CATEGORY_TREE);

        // پاک کردن active categories
        await this.cacheManager.del(this.CACHE_KEYS.ACTIVE_CATEGORIES);

        // پاک کردن تمام کلیدهای pagination
        await this.clearPaginationCache();
    }

    /**
     * پاک کردن cache یک دسته‌بندی خاص
     */
    async clearCategoryCache(categoryId: number, slug?: string): Promise<void> {
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
    }

    /**
     * پاک کردن cache pagination
     */
    async clearPaginationCache(): Promise<void> {
        try {
            // @ts-ignore - cache-manager store.keys() might not be in types
            const keys = await this.cacheManager.store.keys();
            const paginationKeys = keys.filter((key: string) =>
                key.startsWith('category:tree:') &&
                key !== this.CACHE_KEYS.CATEGORY_TREE
            );

            await Promise.all(
                paginationKeys.map((key: string) => this.cacheManager.del(key))
            );
        } catch (error) {
            console.error('خطا در پاک کردن cache pagination:', error);
        }
    }

    /**
     * گرفتن آمار cache
     */
    async getCacheStats(): Promise<{
        hasTree: boolean;
        hasActiveCategories: boolean;
        message: string;
    }> {
        const tree = await this.getCategoryTree();
        const active = await this.getActiveCategories();

        return {
            hasTree: !!tree,
            hasActiveCategories: !!active,
            message: tree
                ? `Tree شامل ${tree.length} دسته‌بندی در cache است`
                : 'هیچ داده‌ای در cache نیست'
        };
    }
}
