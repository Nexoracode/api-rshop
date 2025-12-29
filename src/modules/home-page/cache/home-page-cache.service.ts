import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RedisHelper } from 'src/common/helpers/redis.helper';

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

        // promo banners, featured products, etc. can be added similarly
        PROMO_BANNERS_ACTIVE: 'homepage:promo-banners:active',
        PROMO_BANNERS_ALL: 'homepage:promo-banners:all',
        PROMO_BANNER_BY_ID: (id: number) => `homepage:promo-banner:${id}`,
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
    ) {
        this.logger = new Logger(HomePageCacheService.name);
    }

    private readonly logger: Logger;

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

    async getActivePromoBanner(): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.PROMO_BANNERS_ACTIVE
        );
        return result;
    }

    /**
     * ذخیره اسلایدرهای فعال
     */
    async setActivePromoBanner(data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.PROMO_BANNERS_ACTIVE,
            data,
            this.CACHE_TTL.ACTIVE_ITEMS
        );
    }

    /**
     * دریافت تمام اسلایدرها
     */
    async getAllPromoBanner(): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.PROMO_BANNERS_ALL
        );
        return result;
    }

    /**
     * ذخیره تمام اسلایدرها
     */
    async setAllPromoBanner(data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.PROMO_BANNERS_ALL,
            data,
            this.CACHE_TTL.ALL_ITEMS
        );
    }

    /**
     * دریافت یک اسلایدر
     */
    async getPromoBannerById(id: number): Promise<any> {
        const result = await this.cacheManager.get(
            this.CACHE_KEYS.PROMO_BANNER_BY_ID(id)
        );
        return result;
    }

    /**
     * ذخیره یک اسلایدر
     */
    async setPromoBannerById(id: number, data: any): Promise<void> {
        await this.cacheManager.set(
            this.CACHE_KEYS.PROMO_BANNER_BY_ID(id),
            data,
            this.CACHE_TTL.SINGLE_ITEM
        );
    }

    /**
     * پاک کردن cache اسلایدرها
     */
    async clearPromoBannersCache(promoId?: number): Promise<void> {
        await this.cacheManager.del(this.CACHE_KEYS.PROMO_BANNERS_ACTIVE);
        await this.cacheManager.del(this.CACHE_KEYS.PROMO_BANNERS_ALL);

        if (promoId) {
            await this.cacheManager.del(this.CACHE_KEYS.PROMO_BANNER_BY_ID(promoId));
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
    async clearAllHomepageCache(): Promise<void> {
        try {
            const deletedCount = await RedisHelper.deleteKeysByPattern(
                this.cacheManager,
                'homepage:*'
            );

            this.logger.log(`✅ ${deletedCount} کلید homepage پاک شد`);
        } catch (error) {
            this.logger.error('❌ خطا در پاک کردن cache:', error);
        }
    }

    /**
     * پاک کردن cache با pattern
     */
    /**
 * گرفتن آمار cache
 */
    async getCacheStats(): Promise<{
        totalKeys: number;
        hasFullPage: boolean;
        hasActiveSliders: boolean;
        hasActiveSections: boolean;
        hasActiveBanners: boolean;
        sliderKeys: number;
        sectionKeys: number;
        bannerKeys: number;
    }> {
        try {
            const keys = await RedisHelper.getKeysByPattern(
                this.cacheManager,
                'homepage:*'
            );

            if (keys.length === 0) {
                return {
                    totalKeys: 0,
                    hasFullPage: false,
                    hasActiveSliders: false,
                    hasActiveSections: false,
                    hasActiveBanners: false,
                    sliderKeys: 0,
                    sectionKeys: 0,
                    bannerKeys: 0,
                };
            }

            const cleanKeys = keys.map(key => RedisHelper.cleanKey(key));

            return {
                totalKeys: keys.length,
                hasFullPage: cleanKeys.some(k => k === 'homepage:full'),
                hasActiveSliders: cleanKeys.some(k => k === 'homepage:hero-sliders:active'),
                hasActiveSections: cleanKeys.some(k => k === 'homepage:sections:active'),
                hasActiveBanners: cleanKeys.some(k => k === 'homepage:side-banners:active'),
                sliderKeys: cleanKeys.filter(k => k.includes('hero-sliders:')).length,
                sectionKeys: cleanKeys.filter(k => k.includes('sections:')).length,
                bannerKeys: cleanKeys.filter(k => k.includes('side-banners:')).length,
            };
        } catch (error) {
            this.logger.error('❌ خطا در گرفتن آمار cache:', error);
            return {
                totalKeys: 0,
                hasFullPage: false,
                hasActiveSliders: false,
                hasActiveSections: false,
                hasActiveBanners: false,
                sliderKeys: 0,
                sectionKeys: 0,
                bannerKeys: 0,
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