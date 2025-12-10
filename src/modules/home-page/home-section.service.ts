import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HomeSection, SectionType } from './entities/home-section.entity';
import { CreateHomeSectionDto, UpdateHomeSectionDto } from './dto/home-section.dto';
import { Product } from '../product/entities/product.entity';

@Injectable()
export class HomeSectionService {
  constructor(
    @InjectRepository(HomeSection)
    private homeSectionRepository: Repository<HomeSection>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) { }

  async create(createDto: CreateHomeSectionDto): Promise<HomeSection> {
    const section = this.homeSectionRepository.create(createDto);
    return await this.homeSectionRepository.save(section);
  }

  async findAll(): Promise<HomeSection[]> {
    return await this.homeSectionRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findAllActive(): Promise<HomeSection[]> {
    return await this.homeSectionRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async findOne(id: number): Promise<HomeSection> {
    const section = await this.homeSectionRepository.findOne({ where: { id } });
    if (!section) {
      throw new NotFoundException(`Home section with ID ${id} not found`);
    }
    return section;
  }

  async findBySlug(slug: string): Promise<HomeSection> {
    const section = await this.homeSectionRepository.findOne({ where: { slug } });
    if (!section) {
      throw new NotFoundException(`Home section with slug ${slug} not found`);
    }
    return section;
  }

  async update(id: number, updateDto: UpdateHomeSectionDto): Promise<HomeSection> {
    const section = await this.findOne(id);
    Object.assign(section, updateDto);
    return await this.homeSectionRepository.save(section);
  }

  async remove(id: number): Promise<void> {
    const section = await this.findOne(id);
    await this.homeSectionRepository.remove(section);
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
              isVisible: true
            },
            relations: ['medias', 'category', 'brand'],
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
