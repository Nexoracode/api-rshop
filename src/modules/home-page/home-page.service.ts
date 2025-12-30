// src/homepage/homepage.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../category/entities/category.entity';
import { Brand } from '../brand/entities/brand.entity';
import { HomePageCacheService } from './cache';
import { HeroSliderService } from './hero-slider.service';
import { SideBannerService } from './side-banner.service';
import { PromoBannerService } from './promo-banner.service';
import { HomeSectionService } from './home-section.service';
import { HomePageData, HomePageLayoutType } from './interceptors/home-page.interface';
import { SettingService } from '../setting/setting.service'; // ✅ اضافه شد
import { SettingCategory } from '../setting/enums/setting-category.enum';
import { PromoBanner } from './entities/promo-banner.entity';
import { HeroSlider } from './entities/hero-slider.entity';
import { SideBanner } from './entities/side-banner.entity';
import { Product } from '../product/entities/product.entity';

@Injectable()
export class HomePageService {
  private readonly logger = new Logger(HomePageService.name);

  constructor(
    private readonly cacheService: HomePageCacheService,
    private readonly heroSliderService: HeroSliderService,
    private readonly sideBannerService: SideBannerService,
    private readonly promoBannerService: PromoBannerService,
    private readonly homeSectionService: HomeSectionService,
    private readonly settingService: SettingService, // ✅ اضافه شد
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
  ) { }

  /**
   * دریافت داده کامل صفحه اصلی
   */
  async getHomePageData(forAdmin: boolean = false) {
    // ✅ چک cache با پارامتر forAdmin
    const cached = await this.cacheService.getHomePageData(forAdmin);
    if (cached) {
      this.logger.log(`✅ Home page data از cache (${forAdmin ? 'admin' : 'public'})`);
      return cached;
    }

    this.logger.log(`🔄 بارگذاری home page data از DB (${forAdmin ? 'admin' : 'public'})`);

    // ✅ دریافت داده‌ها بر اساس forAdmin
    const [heroSliders, sideBanners, promoBanners, sections, categories, brands] = await Promise.all([
      forAdmin
        ? this.heroSliderService.findAll()
        : this.heroSliderService.findAllActive(),

      forAdmin
        ? this.sideBannerService.findAll()
        : this.sideBannerService.findAllActive(),

      forAdmin
        ? this.promoBannerService.findAll()
        : this.promoBannerService.findAllActive(),

      forAdmin
        ? this.homeSectionService.findAll()
        : this.homeSectionService.findAllActive(),

      this.getCategoriesForHomePage(forAdmin),
      this.getBrandsForHomePage(forAdmin),
    ]);

    const sectionsWithProducts = await Promise.all(
      sections.map(async (section) => {
        const products = await this.homeSectionService.getSectionProducts(
          section.id,
          !forAdmin // فقط محصولات فعال برای public
        );

        const category = await this.categoryRepository.findOne({
          where: { id: section.categoryId },
          relations: ['media']
        });

        return {
          id: section.id,
          title: section.title,
          slug: section.slug,
          description: section.description,
          sectionType: section.sectionType,
          displayStyle: section.displayStyle,
          showViewAllButton: section.showViewAllButton,
          sortOrder: section.sortOrder,
          isActive: section.isActive,
          viewAllLink: section.viewAllLink,
          productsLimit: section.productsLimit,
          category: category ? await this.formatCategory(category) : null,
          products: await Promise.all(products.map(product => this.formatProduct(product))),
        };
      }),
    );

    // ✅ دریافت layout type از settings
    const layoutType = await this.getLayoutType();

    const result: HomePageData = {
      layoutType, // ✅ اضافه شد
      promoBanners: promoBanners.map((promo: PromoBanner) => ({
        id: promo.id,
        title: promo.title,
        backgroundColor: promo.backgroundColor,
        textColor: promo.textColor,
        link: promo.link,
        linkText: promo.linkText,
        imageUrl: promo.imageUrl,
        isActive: promo.isActive,
        isClosable: promo.isClosable,
        priority: promo.priority,
        startDate: promo.startDate,
        endDate: promo.endDate,
        displayDuration: promo.displayDuration,
        description: promo.description,
      })),
      heroSliders: heroSliders.map((slider: HeroSlider) => ({
        id: slider.id,
        title: slider.title,
        description: slider.description,
        imageUrl: slider.imageUrl,
        backgroundColor: slider.backgroundColor ?? '',
        isDark: slider.isDark,
        isActive: slider.isActive,
        buttonText: slider.buttonText,
        sortOrder: slider.sortOrder,
        buttonLink: slider.buttonLink,
      })),
      sideBanners: sideBanners.map((banner: SideBanner) => ({
        id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle,
        imageUrl: banner.imageUrl,
        backgroundColor: banner.backgroundColor,
        link: banner.link,
        isActive: banner.isActive,
        position: banner.position,
        sortOrder: banner.sortOrder,
        badgeText: banner.badgeText,
        badgeColor: banner.badgeColor,
      })),
      categories: categories.map((category: Category) => ({
        id: category.id,
        name: category.title,
        slug: category.slug,
        image: category.media?.url ?? null,
      })),
      brands: brands.map(brand => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
      })),
      sections: sectionsWithProducts,
    };

    // ✅ ذخیره در cache با پارامتر forAdmin
    await this.cacheService.setHomePageData(result, forAdmin);
    this.logger.log(`💾 Home page data ذخیره شد در cache (${forAdmin ? 'admin' : 'public'})`);

    return result;
  }

  /**
   * دریافت دسته‌بندی‌های صفحه اصلی
   */
  private async getCategoriesForHomePage(forAdmin: boolean) {
    const whereCondition = forAdmin
      ? { parentId: undefined }
      : { parentId: undefined, isActive: true };

    return await this.categoryRepository.find({
      where: whereCondition,
      relations: ['media'],
      order: { displayOrder: 'ASC' },
      take: 18,
    });
  }

  /**
   * دریافت برندهای صفحه اصلی
   */
  private async getBrandsForHomePage(forAdmin: boolean) {
    const whereCondition = forAdmin
      ? {}
      : { isActive: true };

    return await this.brandRepository.find({
      where: whereCondition,
      order: { name: 'ASC' },
    });
  }

  /**
   * فرمت کردن category
   */
  private async formatCategory(category: Category) {
    return {
      id: category.id,
      name: category.title,
      slug: category.slug,
      image: category.media?.url ?? null,
    };
  }

  /**
   * فرمت کردن product
   */
  private async formatProduct(product: Product) {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      discountAmount: product.discountAmount,
      discountPercent: product.discountPercent,
      image: product.mediaPinned?.url ?? null,
      isActive: product.isActive,
      // سایر فیلدهای مورد نیاز
    };
  }

  /**
   * دریافت نوع چیدمان از settings
   */
  private async getLayoutType(): Promise<HomePageLayoutType> {
    try {
      const setting = await this.settingService.findByKey(SettingCategory.HOMEPAGE); // ✅ تصحیح شد
      if (setting && setting.value) {
        // اگر مقدار valid باشه، برگردون
        if (Object.values(HomePageLayoutType).includes(setting.value as HomePageLayoutType)) {
          return setting.value as HomePageLayoutType;
        }
      }
      // پیش‌فرض: کنار هم
      return HomePageLayoutType.SIDE_BY_SIDE;
    } catch (error) {
      this.logger.warn('خطا در دریافت layout type، استفاده از پیش‌فرض:', error.message);
      return HomePageLayoutType.SIDE_BY_SIDE;
    }
  }
}