// src/homepage/services/homepage-cache.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RedisHelper } from 'src/common/helpers/redis.helper';

/**
 * سرویس مدیریت Cache برای HomePage
 */
@Injectable()
export class HomePageCacheService {
    private readonly logger = new Logger(HomePageCacheService.name);

    /**
     * کلیدهای Cache
     */
    private readonly CACHE_KEYS = {
        // ✅ دو کلید جداگانه برای admin و public
        FULL_PAGE_PUBLIC: 'homepage:full:public',
        FULL_PAGE_ADMIN: 'homepage:full:admin',

        // ✅ Cache جداگانه برای Layout Type
        LAYOUT_TYPE: 'homepage:layout-type',

        HERO_SLIDERS_ACTIVE: 'homepage:hero-sliders:active',
        HERO_SLIDERS_ALL: 'homepage:hero-sliders:all',
        HERO_SLIDER_DETAIL: (id: number) => `homepage:hero-slider:${id}`,

        SIDE_BANNERS_ACTIVE: 'homepage:side-banners:active',
        SIDE_BANNERS_ALL: 'homepage:side-banners:all',
        SIDE_BANNER_DETAIL: (id: number) => `homepage:side-banner:${id}`,

        PROMO_BANNERS_ACTIVE: 'homepage:promo-banners:active',
        PROMO_BANNERS_ALL: 'homepage:promo-banners:all',
        PROMO_BANNER_DETAIL: (id: number) => `homepage:promo-banner:${id}`,

        SECTIONS_ACTIVE: 'homepage:sections:active',
        SECTIONS_ALL: 'homepage:sections:all',
        SECTION_DETAIL: (id: number) => `homepage:section:${id}`,
        SECTION_PRODUCTS: (sectionId: number, isActive: boolean) =>
            `homepage:section:${sectionId}:products:${isActive ? 'active' : 'all'}`,
    };

    /**
     * مدت زمان Cache (به میلی‌ثانیه)
     */
    private readonly CACHE_TTL = {
        FULL_PAGE: 600 * 1000,              // 10 دقیقه
        LAYOUT_TYPE: 86400 * 1000,          // 24 ساعت (خیلی کم تغییر میکنه)
        HERO_SLIDERS: 1800 * 1000,          // 30 دقیقه
        SIDE_BANNERS: 1800 * 1000,          // 30 دقیقه
        SECTIONS: 1800 * 1000,              // 30 دقیقه
        DETAIL: 3600 * 1000,                // 1 ساعت
    };

    /**
     * Namespace برای Redis
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
        return RedisHelper.getRedisClient(this.cacheManager);
    }

    // ==================== Full Page Data ====================

    /**
     * دریافت داده کامل صفحه اصلی
     */
    async getHomePageData(forAdmin: boolean = false): Promise<any> {
        try {
            const key = forAdmin
                ? this.CACHE_KEYS.FULL_PAGE_ADMIN
                : this.CACHE_KEYS.FULL_PAGE_PUBLIC;

            return await this.cacheManager.get(key);
        } catch (error) {
            this.logger.warn('خطا در خواندن cache صفحه اصلی:', error.message);
            return undefined;
        }
    }

    /**
     * ذخیره داده کامل صفحه اصلی
     */
    async setHomePageData(data: any, forAdmin: boolean = false): Promise<void> {
        try {
            const key = forAdmin
                ? this.CACHE_KEYS.FULL_PAGE_ADMIN
                : this.CACHE_KEYS.FULL_PAGE_PUBLIC;

            await this.cacheManager.set(
                key,
                data,
                this.CACHE_TTL.FULL_PAGE
            );
        } catch (error) {
            this.logger.warn('خطا در ذخیره cache صفحه اصلی:', error.message);
        }
    }

    // ==================== Layout Type ====================

    /**
     * دریافت Layout Type از cache
     */
    async getLayoutType(): Promise<string | undefined> {
        try {
            return await this.cacheManager.get(this.CACHE_KEYS.LAYOUT_TYPE);
        } catch (error) {
            this.logger.warn('خطا در خواندن layout type از cache:', error.message);
            return undefined;
        }
    }

