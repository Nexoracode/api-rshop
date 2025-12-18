import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HomeSection, SectionType } from './entities/home-section.entity';
import { CreateHomeSectionDto, UpdateHomeSectionDto } from './dto/home-section.dto';
import { Product } from '../product/entities/product.entity';
import { HomePageCacheService } from './cache/home-page-cache.service'; // ✅ اضافه شد

@Injectable()
export class HomeSectionService {
  private readonly logger = new Logger(HomeSectionService.name); // ✅ اضافه شد

  constructor(
    @InjectRepository(HomeSection)
    private homeSectionRepository: Repository<HomeSection>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private readonly cacheService: HomePageCacheService, // ✅ اضافه شد
  ) { }

  async create(createDto: CreateHomeSectionDto): Promise<HomeSection> {
    // لاجیک اصلی (بدون تغییر)
    const section = this.homeSectionRepository.create(createDto);
    const result = await this.homeSectionRepository.save(section);

    // ✅ پاک کردن cache
    await this.cacheService.clearHomeSectionsCache();
    this.logger.log('🗑️ Home sections cache پاک شد بعد از create');

    return result;
  }

  async findAll(): Promise<HomeSection[]> {
    // ✅ چک cache
    const cached = await this.cacheService.getAllHomeSections();
    if (cached) {
      this.logger.log('✅ All home sections از cache');
      return cached;
    }

    // لاجیک اصلی (بدون تغییر)
    const result = await this.homeSectionRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });

    // ✅ ذخیره در cache
    await this.cacheService.setAllHomeSections(result);
    this.logger.log('💾 All home sections ذخیره شد در cache');

    return result;
  }

  async findAllActive(): Promise<HomeSection[]> {
    // ✅ چک cache
    const cached = await this.cacheService.getActiveHomeSections();
    if (cached) {
      this.logger.log('✅ Active home sections از cache');
      return cached;
    }

    // لاجیک اصلی (بدون تغییر)
    const result = await this.homeSectionRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });

    // ✅ ذخیره در cache
    await this.cacheService.setActiveHomeSections(result);
    this.logger.log('💾 Active home sections ذخیره شد در cache');

    return result;
  }

  async findOne(id: number): Promise<HomeSection> {
    // ✅ چک cache
    const cached = await this.cacheService.getHomeSectionById(id);
    if (cached) {
      this.logger.log(`✅ Home section ${id} از cache`);
      return cached;
    }

    // لاجیک اصلی (بدون تغییر)
    const section = await this.homeSectionRepository.findOne({ where: { id } });
    if (!section) {
      throw new NotFoundException(`Home section with ID ${id} not found`);
    }

    // ✅ ذخیره در cache
    await this.cacheService.setHomeSectionById(id, section);
    this.logger.log(`💾 Home section ${id} ذخیره شد در cache`);

    return section;
  }

  async findBySlug(slug: string): Promise<HomeSection> {
    // لاجیک اصلی (بدون تغییر - slug cache نداریم)
    const section = await this.homeSectionRepository.findOne({ where: { slug } });
    if (!section) {
      throw new NotFoundException(`Home section with slug ${slug} not found`);
    }
    return section;
  }

  async update(id: number, updateDto: UpdateHomeSectionDto): Promise<HomeSection> {
    // لاجیک اصلی (بدون تغییر)
    const section = await this.findOne(id);
    Object.assign(section, updateDto);
    const result = await this.homeSectionRepository.save(section);

    // ✅ پاک کردن cache
    await this.cacheService.clearHomeSectionsCache(id);
    this.logger.log(`🗑️ Home section ${id} cache پاک شد بعد از update`);

    return result;
  }

  async remove(id: number): Promise<void> {
    // لاجیک اصلی (بدون تغییر)
    const section = await this.findOne(id);
    await this.homeSectionRepository.remove(section);

    // ✅ پاک کردن cache
    await this.cacheService.clearHomeSectionsCache(id);
    this.logger.log(`🗑️ Home section ${id} cache پاک شد بعد از delete`);
  }

  /**
   * گرفتن محصولات برای یک بخش بر اساس تنظیمات آن
   */
  async getSectionProducts(sectionId: number): Promise<Product[]> {
    const section = await this.findOne(sectionId);
    return await this.getProductsBySection(section);
  }

  /**
   * گرفتن محصولات بر اساس نوع بخش
   */
  private async getProductsBySection(section: HomeSection): Promise<Product[]> {
    const limit = section.productsLimit || 10;

    switch (section.sectionType) {
      case SectionType.SPECIAL_PRODUCTS:
        // محصولات دستی که ادمین انتخاب کرده
        if (section.productIds && section.productIds.length > 0) {
          return await this.productRepository.find({
            where: {
              id: In(section.productIds),
              isVisible: true
            },
            relations: ['medias', 'category', 'brand'],
            take: limit,
          });
        }
        return [];

      case SectionType.FEATURED:
        // محصولات ویژه
        return await this.productRepository.find({
          where: {
            isVisible: true,
            isFeatured: true
          },
          relations: ['medias', 'category', 'brand'],
          order: { createdAt: 'DESC' },
          take: limit,
        });

      case SectionType.MOST_POPULAR:
        // محبوب‌ترین محصولات بر اساس فروش
        return await this.productRepository
          .createQueryBuilder('product')
          .leftJoinAndSelect('product.medias', 'medias')
          .leftJoinAndSelect('product.category', 'category')
          .leftJoinAndSelect('product.brand', 'brand')
          .where('product.is_visible = :visible', { visible: true })
          .orderBy('product.sold_count', 'DESC')
          .take(limit)
          .getMany();

      case SectionType.CATEGORY_BASED:
        // محصولات بر اساس دسته‌بندی
        if (section.categoryId) {
          return await this.productRepository.find({
            where: {
              categoryId: section.categoryId,
            },
            relations: ['medias', 'category', 'brand', 'mediaPinned'],
            order: { createdAt: 'DESC' },
            take: limit,
          });
        }
        return [];

      default:
        return [];
    }
  }
}
