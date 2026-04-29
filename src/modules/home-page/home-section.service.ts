import { Injectable, NotFoundException, Logger, Inject, BadRequestException } from '@nestjs/common';
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
    // بررسی slug تکراری
    if (createDto.slug) {
      const existingSection = await this.homeSectionRepository.findOne({
        where: { slug: createDto.slug }
      });
      if (existingSection) {
        throw new BadRequestException(`بخش صفحه اصلی با اسلاگ ${createDto.slug} قبلاً وجود دارد`);
      }
    }

    // محاسبه displayOrder بعدی
    const lastSection = await this.homeSectionRepository.find({
      order: { displayOrder: 'DESC' },
      take: 1,
    });
    const nextOrder = lastSection.length ? lastSection[0].displayOrder + 1 : 1;

    const section = this.homeSectionRepository.create({
      ...createDto,
      displayOrder: nextOrder,
    });
    const result = await this.homeSectionRepository.save(section);

    // ✅ پاک کردن cache
    await this.cacheService.clearHomeSectionsCache();
    this.logger.log('🗑️ Home sections cache پاک شد بعد از create');

    return result;
  }

  async findAll(): Promise<HomeSection[]> {
    // ✅ چک cache
    // const cached = await this.cacheService.getAllHomeSections();
    // if (cached) {
    //   this.logger.log('✅ All home sections از cache');
    //   return cached;
    // }

    const result = await this.homeSectionRepository.find({
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });

    // ✅ ذخیره در cache
    // await this.cacheService.setAllHomeSections(result);
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

    const result = await this.homeSectionRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
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

    const section = await this.homeSectionRepository.findOne({ where: { id } });
    if (!section) {
      throw new NotFoundException(`بخش صفحه اصلی با شناسه ${id} یافت نشد`);
    }

    // ✅ ذخیره در cache
    await this.cacheService.setHomeSectionById(id, section);
    this.logger.log(`💾 Home section ${id} ذخیره شد در cache`);

    return section;
  }

  async findBySlug(slug: string): Promise<HomeSection> {
    const section = await this.homeSectionRepository.findOne({ where: { slug } });
    if (!section) {
      throw new NotFoundException(`بخش صفحه اصلی با اسلاگ ${slug} یافت نشد`);
    }
    return section;
  }

  async findProductBySectionSlug(slug: string) {
    let products: Product[] = [];
    const section = await this.homeSectionRepository.findOne({ where: { slug } });
    if (!section) {
      throw new NotFoundException(`بخش صفحه اصلی با اسلاگ ${slug} یافت نشد`);
    }

    if (section.productIds && section.productIds.length > 0) {
      products = await this.productRepository.find({
        where: { id: In(section.productIds), isVisible: true },
        relations: ['category', 'mediaPinned', 'brand']
      });
    }

    return {
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.sku,
        price: Number(product.price),
        discountPercent: Number(product.discountPercent) || 0,
        discountAmount: Number(product.discountAmount) || 0,
        stock: product.stock,
        isFeatured: product.isFeatured,
        image: product.mediaPinned?.url || null,
        category: product.category
          ? {
            id: product.category.id,
            name: product.category.title,
            slug: product.category.slug,
          }
          : null,
        brand: product.brand
          ? {
            id: product.brand.id,
            name: product.brand.name,
            slug: product.brand.slug,
          }
          : null,
      }))
    };
  }

  async update(id: number, updateDto: UpdateHomeSectionDto): Promise<HomeSection> {
    // بررسی slug تکراری
    if (updateDto.slug) {
      const existingSection = await this.homeSectionRepository.findOne({
        where: { slug: updateDto.slug }
      });
      if (existingSection && existingSection.id !== id) {
        throw new BadRequestException(`بخش صفحه اصلی با اسلاگ ${updateDto.slug} قبلاً وجود دارد`);
      }
    }


    const section = await this.findOne(id);
    Object.assign(section, updateDto);
    const result = await this.homeSectionRepository.save(section);

    // ✅ پاک کردن cache با ID
    await this.cacheService.clearHomeSectionsCache(id);
    this.logger.log(`🗑️ Home section ${id} cache پاک شد بعد از update`);

    return result;
  }

  async remove(id: number): Promise<void> {
    const section = await this.findOne(id);
    await this.homeSectionRepository.remove(section);

    // ✅ پاک کردن cache با ID
    await this.cacheService.clearHomeSectionsCache(id);
    this.logger.log(`🗑️ Home section ${id} cache پاک شد بعد از delete`);
  }

  async getSectionProducts(sectionId: number, onlyActive: boolean = false): Promise<Product[]> {
    const section = await this.homeSectionRepository.findOne({
      where: { id: sectionId },
    });

    if (!section) {
      return [];
    }

    let products = await this.getProductsBySection(section);

    if (onlyActive) {
      products = products.filter(p => p.isVisible);
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
            relations: ['medias', 'mediaPinned', 'category', 'brand'],
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
          relations: ['medias', 'mediaPinned', 'category', 'brand'],
          order: { createdAt: 'DESC' },
          take: limit,
        });

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
              isVisible: true,
            },
            relations: ['medias', 'mediaPinned', 'category', 'brand'],
            order: { createdAt: 'DESC' },
            take: limit,
          });
        }
        return [];

      case SectionType.PROMOTION_BASED:
        if (section.promotionId) {
          try {
            const promotion = await this.promotionRepository.findById(section.promotionId);
            if (!promotion || !promotion.isActive) {
              return [];
            }

            // بررسی تاریخ اعتبار
            const now = new Date();
            if (promotion.startsAt && now < promotion.startsAt) {
              return [];
            }
            if (promotion.endsAt && now > promotion.endsAt) {
              return [];
            }

            // استخراج product IDs از شرایط پروموشن
            const productIds: number[] = [];
            if (promotion.conditions) {
              for (const condition of promotion.conditions) {
                if (condition.type === 'product' && condition.products) {
                  for (const prod of condition.products) {
                    if (prod.id) {
                      productIds.push(prod.id);
                    }
                  }
                }
              }
            }

            if (productIds.length === 0) {
              return [];
            }
            section.startDate = promotion.startsAt;
            section.endDate = promotion.endsAt;

            return await this.productRepository.find({
              where: {
                id: In(productIds),
                isVisible: true,
              },
              relations: ['medias', 'mediaPinned', 'category', 'brand'],
              order: { createdAt: 'DESC' },
              take: limit,
            });
          } catch (error) {
            this.logger.error(`خطا در دریافت محصولات پروموشن ${section.promotionId}:`, error);
            return [];
          }
        }
        return [];

      default:
        return [];
    }
  }

  async updateOrder(id: number, data: { displayOrder: number }) {
    const section = await this.homeSectionRepository.findOne({ where: { id } });
    if (!section) throw new NotFoundException('بخش مورد نظر یافت نشد.');

    section.displayOrder = data.displayOrder;
    await this.homeSectionRepository.save(section);

    // ✅ پاک کردن cache
    await this.cacheService.clearHomeSectionsCache();
    this.logger.log('🗑️ Home sections cache پاک شد بعد از تغییر ترتیب');

    return {
      message: 'ترتیب با موفقیت تغییر کرد',
      data: null,
    };
  }
}