    /**
     * ذخیره Layout Type در cache
     */
    async setLayoutType(layoutType: string): Promise<void> {
        try {
            await this.cacheManager.set(
                this.CACHE_KEYS.LAYOUT_TYPE,
                layoutType,
                this.CACHE_TTL.LAYOUT_TYPE
            );
            this.logger.debug(`📋 Layout type cached: ${layoutType}`);
        } catch (error) {
            this.logger.warn('خطا در ذخیره layout type:', error.message);
        }
    }

    /**
     * پاک کردن Layout Type cache
     */
    async clearLayoutTypeCache(): Promise<void> {
        try {
            await this.cacheManager.del(this.CACHE_KEYS.LAYOUT_TYPE);
            this.logger.log('✅ Cache layout type پاک شد');
        } catch (error) {
            this.logger.error('❌ خطا در پاک کردن layout type cache:', error);
        }
    }

    /**
     * پاک کردن cache صفحه اصلی
     */
    async clearHomePageData(): Promise<void> {
        try {
            await Promise.allSettled([
                this.cacheManager.del(this.CACHE_KEYS.FULL_PAGE_PUBLIC),
                this.cacheManager.del(this.CACHE_KEYS.FULL_PAGE_ADMIN),
            ]);
        } catch (error) {
            this.logger.warn('خطا در پاک کردن cache صفحه اصلی:', error.message);
        }
    }

    // ==================== Hero Sliders ====================

    /**
     * دریافت لیست اسلایدرها
     */
    async getHeroSliders(onlyActive: boolean = false): Promise<any> {
        try {
            const key = onlyActive
                ? this.CACHE_KEYS.HERO_SLIDERS_ACTIVE
                : this.CACHE_KEYS.HERO_SLIDERS_ALL;
            return await this.cacheManager.get(key);
        } catch (error) {
            this.logger.warn('خطا در خواندن cache اسلایدرها:', error.message);
            return undefined;
        }
    }

    /**
     * دریافت لیست همه اسلایدرها
     */
    async getAllHeroSliders(): Promise<any> {
        return await this.getHeroSliders(false);
    }

    /**
     * دریافت لیست اسلایدرهای فعال
     */
    async getActiveHeroSliders(): Promise<any> {
        return await this.getHeroSliders(true);
    }

    /**
     * دریافت یک اسلایدر با ID
     */
    async getHeroSliderById(id: number): Promise<any> {
        try {
            return await this.cacheManager.get(this.CACHE_KEYS.HERO_SLIDER_DETAIL(id));
        } catch (error) {
            this.logger.warn(`خطا در خواندن cache اسلایدر ${id}:`, error.message);
            return undefined;
        }
    }

    /**
     * ذخیره لیست اسلایدرها
     */
    async setHeroSliders(data: any, onlyActive: boolean = false): Promise<void> {
        try {
            const key = onlyActive
                ? this.CACHE_KEYS.HERO_SLIDERS_ACTIVE
                : this.CACHE_KEYS.HERO_SLIDERS_ALL;
            await this.cacheManager.set(key, data, this.CACHE_TTL.HERO_SLIDERS);
        } catch (error) {
            this.logger.warn('خطا در ذخیره cache اسلایدرها:', error.message);
        }
    }

    /**
     * ذخیره لیست همه اسلایدرها
     */
    async setAllHeroSliders(data: any): Promise<void> {
        await this.setHeroSliders(data, false);
    }

    /**
     * ذخیره لیست اسلایدرهای فعال
     */
    async setActiveHeroSliders(data: any): Promise<void> {
        await this.setHeroSliders(data, true);
    }

    /**
     * ذخیره یک اسلایدر با ID
     */
    async setHeroSliderById(id: number, data: any): Promise<void> {
        try {
            await this.cacheManager.set(
                this.CACHE_KEYS.HERO_SLIDER_DETAIL(id),
                data,
                this.CACHE_TTL.DETAIL
            );
        } catch (error) {
            this.logger.warn(`خطا در ذخیره cache اسلایدر ${id}:`, error.message);
        }
    }

