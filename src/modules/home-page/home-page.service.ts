// src/homepage/homepage.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
import { Order } from '../order/entities/order.entity';
import { runInTransaction } from 'src/common/helpers/transaction.helper';
import { PromotionOrmEntity } from '../promotion/infrastructure/entities/promotion.orm-entity';

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
    @InjectRepository(PromotionOrmEntity)
    private readonly promotionRepository: Repository<PromotionOrmEntity>,
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * دریافت داده کامل صفحه اصلی
   */
  async getHomePageData(forAdmin: boolean = false) {
    console.log('click section')
    // ✅ اول layoutType رو بگیر (جدا از cache اصلی)
    const layoutType = await this.getLayoutType();

    // ✅ چک cache با پارامتر forAdmin
    const cached = await this.cacheService.getHomePageData(forAdmin);
    if (cached && !forAdmin) {
      this.logger.log(`✅ Home page data از cache (${forAdmin ? 'admin' : 'public'})`);

      // ✅ layoutType تازه رو اضافه کن (همیشه fresh!)
      // return {
      //   ...cached,
      //   layoutType,
      // };
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
          relations: ['media', 'products']
        });

        const promotion = await this.promotionRepository.findOne({
          where: { id: section.promotionId }
        })

        return {
          id: section.id,
          title: section.title,
          image: section.image,
          slug: section.slug,
          description: section.description,
          sectionType: section.sectionType,
          displayStyle: section.displayStyle,
          showViewAllButton: section.showViewAllButton,
          displayOrder: section.displayOrder,
          isActive: section.isActive,
          viewAllLink: section.viewAllLink,
          productsLimit: section.productsLimit,
          productIds: promotion ? products.map((product) => product.id) : section.productIds,
          promotionId: section.promotionId,
          startDate: promotion ? promotion.startsAt : section.startDate,
          endDate: promotion ? promotion.endsAt : section.endDate,
          category: category ? await this.formatCategory(category) : null,
          products: await Promise.all(products.map(product => this.formatProduct(product))),
        };
      }),
    );

    const result: HomePageData = {
      layoutType: layoutType, // ✅ اضافه میشه به response ولی توی cache ذخیره نمیشه
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
        displayOrder: promo.displayOrder,
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
        displayOrder: slider.displayOrder,
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
        displayOrder: banner.displayOrder,
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

    // ✅ ذخیره در cache (بدون layoutType)
    await this.cacheService.setHomePageData(result, forAdmin);
    this.logger.log(`💾 Home page data ذخیره شد در cache (${forAdmin ? 'admin' : 'public'})`);

    // ✅ برگردوندن با layoutType
    return {
      ...result,
      layoutType, // ✅ اضافه میشه به response ولی توی cache ذخیره نمیشه
    };
  }

  /**
   * دریافت دسته‌بندی‌های صفحه اصلی
   */
  private async getCategoriesForHomePage(forAdmin: boolean) {
    const whereCondition = forAdmin
      ? { parentId: undefined }
      : { parentId: undefined, isActive: true, products: undefined };

    const categories = await this.categoryRepository.find({
      where: whereCondition,
      relations: ['media'],
      order: { displayOrder: 'ASC' },
      take: 10,
    });
    const resultCategories = categories.filter((value) => value.products?.length !== 0)
    return resultCategories;
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
      price: product.variants.length != 0 ? product.variants[0].price : product.price,
      category: null,
      stock: product.stock,
      discountAmount: product.discountAmount,
      discountPercent: product.discountPercent,
      image: product.mediaPinned?.url ?? null,
      isActive: product.isActive,
      isVisible: product.isVisible,
      // سایر فیلدهای مورد نیاز
    };
  }

  /**
   * دریافت نوع چیدمان از settings (با cache)
   */
  private async getLayoutType(): Promise<HomePageLayoutType> {
    try {
      // ✅ اول از cache بخون
      const cachedType = await this.cacheService.getLayoutType();
      if (cachedType) {
        this.logger.debug(`💾 Layout type از cache: ${cachedType}`);
        return cachedType as HomePageLayoutType;
      }

      // ✅ اگه تو cache نبود، از DB بگیر
      const setting = await this.settingService.findByKey('homepage_layout_type');

      let layoutType = HomePageLayoutType.SIDE_BY_SIDE; // پیش‌فرض

      if (setting && setting.value) {
        if (Object.values(HomePageLayoutType).includes(setting.value as HomePageLayoutType)) {
          layoutType = setting.value as HomePageLayoutType;
        }
      }

      // ✅ ذخیره تو cache برای دفعات بعد
      await this.cacheService.setLayoutType(layoutType);

      return layoutType;
    } catch (error: any) {
      this.logger.warn('خطا در دریافت layout type، استفاده از پیش‌فرض:', error.message);
      return HomePageLayoutType.SIDE_BY_SIDE;
    }
  }

  async getDataForDashobard() {
    return runInTransaction(this.dataSource, async (manager) => {

    });
  }
}