import { Injectable, Inject } from '@nestjs/common';
import { HeroSliderService } from './hero-slider.service';
import { SideBannerService } from './side-banner.service';
import { HomeSectionService } from './home-section.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../category/entities/category.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Product } from '../product/entities/product.entity';

export interface HomePageData {
  heroSliders: any[];
  sideBanners: any[];
  categories: any[];
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
  private readonly CACHE_KEY = 'homepage:data';
  private readonly CACHE_TTL = 300; // 5 دقیقه

  constructor(
    private heroSliderService: HeroSliderService,
    private sideBannerService: SideBannerService,
    private homeSectionService: HomeSectionService,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) { }

  /**
   * گرفتن تمام داده‌های صفحه اصلی به صورت یکجا
   */
  async getHomePageData(): Promise<HomePageData> {
    // چک کردن کش
    const cachedData = await this.cacheManager.get<HomePageData>(this.CACHE_KEY);
    if (cachedData) {
      return cachedData;
    }

    // گرفتن اسلایدرهای فعال
    const heroSliders = await this.heroSliderService.findAllActive();

    // گرفتن بنرهای کناری فعال
    const sideBanners = await this.sideBannerService.findAllActive();

    // گرفتن دسته‌بندی‌های اصلی برای نمایش
    const categories = await this.categoryRepository.find({
      where: {
        parentId: 0, // فقط دسته‌بندی‌های اصلی
        isActive: true
      },
      order: { displayOrder: 'ASC' },
      take: 8, // 8 دسته‌بندی اول
    });

    // گرفتن بخش‌های مختلف صفحه
    const sections = await this.homeSectionService.findAllActive();

    // گرفتن محصولات هر بخش
    const sectionsWithProducts = await Promise.all(
      sections.map(async (section) => {
        const products = await this.homeSectionService.getSectionProducts(section.id);
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
          products: products.map(product => this.formatProduct(product)),
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
        // icon: category.icon,
        image: category.media,
      })),
      sections: sectionsWithProducts,
    };

    // ذخیره در کش
    await this.cacheManager.set(this.CACHE_KEY, result, this.CACHE_TTL * 1000);

    return result;
  }

  /**
   * پاک کردن کش صفحه اصلی
   * این متد باید بعد از هر تغییر در اسلایدرها، بنرها یا بخش‌ها صدا زده شود
   */
  async clearCache(): Promise<void> {
    await this.cacheManager.del(this.CACHE_KEY);
  }

  /**
   * فرمت کردن اطلاعات محصول برای API
   */
  private formatProduct(product: Product) {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      discountAmount: product.discountAmount,
      discountPercent: product.discountPercent,
      stock: product.stock,
      image: product.medias && product.medias.length > 0
        ? product.medias[0].url
        : null,
      category: product.category ? {
        id: product.category.id,
        name: product.category.title,
        slug: product.category.slug,
      } : null,
      brand: product.brand ? {
        id: product.brand.id,
        name: product.brand.name,
        slug: product.brand.slug,
      } : null,
    };
  }
}