    /**
     * پاک کردن cache اسلایدرها
     */
    async clearHeroSlidersCache(sliderId?: number): Promise<void> {
        try {
            const promises = [
                this.cacheManager.del(this.CACHE_KEYS.HERO_SLIDERS_ACTIVE),
                this.cacheManager.del(this.CACHE_KEYS.HERO_SLIDERS_ALL),
                this.clearHomePageData(), // پاک کردن صفحه کامل
            ];

            if (sliderId) {
                promises.push(
                    this.cacheManager.del(this.CACHE_KEYS.HERO_SLIDER_DETAIL(sliderId))
                );
            }

            await Promise.allSettled(promises);
            this.logger.log('✅ Cache اسلایدرها پاک شد');
        } catch (error) {
            this.logger.error('❌ خطا در پاک کردن cache اسلایدرها:', error);
        }
    }

    // ==================== Side Banners ====================

    /**
     * دریافت لیست بنرها
     */
    async getSideBanners(onlyActive: boolean = false): Promise<any> {
        try {
            const key = onlyActive
                ? this.CACHE_KEYS.SIDE_BANNERS_ACTIVE
                : this.CACHE_KEYS.SIDE_BANNERS_ALL;
            return await this.cacheManager.get(key);
        } catch (error) {
            this.logger.warn('خطا در خواندن cache بنرها:', error.message);
            return undefined;
        }
    }

    /**
     * دریافت لیست همه بنرها
     */
    async getAllSideBanners(): Promise<any> {
        return await this.getSideBanners(false);
    }

    /**
     * دریافت لیست بنرهای فعال
     */
    async getActiveSideBanners(): Promise<any> {
        return await this.getSideBanners(true);
    }

    /**
     * دریافت یک بنر با ID
     */
    async getSideBannerById(id: number): Promise<any> {
        try {
            return await this.cacheManager.get(this.CACHE_KEYS.SIDE_BANNER_DETAIL(id));
        } catch (error) {
            this.logger.warn(`خطا در خواندن cache بنر ${id}:`, error.message);
            return undefined;
        }
    }

    /**
     * ذخیره لیست بنرها
     */
    async setSideBanners(data: any, onlyActive: boolean = false): Promise<void> {
        try {
            const key = onlyActive
                ? this.CACHE_KEYS.SIDE_BANNERS_ACTIVE
                : this.CACHE_KEYS.SIDE_BANNERS_ALL;
            await this.cacheManager.set(key, data, this.CACHE_TTL.SIDE_BANNERS);
        } catch (error) {
            this.logger.warn('خطا در ذخیره cache بنرها:', error.message);
        }
    }

    /**
     * ذخیره لیست همه بنرها
     */
    async setAllSideBanners(data: any): Promise<void> {
        await this.setSideBanners(data, false);
    }

    /**
     * ذخیره لیست بنرهای فعال
     */
    async setActiveSideBanners(data: any): Promise<void> {
        await this.setSideBanners(data, true);
    }

    /**
     * ذخیره یک بنر با ID
     */
    async setSideBannerById(id: number, data: any): Promise<void> {
        try {
            await this.cacheManager.set(
                this.CACHE_KEYS.SIDE_BANNER_DETAIL(id),
                data,
                this.CACHE_TTL.DETAIL
            );
        } catch (error) {
            this.logger.warn(`خطا در ذخیره cache بنر ${id}:`, error.message);
        }
    }

    /**
     * پاک کردن cache بنرها
     */
    async clearSideBannersCache(bannerId?: number): Promise<void> {
        try {
            const promises = [
                this.cacheManager.del(this.CACHE_KEYS.SIDE_BANNERS_ACTIVE),
                this.cacheManager.del(this.CACHE_KEYS.SIDE_BANNERS_ALL),
                this.clearHomePageData(),
            ];

            if (bannerId) {
                promises.push(
                    this.cacheManager.del(this.CACHE_KEYS.SIDE_BANNER_DETAIL(bannerId))
                );
            }

            await Promise.allSettled(promises);
            this.logger.log('✅ Cache بنرها پاک شد');
        } catch (error) {
            this.logger.error('❌ خطا در پاک کردن cache بنرها:', error);
        }
    }

