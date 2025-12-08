import { Injectable, Inject } from '@nestjs/common';
import { HeroSliderService } from './hero-slider.service';
import { SideBannerService } from './side-banner.service';
import { HomeSectionService } from './home-section.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../category/entities/category.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface HomePageData {
  heroSliders: any[];
  sideBanners: any[];
  categories: any[];
  sections: Array<{
    id: number;
    title: string;
    slug: string;
    description: string;
    section_type: string;
    display_style: string;
    show_view_all_button: boolean;
    view_all_link: string;
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
          section_type: section.section_type,
          display_style: section.display_style,
          show_view_all_button: section.show_view_all_button,
          view_all_link: section.view_all_link,
          products: products.map(product => this.formatProduct(product)),
        };
      }),
    );

    const result: HomePageData = {
      heroSliders: heroSliders.map(slider => ({
        id: slider.id,
        title: slider.title,
        description: slider.description,
        imageUrl: slider.image_url,
        backgroundColor: slider.background_color,
        buttonText: slider.button_text,
        buttonLink: slider.button_link,
      })),
      sideBanners: sideBanners.map(banner => ({
        id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle,
        imageUrl: banner.image_url,
        link: banner.link,
        position: banner.position,
        badgeText: banner.badge_text,
        badgeColor: banner.badge_color,
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
  private formatProduct(product: any) {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      discount_price: product.discount_price,
      discount_percentage: product.discount_percentage,
      stock: product.stock,
      is_available: product.is_available,
      image: product.medias && product.medias.length > 0
        ? product.medias[0].path
        : null,
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
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
