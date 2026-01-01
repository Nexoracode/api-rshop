import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HomeSection, SectionType } from './entities/home-section.entity';
import { CreateHomeSectionDto, UpdateHomeSectionDto } from './dto/home-section.dto';
import { Product } from '../product/entities/product.entity';
import { HomePageCacheService } from './cache/home-page-cache.service';
import { PromotionRepository } from '../promotion/domain/interfaces/promotion-repository.interface';

@Injectable()
export class HomeSectionService {
  private readonly logger = new Logger(HomeSectionService.name);

  constructor(
    @InjectRepository(HomeSection)
    private homeSectionRepository: Repository<HomeSection>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private readonly cacheService: HomePageCacheService,
    @Inject(PromotionRepository)
    private readonly promotionRepository: PromotionRepository,
  ) { }

  async create(createDto: CreateHomeSectionDto): Promise<HomeSection> {
    if (createDto.slug) {
      const existingSection = await this.homeSectionRepository.findOne({
        where: { slug: createDto.slug }
      });
      if (existingSection) {
        throw new NotFoundException(`بخش صفحه اصلی با اسلاگ ${createDto.slug} قبلاً وجود دارد`);
      }
    }

    const section = this.homeSectionRepository.create(createDto);
    const result = await this.homeSectionRepository.save(section);

    await this.cacheService.clearHomeSectionsCache();
    this.logger.log('کش بخش‌ های صفحه اصلی پاک شد پس از ایجاد');

    return result;
  }

  async findAll(): Promise<HomeSection[]> {
    const cached = await this.cacheService.getAllHomeSections();
    if (cached) {
      this.logger.log('تمام بخش‌ های صفحه اصلی از کش بازیابی شد');
      return cached;
    }

    const result = await this.homeSectionRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });

    await this.cacheService.setAllHomeSections(result);
    this.logger.log('تمام بخش‌ های صفحه اصلی در کش ذخیره شد');

    return result;
  }

  async findAllActive(): Promise<HomeSection[]> {
    const cached = await this.cacheService.getActiveHomeSections();
    if (cached) {
      this.logger.log('بخش‌های فعال صفحه اصلی از کش بازیابی شد');
      return cached;
    }

    const result = await this.homeSectionRepository.find({
      where: { isActive: true, },
      order: { sortOrder: 'ASC' },
    });

    await this.cacheService.setActiveHomeSections(result);
    this.logger.log('بخش‌های فعال صفحه اصلی در کش ذخیره شد');

    return result;
  }

  async findOne(id: number): Promise<HomeSection> {
    const cached = await this.cacheService.getHomeSectionById(id);
    if (cached) {
      this.logger.log(`بخش صفحه اصلی ${id} از کش بازیابی شد`);
      return cached;
    }

    const section = await this.homeSectionRepository.findOne({ where: { id } });
    if (!section) {
      throw new NotFoundException(`بخش صفحه اصلی با شناسه ${id} یافت نشد`);
    }

    await this.cacheService.setHomeSectionById(id, section);
    this.logger.log(`بخش صفحه اصلی ${id} در کش ذخیره شد`);

    return section;
  }

  async findBySlug(slug: string): Promise<HomeSection> {
    const section = await this.homeSectionRepository.findOne({ where: { slug } });
    if (!section) {
      throw new NotFoundException(`بخش صفحه اصلی با اسلاگ ${slug} یافت نشد`);
    }
    return section;
  }

  async update(id: number, updateDto: UpdateHomeSectionDto): Promise<HomeSection> {
    if (updateDto.slug) {
      const existingSection = await this.homeSectionRepository.findOne({
        where: { slug: updateDto.slug }
      });
      if (existingSection && existingSection.id !== id) {
        throw new NotFoundException(`بخش صفحه اصلی با اسلاگ ${updateDto.slug} قبلاً وجود دارد`);
      }
    }

    await this.findOne(id);
    await this.homeSectionRepository.update(id, updateDto);
    const result = await this.homeSectionRepository.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException(`بخش صفحه اصلی با شناسه ${id} یافت نشد`);
    }
    await this.cacheService.clearHomeSectionsCache(id);
    this.logger.log(`کش بخش صفحه اصلی ${id} پاک شد پس از حذف`);
    return result;
  }

  async remove(id: number): Promise<void> {
    const section = await this.findOne(id);
    await this.homeSectionRepository.remove(section);

    await this.cacheService.clearHomeSectionsCache(id);
    this.logger.log(`کش بخش صفحه اصلی ${id} پاک شد پس از حذف`);
  }

  async getSectionProducts(sectionId: number, onlyActive: boolean = false) {
    const section = await this.homeSectionRepository.findOne({
      where: { id: sectionId },
    });

    if (!section) {
      return [];
    }

    let products = await this.getProductsBySection(section);

    if (onlyActive) {
      products = products.filter(p => p.isActive);
    }

    return products;
  }

  private async getProductsBySection(section: HomeSection): Promise<Product[]> {
    const limit = section.productsLimit || 10;

    switch (section.sectionType) {
      case SectionType.SPECIAL_PRODUCTS:
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
        return await this.productRepository.find({
          where: {
            isVisible: true,
            isFeatured: true
          },
          relations: ['medias', 'category', 'brand'],
          order: { createdAt: 'DESC' },
          take: limit,
        });

      case SectionType.PROMOTION_BASED:
        if (section.promotionId) {
          try {
            const promotionProductIds = await this.promotionRepository.getPromotionProducts(section.promotionId);

            if (promotionProductIds.length === 0) {
              this.logger.warn(`No products found for promotion ${section.promotionId}`);
              return [];
            }

            return await this.productRepository.find({
              where: {
                id: In(promotionProductIds),
                isVisible: true
              },
              relations: ['medias', 'category', 'brand', 'mediaPinned'],
              order: { createdAt: 'DESC' },
              take: limit,
            });
          } catch (error) {
            this.logger.error(`Error fetching promotion products: ${error.message}`);
            return [];
          }
        }
        return [];

      case SectionType.MOST_POPULAR:
        return await this.productRepository
          .createQueryBuilder('product')
          .leftJoinAndSelect('product.medias', 'medias')
          .leftJoinAndSelect('product.mediaPinned', 'mediaPinned')
          .leftJoinAndSelect('product.category', 'category')
          .leftJoinAndSelect('product.brand', 'brand')
          .where('product.is_visible = :visible', { visible: true })
          .orderBy('product.id', 'DESC')
          .take(limit)
          .getMany();

      case SectionType.CATEGORY_BASED:
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