    // ==================== Promo Banners ====================

    /**
     * دریافت لیست همه بنرهای تبلیغاتی
     */
    async getAllPromoBanner(): Promise<any> {
        try {
            return await this.cacheManager.get(this.CACHE_KEYS.PROMO_BANNERS_ALL);
        } catch (error) {
            this.logger.warn('خطا در خواندن cache بنرهای تبلیغاتی:', error.message);
            return undefined;
        }
    }

    /**
     * دریافت لیست بنرهای تبلیغاتی فعال
     */
    async getActivePromoBanner(): Promise<any> {
        try {
            return await this.cacheManager.get(this.CACHE_KEYS.PROMO_BANNERS_ACTIVE);
        } catch (error) {
            this.logger.warn('خطا در خواندن cache بنرهای تبلیغاتی فعال:', error.message);
            return undefined;
        }
    }

    /**
     * دریافت یک بنر تبلیغاتی با ID
     */
    async getPromoBannerById(id: number): Promise<any> {
        try {
            return await this.cacheManager.get(this.CACHE_KEYS.PROMO_BANNER_DETAIL(id));
        } catch (error) {
            this.logger.warn(`خطا در خواندن cache بنر تبلیغاتی ${id}:`, error.message);
            return undefined;
        }
    }

    /**
     * ذخیره لیست همه بنرهای تبلیغاتی
     */
    async setAllPromoBanner(data: any): Promise<void> {
        try {
            await this.cacheManager.set(
                this.CACHE_KEYS.PROMO_BANNERS_ALL,
                data,
                this.CACHE_TTL.SIDE_BANNERS // استفاده از همان TTL بنرها
            );
        } catch (error) {
            this.logger.warn('خطا در ذخیره cache بنرهای تبلیغاتی:', error.message);
        }
    }

    /**
     * ذخیره لیست بنرهای تبلیغاتی فعال
     */
    async setActivePromoBanner(data: any): Promise<void> {
        try {
            await this.cacheManager.set(
                this.CACHE_KEYS.PROMO_BANNERS_ACTIVE,
                data,
                this.CACHE_TTL.SIDE_BANNERS
            );
        } catch (error) {
            this.logger.warn('خطا در ذخیره cache بنرهای تبلیغاتی فعال:', error.message);
        }
    }

    /**
     * ذخیره یک بنر تبلیغاتی با ID
     */
    async setPromoBannerById(id: number, data: any): Promise<void> {
        try {
            await this.cacheManager.set(
                this.CACHE_KEYS.PROMO_BANNER_DETAIL(id),
                data,
                this.CACHE_TTL.DETAIL
            );
        } catch (error) {
            this.logger.warn(`خطا در ذخیره cache بنر تبلیغاتی ${id}:`, error.message);
        }
    }

    /**
     * پاک کردن cache بنرهای تبلیغاتی
     */
    async clearPromoBannersCache(bannerId?: number): Promise<void> {
        try {
            const promises = [
                this.cacheManager.del(this.CACHE_KEYS.PROMO_BANNERS_ACTIVE),
                this.cacheManager.del(this.CACHE_KEYS.PROMO_BANNERS_ALL),
                this.clearHomePageData(),
            ];

            if (bannerId) {
                promises.push(
                    this.cacheManager.del(this.CACHE_KEYS.PROMO_BANNER_DETAIL(bannerId))
                );
            }

            await Promise.allSettled(promises);
            this.logger.log('✅ Cache بنرهای تبلیغاتی پاک شد');
        } catch (error) {
            this.logger.error('❌ خطا در پاک کردن cache بنرهای تبلیغاتی:', error);
        }
    }

    // ==================== Sections ====================

    /**
     * دریافت لیست بخش‌ها
     */
    async getSections(onlyActive: boolean = false): Promise<any> {
        try {
            const key = onlyActive
                ? this.CACHE_KEYS.SECTIONS_ACTIVE
                : this.CACHE_KEYS.SECTIONS_ALL;
            return await this.cacheManager.get(key);
        } catch (error) {
            this.logger.warn('خطا در خواندن cache بخش‌ها:', error.message);
            return undefined;
        }
    }

