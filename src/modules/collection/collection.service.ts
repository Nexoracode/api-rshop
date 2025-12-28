import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Collection } from './entities/collection.entity';
import { Product } from '../product/entities/product.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { AddProductsToCollectionDto } from './dto/add-product-to-collection.dto';

@Injectable()
export class CollectionService {
  constructor(
    @InjectRepository(Collection)
    private readonly collectionRepo: Repository<Collection>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
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

    return await this.collectionRepo.save(collection);
  }

  /**
   * لیست تمام مجموعه‌ها (Public)
   */
  async findAll(): Promise<Collection[]> {
    const now = new Date();

    return await this.collectionRepo.find({
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
  }

  /**
   * لیست تمام مجموعه‌ها (Admin) - بدون فیلتر
   */
  async findAllAdmin(): Promise<Collection[]> {
    return await this.collectionRepo.find({
      relations: ['products'],
      order: {
        sortOrder: 'ASC',
        createdAt: 'DESC',
      },
    });
  }

  /**
   * جزئیات یک مجموعه با slug (Public)
   */
  async findOneBySlug(slug: string): Promise<Collection> {
    const now = new Date();

    const collection = await this.collectionRepo.findOne({
      where: {
        slug,
        isActive: true,
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      relations: ['products', 'products.mediaPinned'],
    })

    if (!collection) {
      throw new NotFoundException('مجموعه یافت نشد');
    }

    return collection;
  }

  /**
   * جزئیات یک مجموعه با ID (Admin)
   */
  async findOne(id: number): Promise<Collection> {
    const collection = await this.collectionRepo.findOne({
      where: { id },
      relations: ['products', 'products.mediaPinned'],
    });

    if (!collection) {
      throw new NotFoundException('مجموعه یافت نشد');
    }

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

    return await this.collectionRepo.save(collection);
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

    return await this.collectionRepo.save(collection);
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

    return await this.collectionRepo.save(collection);
  }

  /**
   * حذف مجموعه
   */
  async remove(id: number): Promise<void> {
    const collection = await this.findOne(id);
    await this.collectionRepo.remove(collection);
  }

  /**
   * گرفتن محصولات یک مجموعه (Public)
   */
  async getCollectionProducts(slug: string): Promise<Product[]> {
    const collection = await this.findOneBySlug(slug);
    return collection.products || [];
  }
}