import { Injectable, Inject } from '@nestjs/common';
import { HeroSliderService } from './hero-slider.service';
import { SideBannerService } from './side-banner.service';
import { HomeSectionService } from './home-section.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../category/entities/category.entity';
import { Brand } from '../brand/entities/brand.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Product } from '../product/entities/product.entity';
import { format } from 'path';

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
  private readonly CACHE_KEY = 'homepage:data';
  private readonly CACHE_TTL = 300; // 5 دقیقه

  constructor(
    private heroSliderService: HeroSliderService,
    private sideBannerService: SideBannerService,
    private homeSectionService: HomeSectionService,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) { }

  /**
   * گرفتن تمام داده‌های صفحه اصلی به صورت یکجا
   */
  async getHomePageData(): Promise<HomePageData> {
    const isDevelpment = process.env.NODE_ENV === 'development';
    // چک کردن کش
    if (!isDevelpment) {
      const cachedData = await this.cacheManager.get<HomePageData>(this.CACHE_KEY);
      if (cachedData) {
        return cachedData;
      }
    }

    // گرفتن اسلایدرهای فعال
    const heroSliders = await this.heroSliderService.findAllActive();

    // گرفتن بنرهای کناری فعال
    const sideBanners = await this.sideBannerService.findAllActive();

    // گرفتن دسته‌بندی‌های اصلی برای نمایش
    const categories = await this.categoryRepository.find({
      where: {
        parentId: undefined, // فقط دسته‌بندی‌های اصلی
        isActive: true
      },
      order: { displayOrder: 'ASC' },
      take: 8, // 8 دسته‌بندی اول
    });

    // گرفتن برندهای فعال
    const brands = await this.brandRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    // گرفتن بخش‌های مختلف صفحه
    const sections = await this.homeSectionService.findAllActive();

    // گرفتن محصولات هر بخش
    const sectionsWithProducts = await Promise.all(
      sections.map(async (section) => {
        const products = await this.homeSectionService.getSectionProducts(section.id);
        const category = await this.categoryRepository.findOne({ where: { id: section.categoryId }, relations: ['media'] });

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
        // icon: category.icon,
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
      // icon: category.icon,
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

    // از دسته فعلی شروع کن و به سمت بالا برو
    while (currentCategory) {
      slugParts.unshift(currentCategory.slug); // اضافه کردن به ابتدای آرایه

      // اگر والد داشت، برو سراغ والد
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
