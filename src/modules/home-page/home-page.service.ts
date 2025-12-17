import { Injectable, Logger } from '@nestjs/common';
import { HeroSliderService } from './hero-slider.service';
import { SideBannerService } from './side-banner.service';
import { HomeSectionService } from './home-section.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../category/entities/category.entity';
import { Brand } from '../brand/entities/brand.entity';
import { Product } from '../product/entities/product.entity';
import { HomePageCacheService } from './cache/home-page-cache.service'; // ✅ اضافه شد

export interface HomePageData {
  heroSliders: any[];
  sideBanners: any[];
  categories: any[];
  brands: any[];
  sections: Array<{
    id: number;
    title: string;
    slug: string;
    description: string;
    sectionType: string;
    displayStyle: string;
    showViewAllButton: boolean;
    viewAllLink: string;
    sortOrder: number;
    products: any[];
  }>;
}

@Injectable()
export class HomePageService {
  private readonly logger = new Logger(HomePageService.name); // ✅ اضافه شد

  constructor(
    private heroSliderService: HeroSliderService,
    private sideBannerService: SideBannerService,
    private homeSectionService: HomeSectionService,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    private readonly cacheService: HomePageCacheService, // ✅ تغییر یافت
  ) { }

  /**
   * گرفتن تمام داده‌های صفحه اصلی به صورت یکجا
   */
  async getHomePageData(): Promise<HomePageData> {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // ✅ چک cache (در development غیرفعال)
    if (!isDevelopment) {
      const cached = await this.cacheService.getHomePageData();
      if (cached) {
        this.logger.log('✅ Home page data از cache');
        return cached;
      }
    }

    // لاجیک اصلی (بدون تغییر)
    const heroSliders = await this.heroSliderService.findAllActive();
    const sideBanners = await this.sideBannerService.findAllActive();

    const categories = await this.categoryRepository.find({
      where: {
        parentId: undefined,
        isActive: true
      },
      order: { displayOrder: 'ASC' },
      take: 8,
    });

    const brands = await this.brandRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    const sections = await this.homeSectionService.findAllActive();

    const sectionsWithProducts = await Promise.all(
      sections.map(async (section) => {
        const products = await this.homeSectionService.getSectionProducts(section.id);
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
          viewAllLink: section.viewAllLink,
          category: category ? await this.formatCategory(category) : null,
          products: await Promise.all(products.map(product => this.formatProduct(product))),
        };
      }),
    );

    const result: HomePageData = {
      heroSliders: heroSliders.map(slider => ({
        id: slider.id,
        title: slider.title,
        description: slider.description,
        imageUrl: slider.imageUrl,
        backgroundColor: slider.backgroundColor,
        isDark: slider.isDark,
        buttonText: slider.buttonText,
        sortOrder: slider.sortOrder,
        buttonLink: slider.buttonLink,
      })),
      sideBanners: sideBanners.map(banner => ({
        id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle,
        imageUrl: banner.imageUrl,
        backgroundColor: banner.backgroundColor,
        link: banner.link,
        position: banner.position,
        sortOrder: banner.sortOrder,
        badgeText: banner.badgeText,
        badgeColor: banner.badgeColor,
      })),
      categories: categories.map(category => ({
        id: category.id,
        name: category.title,
        slug: category.slug,
        image: category.media?.[0]?.url ?? null,
      })),
      brands: brands.map(brand => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
      })),
      sections: sectionsWithProducts,
    };

    // ✅ ذخیره در cache
    await this.cacheService.setHomePageData(result);
    this.logger.log('💾 Home page data ذخیره شد در cache');

    return result;
  }

  /**
   * پاک کردن cache صفحه اصلی
   * این متد باید بعد از هر تغییر در اسلایدرها، بنرها یا بخش‌ها صدا زده شود
   */
  async clearCache(): Promise<void> {
    await this.cacheService.clearHomePageData();
    this.logger.log('🗑️ Home page cache پاک شد');
  }

  /**
   * فرمت کردن اطلاعات محصول برای API
   */
  private async formatProduct(product: Product) {
    let categorySlug: any = null;
    if (product.category) {
      categorySlug = await this.buildCategoryFullSlug(product.category.id);
    }

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      discountAmount: product.discountAmount,
      discountPercent: product.discountPercent,
      stock: product.stock,
      image: product.mediaPinned.url,
      category: product.category ? {
        id: product.category.id,
        name: product.category.title,
        slug: categorySlug,
      } : null,
      brand: product.brand ? {
        id: product.brand.id,
        name: product.brand.name,
        slug: product.brand.slug,
      } : null,
    };
  }

  /**
   * فرمت کردن اطلاعات دسته‌بندی برای API
   */
  private async formatCategory(category: Category) {
    const fullSlug = await this.buildCategoryFullSlug(category.id);

    return {
      id: category.id,
      name: category.title,
      slug: fullSlug,
      image: category.media?.[0]?.url ?? null,
    };
  }

  /**
   * ساخت slug کامل با تمام والدهای دسته‌بندی
   * مثال: mohr-tasbih/mohr-tasbih-sub1/mohr-tasbih-sub1-child1
   */
  private async buildCategoryFullSlug(categoryId: number): Promise<string> {
    const slugParts: string[] = [];
    let currentCategory = await this.categoryRepository.findOne({
      where: { id: categoryId },
      relations: ['parent'],
    });

    while (currentCategory) {
      slugParts.unshift(currentCategory.slug);

      if (currentCategory.parent && currentCategory.parentId && currentCategory.parentId !== 0) {
        currentCategory = await this.categoryRepository.findOne({
          where: { id: currentCategory.parentId },
          relations: ['parent'],
        });
      } else {
        break;
      }
    }
    return slugParts.join('/');
  }
}