    /**
     * دریافت لیست همه بخش‌ها
     */
    async getAllHomeSections(): Promise<any> {
        return await this.getSections(false);
    }

    /**
     * دریافت لیست بخش‌های فعال
     */
    async getActiveHomeSections(): Promise<any> {
        return await this.getSections(true);
    }

    /**
     * دریافت یک بخش با ID
     */
    async getHomeSectionById(id: number): Promise<any> {
        try {
            return await this.cacheManager.get(this.CACHE_KEYS.SECTION_DETAIL(id));
        } catch (error) {
            this.logger.warn(`خطا در خواندن cache بخش ${id}:`, error.message);
            return undefined;
        }
    }

    /**
     * ذخیره لیست بخش‌ها
     */
    async setSections(data: any, onlyActive: boolean = false): Promise<void> {
        try {
            const key = onlyActive
                ? this.CACHE_KEYS.SECTIONS_ACTIVE
                : this.CACHE_KEYS.SECTIONS_ALL;
            await this.cacheManager.set(key, data, this.CACHE_TTL.SECTIONS);
        } catch (error) {
            this.logger.warn('خطا در ذخیره cache بخش‌ها:', error.message);
        }
    }

    /**
     * ذخیره لیست همه بخش‌ها
     */
    async setAllHomeSections(data: any): Promise<void> {
        await this.setSections(data, false);
    }

    /**
     * ذخیره لیست بخش‌های فعال
     */
    async setActiveHomeSections(data: any): Promise<void> {
        await this.setSections(data, true);
    }

    /**
     * ذخیره یک بخش با ID
     */
    async setHomeSectionById(id: number, data: any): Promise<void> {
        try {
            await this.cacheManager.set(
                this.CACHE_KEYS.SECTION_DETAIL(id),
                data,
                this.CACHE_TTL.DETAIL
            );
        } catch (error) {
            this.logger.warn(`خطا در ذخیره cache بخش ${id}:`, error.message);
        }
    }

    /**
     * پاک کردن cache بخش‌ها
     */
    async clearHomeSectionsCache(sectionId?: number): Promise<void> {
        try {
            const promises = [
                this.cacheManager.del(this.CACHE_KEYS.SECTIONS_ACTIVE),
                this.cacheManager.del(this.CACHE_KEYS.SECTIONS_ALL),
                this.clearHomePageData(),
            ];

            if (sectionId) {
                promises.push(
                    this.cacheManager.del(this.CACHE_KEYS.SECTION_DETAIL(sectionId))
                );
            }

            await Promise.allSettled(promises);
            this.logger.log('✅ Cache بخش‌ها پاک شد');
        } catch (error) {
            this.logger.error('❌ خطا در پاک کردن cache بخش‌ها:', error);
        }
    }

    // ==================== پاک‌سازی کلی ====================

    /**
     * پاک کردن کامل cache HomePage
     */
    async clearAllHomePageCache(): Promise<void> {
        try {
            const deletedCount = await RedisHelper.deleteKeysByPattern(
                this.cacheManager,
                'homepage:*'
            );

            this.logger.log(`✅ ${deletedCount} کلید homepage پاک شد`);
        } catch (error) {
            this.logger.error('❌ خطا در پاک کردن cache homepage:', error);
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
     * گرفتن آمار cache
     */
    async getCacheStats(): Promise<{
        totalKeys: number;
        hasFullPagePublic: boolean;
        hasFullPageAdmin: boolean;
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
                    hasFullPagePublic: false,
                    hasFullPageAdmin: false,
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
                hasFullPagePublic: cleanKeys.some(k => k === 'homepage:full:public'),
                hasFullPageAdmin: cleanKeys.some(k => k === 'homepage:full:admin'),
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
                hasFullPagePublic: false,
                hasFullPageAdmin: false,
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
            const testKey = 'health:check:homepage:test';
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