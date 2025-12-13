import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HeroSlider,
      SideBanner,
      HomeSection,
      HomePageClickAnalytics,
      Product,
      Category,
      Brand,
    ]),
    CacheModule.register({
      ttl: 300, // 5 دقیقه (به ثانیه)
      max: 100, // حداکثر تعداد آیتم در کش
    }),
    MediaModule
  ],
  controllers: [
    HomePagePublicController,
    HeroSliderAdminController,
    SideBannerAdminController,
    HomeSectionAdminController,
    HomePageAnalyticsController,
    UploadImageAdminController
  ],
  providers: [
    HeroSliderService,
    SideBannerService,
    HomeSectionService,
    HomePageService,
    HomePageAnalyticsService,
    ClearHomePageCacheInterceptor,
  ],
  exports: [
    HeroSliderService,
    SideBannerService,
    HomeSectionService,
    HomePageService,
    HomePageAnalyticsService,
  ],
})
export class HomePageModule { }
