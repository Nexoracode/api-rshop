import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeroSlider } from './entities/hero-slider.entity';
import { SideBanner } from './entities/side-banner.entity';
import { HomeSection } from './entities/home-section.entity';
import { HomePageClickAnalytics } from './entities/homepage-click-analytics.entity';
import { Product } from '../product/entities/product.entity';
import { Category } from '../category/entities/category.entity';
import { Brand } from '../brand/entities/brand.entity';

// Services
import { HeroSliderService } from './hero-slider.service';
import { SideBannerService } from './side-banner.service';
import { HomeSectionService } from './home-section.service';
import { HomePageService } from './home-page.service';
import { HomePageAnalyticsService } from './homepage-analytics.service';
import { HomePageCacheService } from './cache/home-page-cache.service'; // ✅ اضافه شد

// Controllers
import { HomePagePublicController } from './controllers/home-page-public.controller';
import { HeroSliderAdminController } from './controllers/hero-slider-admin.controller';
import { SideBannerAdminController } from './controllers/side-banner-admin.controller';
import { HomeSectionAdminController } from './controllers/home-section-admin.controller';
import { HomePageAnalyticsController } from './controllers/homepage-analytics.controller';

// Interceptors
import { ClearHomePageCacheInterceptor } from './interceptors/clear-homepage-cache.interceptor';
import { UploadImageAdminController } from './controllers/upload-image-admin.controller';
import { MediaModule } from '../media/media.module';
import { PromoBanner } from './entities/promo-banner.entity';
import { PromoBannerAdminController } from './controllers/poromo-banner.controller';
import { PromoBannerService } from './promo-banner.service';
import { PromoBannerPublicController } from './controllers/promo-banner-public.controller';
import { SettingModule } from '../setting/setting.module'; // ✅ اضافه شد
import { HomePageSettingListener } from './listeners/home-page-setting.listener'; // ✅ اضافه شد

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HeroSlider,
      SideBanner,
      HomeSection,
      HomePageClickAnalytics,
      PromoBanner,
      Product,
      Category,
      Brand,
    ]),
    MediaModule,
    SettingModule, // ✅ اضافه شد
  ],
  controllers: [
    HomePagePublicController,
    HeroSliderAdminController,
    SideBannerAdminController,
    PromoBannerAdminController,
    PromoBannerPublicController,
    HomeSectionAdminController,
    HomePageAnalyticsController,
    UploadImageAdminController
  ],
  providers: [
    HeroSliderService,
    SideBannerService,
    PromoBannerService,
    HomeSectionService,
    HomePageService,
    HomePageAnalyticsService,
    HomePageCacheService, // ✅ اضافه شد
    ClearHomePageCacheInterceptor,
    HomePageSettingListener, // ✅ اضافه شد
  ],
  exports: [
    HeroSliderService,
    SideBannerService,
    PromoBannerService,
    HomeSectionService,
    HomePageService,
    HomePageAnalyticsService,
  ],
})
export class HomePageModule { }
