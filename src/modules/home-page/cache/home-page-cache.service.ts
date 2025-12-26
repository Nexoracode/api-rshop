import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * سرویس مدیریت Cache برای Home Page
 * تمام عملیات cache مربوط به صفحه اصلی در اینجا متمرکز شده
 */
@Injectable()
export class HomePageCacheService {
    /**
     * کلیدهای Cache
     */
    private readonly CACHE_KEYS = {
        // صفحه اصلی کامل
        HOME_PAGE_DATA: 'homepage:full',

        // Hero Sliders
        HERO_SLIDERS_ACTIVE: 'homepage:hero-sliders:active',
        HERO_SLIDERS_ALL: 'homepage:hero-sliders:all',
        HERO_SLIDER_BY_ID: (id: number) => `homepage:hero-slider:${id}`,

        // Home Sections
        HOME_SECTIONS_ACTIVE: 'homepage:sections:active',
        HOME_SECTIONS_ALL: 'homepage:sections:all',
        HOME_SECTION_BY_ID: (id: number) => `homepage:section:${id}`,

        // Side Banners
        SIDE_BANNERS_ACTIVE: 'homepage:side-banners:active',
        SIDE_BANNERS_ALL: 'homepage:side-banners:all',
        SIDE_BANNER_BY_ID: (id: number) => `homepage:side-banner:${id}`,
    };

    /**
     * مدت زمان Cache (به میلی‌ثانیه)
     * ⚠️ توجه: cache-manager-redis-yet از میلی‌ثانیه استفاده می‌کند
     */
    private readonly CACHE_TTL = {
        HOME_PAGE_FULL: 1800 * 1000,     // 30 دقیقه
        ACTIVE_ITEMS: 3600 * 1000,       // 1 ساعت (برای آیتم‌های فعال)
        ALL_ITEMS: 600 * 1000,           // 10 دقیقه (برای لیست کامل ادمین)
        SINGLE_ITEM: 1800 * 1000,        // 30 دقیقه
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
        const store = this.getStore();

        // در Keyv، Redis client در store.redis قرار داره
        if (store?.redis) {
            return store.redis;
        }

        return null;
    }

    // ==================== صفحه اصلی کامل ====================

