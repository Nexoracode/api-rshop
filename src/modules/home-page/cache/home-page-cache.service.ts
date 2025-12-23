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

    constructor(
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache,
    ) { }

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
            // @ts-ignore
            const keys = await this.cacheManager.store.keys();
            const homePageKeys = keys.filter((key: string) =>
                key.startsWith('homepage:')
            );

            await Promise.all(
                homePageKeys.map((key: string) => this.cacheManager.del(key))
            );

            console.log(`🗑️ پاک شد ${homePageKeys.length} کلید cache صفحه اصلی`);
        } catch (error) {
            console.error('خطا در پاک کردن cache صفحه اصلی:', error);
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
    }> {
        try {
            const fullPage = await this.getHomePageData();
            const sliders = await this.getActiveHeroSliders();
            const sections = await this.getActiveHomeSections();
            const banners = await this.getActiveSideBanners();

            // @ts-ignore
            const keys = await this.cacheManager.store.keys();
            const homePageKeys = keys.filter((key: string) =>
                key.startsWith('homepage:')
            );

            return {
                hasFullPage: !!fullPage,
                hasActiveSliders: !!sliders,
                hasActiveSections: !!sections,
                hasActiveBanners: !!banners,
                totalKeys: homePageKeys.length,
            };
        } catch (error) {
            console.error('خطا در گرفتن آمار cache:', error);
            return {
                hasFullPage: false,
                hasActiveSliders: false,
                hasActiveSections: false,
                hasActiveBanners: false,
                totalKeys: 0,
            };
        }
    }
}
