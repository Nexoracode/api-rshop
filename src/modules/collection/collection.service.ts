// src/collection/collection.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Collection } from './entities/collection.entity';
import { Product } from '../product/entities/product.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { AddProductsToCollectionDto } from './dto/add-product-to-collection.dto';
import { CollectionCacheService } from './cache/collection-cache.service';

@Injectable()
export class CollectionService {
  private readonly logger = new Logger(CollectionService.name);

  constructor(
    @InjectRepository(Collection)
    private readonly collectionRepo: Repository<Collection>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly cacheService: CollectionCacheService,
  ) { }

  /**
   * ساخت مجموعه جدید
   */
  async create(dto: CreateCollectionDto): Promise<Collection> {
    // بررسی یکتا بودن slug
    const existingSlug = await this.collectionRepo.findOne({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new ConflictException('این slug قبلاً استفاده شده است');
    }

    // بررسی یکتا بودن title
    const existingTitle = await this.collectionRepo.findOne({
      where: { title: dto.title },
    });

    if (existingTitle) {
      throw new ConflictException('این عنوان قبلاً استفاده شده است');
    }

    // گرفتن محصولات اگر وجود داشته باشند
    let products: Product[] = [];
    if (dto.productIds && dto.productIds.length > 0) {
      products = await this.productRepo.find({
        where: { id: In(dto.productIds) },
      });

      if (products.length !== dto.productIds.length) {
        throw new BadRequestException('برخی از محصولات انتخابی یافت نشدند');
      }
    }

    // ساخت مجموعه
    const collection = this.collectionRepo.create({
      title: dto.title,
      slug: dto.slug,
      description: dto.description || null,
      image: dto.image || null,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      products,
    });

    const saved = await this.collectionRepo.save(collection);

    // ✅ پاک کردن cache لیست‌ها
    await this.cacheService.clearAllLists();

    this.logger.log(`✅ Collection جدید "${dto.title}" ایجاد شد`);

    return saved;
  }

  /**
   * لیست تمام مجموعه‌ها (Public)
   */
  async findAll(): Promise<Collection[]> {
    // ✅ چک کردن cache
    const cached = await this.cacheService.getAllActive();
    if (cached) {
      this.logger.log('✅ لیست فعال از cache برگشت');
      return cached;
    }

    const now = new Date();

    const collections = await this.collectionRepo.find({
      where: [
        {
          isActive: true,
          startDate: LessThanOrEqual(now),
          endDate: MoreThanOrEqual(now),
        },
      ],
      relations: ['products'],
      order: {
        sortOrder: 'ASC',
        createdAt: 'DESC',
      },
    });

    // ✅ ذخیره در cache
    await this.cacheService.setAllActive(collections);

    return collections;
  }

  /**
   * لیست تمام مجموعه‌ها (Admin) - بدون فیلتر
   */
  async findAllAdmin(): Promise<Collection[]> {
    // ✅ چک کردن cache
    const cached = await this.cacheService.getAllAdmin();
    if (cached) {
      this.logger.log('✅ لیست ادمین از cache برگشت');
      return cached;
    }

    const collections = await this.collectionRepo.find({
      relations: ['products'],
      order: {
        sortOrder: 'ASC',
        createdAt: 'DESC',
      },
    });

    // ✅ ذخیره در cache
    await this.cacheService.setAllAdmin(collections);

    return collections;
  }

  /**
   * جزئیات یک مجموعه با slug (Public)
   */
  async findOneBySlug(slug: string): Promise<Collection> {
    // ✅ چک کردن cache
    const cached = await this.cacheService.getDetailBySlug(slug);
    if (cached) {
      this.logger.log(`✅ جزئیات ${slug} از cache برگشت`);
      return cached;
    }

    const now = new Date();

    const collection = await this.collectionRepo.findOne({
      where: {
        slug,
        isActive: true,
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      relations: ['products', 'products.mediaPinned'],
    });

    if (!collection) {
      throw new NotFoundException('مجموعه یافت نشد');
    }

    // ✅ ذخیره در cache
    await this.cacheService.setDetailBySlug(slug, collection);

    return collection;
  }

  /**
   * جزئیات یک مجموعه با ID (Admin)
   */
  async findOne(id: number): Promise<Collection> {
    // ✅ چک کردن cache
    const cached = await this.cacheService.getDetailById(id);
    if (cached) {
      this.logger.log(`✅ جزئیات ID ${id} از cache برگشت`);
      return cached;
    }

    const collection = await this.collectionRepo.findOne({
      where: { id },
      relations: ['products', 'products.mediaPinned'],
    });

    if (!collection) {
      throw new NotFoundException('مجموعه یافت نشد');
    }

    // ✅ ذخیره در cache
    await this.cacheService.setDetailById(id, collection);

    return collection;
  }

  /**
   * بروزرسانی مجموعه
   */
  async update(id: number, dto: UpdateCollectionDto): Promise<Collection> {
    const collection = await this.findOne(id);

    // بررسی یکتا بودن slug
    if (dto.slug && dto.slug !== collection.slug) {
      const existingSlug = await this.collectionRepo.findOne({
        where: { slug: dto.slug },
      });

      if (existingSlug) {
        throw new ConflictException('این slug قبلاً استفاده شده است');
      }
    }

    // بررسی یکتا بودن title
    if (dto.title && dto.title !== collection.title) {
      const existingTitle = await this.collectionRepo.findOne({
        where: { title: dto.title },
      });

      if (existingTitle) {
        throw new ConflictException('این عنوان قبلاً استفاده شده است');
      }
    }

    // اگر productIds ارسال شده، محصولات رو جایگزین کن
    if (dto.productIds) {
      const products = await this.productRepo.find({
        where: { id: In(dto.productIds) },
      });

      if (products.length !== dto.productIds.length) {
        throw new BadRequestException('برخی از محصولات انتخابی یافت نشدند');
      }

      collection.products = products;
    }

    // بروزرسانی فیلدها
    Object.assign(collection, {
      title: dto.title ?? collection.title,
      slug: dto.slug ?? collection.slug,
      description: dto.description ?? collection.description,
      image: dto.image ?? collection.image,
      isActive: dto.isActive ?? collection.isActive,
      sortOrder: dto.sortOrder ?? collection.sortOrder,
      startDate: dto.startDate ? new Date(dto.startDate) : collection.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : collection.endDate,
    });

    const saved = await this.collectionRepo.save(collection);

    // ✅ پاک کردن cache
    await this.cacheService.clearCollectionCache(saved.slug, saved.id);
    await this.cacheService.clearAllLists();

    this.logger.log(`✅ Collection "${saved.title}" بروز شد`);

    return saved;
  }

  /**
   * اضافه کردن محصولات به مجموعه
   */
  async addProducts(
    id: number,
    dto: AddProductsToCollectionDto,
  ): Promise<Collection> {
    const collection = await this.findOne(id);

    const newProducts = await this.productRepo.find({
      where: { id: In(dto.productIds) },
    });

    if (newProducts.length !== dto.productIds.length) {
      throw new BadRequestException('برخی از محصولات انتخابی یافت نشدند');
    }

    // فیلتر محصولاتی که از قبل در collection نیستند
    const existingProductIds = collection.products.map((p) => p.id);
    const uniqueNewProducts = newProducts.filter(
      (p) => !existingProductIds.includes(p.id),
    );

    collection.products = [...collection.products, ...uniqueNewProducts];

    const saved = await this.collectionRepo.save(collection);

    // ✅ پاک کردن cache
    await this.cacheService.clearCollectionCache(saved.slug, saved.id);
    await this.cacheService.clearAllLists();

    this.logger.log(`✅ ${uniqueNewProducts.length} محصول به "${saved.title}" اضافه شد`);

    return saved;
  }

  /**
   * حذف محصول از مجموعه
   */
  async removeProduct(
    collectionId: number,
    productId: number,
  ): Promise<Collection> {
    const collection = await this.findOne(collectionId);

    const productExists = collection.products.some((p) => p.id === productId);

    if (!productExists) {
      throw new NotFoundException('این محصول در مجموعه وجود ندارد');
    }

    collection.products = collection.products.filter((p) => p.id !== productId);

    const saved = await this.collectionRepo.save(collection);

    // ✅ پاک کردن cache
    await this.cacheService.clearCollectionCache(saved.slug, saved.id);
    await this.cacheService.clearAllLists();

    this.logger.log(`✅ محصول ${productId} از "${saved.title}" حذف شد`);

    return saved;
  }

  /**
   * حذف مجموعه
   */
  async remove(id: number): Promise<void> {
    const collection = await this.findOne(id);

    await this.collectionRepo.remove(collection);

    // ✅ پاک کردن cache
    await this.cacheService.clearCollectionCache(collection.slug, id);
    await this.cacheService.clearAllLists();

    this.logger.log(`✅ Collection "${collection.title}" حذف شد`);
  }

  /**
   * گرفتن محصولات یک مجموعه (Public)
   */
  async getCollectionProducts(slug: string): Promise<Product[]> {
    // ✅ چک کردن cache
    const cached = await this.cacheService.getProducts(slug);
    if (cached) {
      this.logger.log(`✅ محصولات ${slug} از cache برگشت`);
      return cached;
    }

    const collection = await this.findOneBySlug(slug);
    const products = collection.products || [];

    // ✅ ذخیره در cache
    await this.cacheService.setProducts(slug, products);

    return products;
  }
}