    /**
     * دریافت داده کامل صفحه اصلی
     */
    async getHomePageData(): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.HOME_PAGE_DATA
        );
        return result;
    }

    /**
     * ذخیره داده کامل صفحه اصلی
     */
    async setHomePageData(data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.HOME_PAGE_DATA,
            data,
            this.CACHE_TTL.HOME_PAGE_FULL
        );
    }

    /**
     * پاک کردن داده کامل صفحه اصلی
     */
    async clearHomePageData(): Promise<void> {
        await this.cacheManager.del(this.CACHE_KEYS.HOME_PAGE_DATA);
    }

    // ==================== Hero Sliders ====================

    /**
     * دریافت اسلایدرهای فعال
     */
    async getActiveHeroSliders(): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.HERO_SLIDERS_ACTIVE
        );
        return result;
    }

    /**
     * ذخیره اسلایدرهای فعال
     */
    async setActiveHeroSliders(data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.HERO_SLIDERS_ACTIVE,
            data,
            this.CACHE_TTL.ACTIVE_ITEMS
        );
    }

    /**
     * دریافت تمام اسلایدرها
     */
    async getAllHeroSliders(): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.HERO_SLIDERS_ALL
        );
        return result;
    }

    /**
     * ذخیره تمام اسلایدرها
     */
    async setAllHeroSliders(data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.HERO_SLIDERS_ALL,
            data,
            this.CACHE_TTL.ALL_ITEMS
        );
    }

    /**
     * دریافت یک اسلایدر
     */
    async getHeroSliderById(id: number): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.HERO_SLIDER_BY_ID(id)
        );
        return result;
    }

    /**
     * ذخیره یک اسلایدر
     */
    async setHeroSliderById(id: number, data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.HERO_SLIDER_BY_ID(id),
            data,
            this.CACHE_TTL.SINGLE_ITEM
        );
    }

    /**
     * پاک کردن cache اسلایدرها
     */
    async clearHeroSlidersCache(sliderId?: number): Promise<void> {
        await this.cacheManager.del(this.CACHE_KEYS.HERO_SLIDERS_ACTIVE);
        await this.cacheManager.del(this.CACHE_KEYS.HERO_SLIDERS_ALL);

        if (sliderId) {
            await this.cacheManager.del(this.CACHE_KEYS.HERO_SLIDER_BY_ID(sliderId));
        }

        // پاک کردن صفحه اصلی
        await this.clearHomePageData();
    }

    // ==================== Home Sections ====================

    /**
     * دریافت بخش‌های فعال
     */
    async getActiveHomeSections(): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.HOME_SECTIONS_ACTIVE
        );
        return result;
    }

    /**
     * ذخیره بخش‌های فعال
     */
    async setActiveHomeSections(data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.HOME_SECTIONS_ACTIVE,
            data,
            this.CACHE_TTL.ACTIVE_ITEMS
        );
    }

    /**
     * دریافت تمام بخش‌ها
     */
    async getAllHomeSections(): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.HOME_SECTIONS_ALL
        );
        return result;
    }

    /**
     * ذخیره تمام بخش‌ها
     */
    async setAllHomeSections(data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.HOME_SECTIONS_ALL,
            data,
            this.CACHE_TTL.ALL_ITEMS
        );
    }

    /**
     * دریافت یک بخش
     */
    async getHomeSectionById(id: number): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.HOME_SECTION_BY_ID(id)
        );
        return result;
    }

    /**
     * ذخیره یک بخش
     */
    async setHomeSectionById(id: number, data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.HOME_SECTION_BY_ID(id),
            data,
            this.CACHE_TTL.SINGLE_ITEM
        );
    }

    /**
     * پاک کردن cache بخش‌ها
     */
    async clearHomeSectionsCache(sectionId?: number): Promise<void> {
        await this.cacheManager.del(this.CACHE_KEYS.HOME_SECTIONS_ACTIVE);
        await this.cacheManager.del(this.CACHE_KEYS.HOME_SECTIONS_ALL);

        if (sectionId) {
            await this.cacheManager.del(this.CACHE_KEYS.HOME_SECTION_BY_ID(sectionId));
        }

        // پاک کردن صفحه اصلی
        await this.clearHomePageData();
    }

    // ==================== Side Banners ====================

    /**
     * دریافت بنرهای فعال
     */
    async getActiveSideBanners(): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.SIDE_BANNERS_ACTIVE
        );
        return result;
    }

    /**
     * ذخیره بنرهای فعال
     */
    async setActiveSideBanners(data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.SIDE_BANNERS_ACTIVE,
            data,
            this.CACHE_TTL.ACTIVE_ITEMS
        );
    }

    /**
     * دریافت تمام بنرها
     */
    async getAllSideBanners(): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.SIDE_BANNERS_ALL
        );
        return result;
    }

    /**
     * ذخیره تمام بنرها
     */
    async setAllSideBanners(data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.SIDE_BANNERS_ALL,
            data,
            this.CACHE_TTL.ALL_ITEMS
        );
    }

    /**
     * دریافت یک بنر
     */
    async getSideBannerById(id: number): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.SIDE_BANNER_BY_ID(id)
        );
        return result;
    }

    /**
     * ذخیره یک بنر
     */
    async setSideBannerById(id: number, data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.SIDE_BANNER_BY_ID(id),
            data,
            this.CACHE_TTL.SINGLE_ITEM
        );
    }

    /**
     * پاک کردن cache بنرها
     */
    async clearSideBannersCache(bannerId?: number): Promise<void> {
        await this.cacheManager.del(this.CACHE_KEYS.SIDE_BANNERS_ACTIVE);
        await this.cacheManager.del(this.CACHE_KEYS.SIDE_BANNERS_ALL);

        if (bannerId) {
            await this.cacheManager.del(this.CACHE_KEYS.SIDE_BANNER_BY_ID(bannerId));
        }

        // پاک کردن صفحه اصلی
        await this.clearHomePageData();
    }

    // ==================== پاک‌سازی کلی ====================

    /**
     * پاک کردن کامل cache صفحه اصلی
     */
    async clearAllHomePageCache(): Promise<void> {
        try {
            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                console.log('🔍 پاک کردن تمام cache صفحه اصلی با Redis...');

                const pattern = `${this.NAMESPACE}:homepage:*`;
                const keys = await redisClient.keys(pattern);

                if (keys && keys.length > 0) {
                    const pipeline = redisClient.pipeline();
                    keys.forEach((key: string) => pipeline.del(key));
                    await pipeline.exec();

                    console.log(`✅ ${keys.length} کلید cache صفحه اصلی پاک شد`);
                } else {
                    console.log('ℹ️ هیچ کلید صفحه اصلی برای پاک کردن پیدا نشد');
                }
                return;
            }

            // فال‌بک: استفاده از Iterator
            const store = this.getStore();

            if (store && typeof store.iterator === 'function') {
                console.log('🔍 پاک کردن cache صفحه اصلی با Iterator...');

                const keysToDelete: string[] = [];

                for await (const [key] of store.iterator(this.NAMESPACE)) {
                    if (key.startsWith('homepage:')) {
                        keysToDelete.push(key);
                    }
                }

                if (keysToDelete.length > 0) {
                    await Promise.allSettled(
                        keysToDelete.map(key => this.cacheManager.del(key))
                    );
                    console.log(`✅ ${keysToDelete.length} کلید cache صفحه اصلی پاک شد`);
                }
                return;
            }

            console.warn('⚠️ امکان پاک کردن کامل cache موجود نیست');
        } catch (error) {
            console.error('❌ خطا در پاک کردن cache صفحه اصلی:', error);
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
        hasFullPage: boolean;
        hasActiveSliders: boolean;
        hasActiveSections: boolean;
        hasActiveBanners: boolean;
        totalKeys: number;
        sliderKeys: number;
        sectionKeys: number;
        bannerKeys: number;
    }> {
        try {
            const fullPage = await this.getHomePageData();
            const sliders = await this.getActiveHeroSliders();
            const sections = await this.getActiveHomeSections();
            const banners = await this.getActiveSideBanners();

            const redisClient = this.getRedisClient();

            if (redisClient && typeof redisClient.keys === 'function') {
                const pattern = `${this.NAMESPACE}:homepage:*`;
                const keys = await redisClient.keys(pattern);

                if (!keys || keys.length === 0) {
                    return {
                        hasFullPage: !!fullPage,
                        hasActiveSliders: !!sliders,
                        hasActiveSections: !!sections,
                        hasActiveBanners: !!banners,
                        totalKeys: 0,
                        sliderKeys: 0,
                        sectionKeys: 0,
                        bannerKeys: 0,
                    };
                }

                // حذف namespace از کلیدها برای بررسی
                const cleanKeys = keys.map((key: string) =>
                    key.replace(`${this.NAMESPACE}:`, '')
                );

                const sliderKeys = cleanKeys.filter((key: string) =>
                    key.includes('hero-slider')
                );

                const sectionKeys = cleanKeys.filter((key: string) =>
                    key.includes('section')
                );

                const bannerKeys = cleanKeys.filter((key: string) =>
                    key.includes('banner')
                );

                return {
                    hasFullPage: !!fullPage,
                    hasActiveSliders: !!sliders,
                    hasActiveSections: !!sections,
                    hasActiveBanners: !!banners,
                    totalKeys: keys.length,
                    sliderKeys: sliderKeys.length,
                    sectionKeys: sectionKeys.length,
                    bannerKeys: bannerKeys.length,
                };
            }

            return {
                hasFullPage: !!fullPage,
                hasActiveSliders: !!sliders,
                hasActiveSections: !!sections,
                hasActiveBanners: !!banners,
                totalKeys: 0,
                sliderKeys: 0,
                sectionKeys: 0,
                bannerKeys: 0,
            };
        } catch (error) {
            console.error('❌ خطا در گرفتن آمار cache:', error);
            return {
                hasFullPage: false,
                hasActiveSliders: false,
                hasActiveSections: false,
                hasActiveBanners: false,
                totalKeys: 0,
                sliderKeys: 0,
                sectionKeys: 0,
                bannerKeys: 0,
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
            const testKey = 'health:check:homepage:test';
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