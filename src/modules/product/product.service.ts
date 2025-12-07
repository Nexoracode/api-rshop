import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { DataSource, In, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IProductService } from './interfaces/product.service.interface';
import { IProductResponse } from './interfaces/product.response';
import { runInTransaction } from 'src/common/helpers/transaction.helper';
import { Media } from '../media/entities/image.entity';
import { Category } from '../category/entities/category.entity';
import { ProductMapper } from './mappers/product.mapper';
import { FilterOperator, paginate, PaginateQuery } from 'nestjs-paginate';
import axios from 'axios';
import { HelperEntity } from '../helper/entities/helper.entity';
import { Brand } from '../brand/entities/brand.entity';
import { UpdateBulkDto } from './dto/update-bulk.dto';
import { getAverageRating } from 'src/common/helpers/review.helper';
import { ReviewMapper } from '../review/mappers/review.mapper';
import { Review } from '../review/entities/review.entity';
import { EventEmitter2 } from '@nestjs/event-emitter'; // ✅ اضافه شد

// ✅ اضافه: Event برای انبارداری
export class ProductCreatedEvent {
    constructor(
        public readonly productId: number,
        public readonly initialStock: number,
        public readonly userId: number,
    ) { }
}

export class ProductStockUpdatedEvent {
    constructor(
        public readonly productId: number,
        public readonly oldStock: number,
        public readonly newStock: number,
        public readonly userId: number,
    ) { }
}

const relations = [
    "variants",
    "variants.attributes",
    "variants.attributes.attribute",
    "variants.attributes.value",
    "variants.attributes.attribute.group",
    'attributeValues',
    'attributeValues.attribute',
    'attributeValues.attribute.group',
    "helper",
    "category",
    "brand",
    "medias",
    "mediaPinned",
];

@Injectable()
export class ProductService implements IProductService {
    private readonly logger = new Logger(ProductService.name); // ✅ اضافه شد

    constructor(
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        @InjectRepository(Review)
        private readonly reviewRepo: Repository<Review>,
        private dataSource: DataSource,
        private readonly eventEmitter: EventEmitter2, // ✅ اضافه شد
    ) { }

    async findAll(query: PaginateQuery): Promise<Object> {
        const products = await paginate(query, this.productRepo, {
            sortableColumns: ['id', 'name', 'price', 'stock'],
            relations,
            filterableColumns: {
                'is_visible': [FilterOperator.EQ],
                'requires_preparation': [FilterOperator.EQ],
                'category_id': [FilterOperator.EQ],
                'brand_id': [FilterOperator.EQ],
                'created_at': [FilterOperator.GTE, FilterOperator.LTE, FilterOperator.BTW],
                'weight': [FilterOperator.GTE, FilterOperator.LTE],
                'discount_amount': [FilterOperator.GTE, FilterOperator.LTE],
                'discount_percent': [FilterOperator.GTE, FilterOperator.LTE],
                price: [FilterOperator.GTE, FilterOperator.LTE],
                stock: [FilterOperator.GTE, FilterOperator.LTE],
            },
            defaultSortBy: [['id', 'DESC']],
            searchableColumns: ['name'],
        });
        return {
            message: 'محصولات با موفقیت دریافت شد.',
            data: {
                items: products.data.map((product) => ProductMapper.toResponse(product, { cartesian: true })),
                meta: products.meta,
                links: products.links,
            }
        };
    }

    async findOne(id: number): Promise<IProductResponse> {
        const product = await this.productRepo.findOne({
            where: { id },
            relations
        });
        if (!product) throw new NotFoundException('محصول مورد نظر یافت نشد.');
        return ProductMapper.toResponse(product, { cartesian: true });
    }

    async findOneForSite(id: number): Promise<IProductResponse> {
        const product = await this.productRepo.findOne({
            where: { id },
            relations,
        });
        if (!product) throw new NotFoundException('محصول مورد نظر یافت نشد.');
        const reviews = await this.reviewRepo.find({
            where: {
                product: { id: product.id },
                isApproved: true,
            },
            relations: ['user', 'product'],
        });
        const averageRating = getAverageRating(reviews);
        const lengthReview = reviews.length;
        (product as any).averageRating = averageRating;
        (product as any).reviewsCount = lengthReview;
        (product as any).reviews = reviews.map(r => ReviewMapper.toResponse(r));
        return ProductMapper.toResponse(product, { cartesian: true });
    }

    async create(data: CreateProductDto, userId?: number): Promise<IProductResponse> {
        return runInTransaction(this.dataSource, async (manager) => {
            if (!data.mediaIds) throw new BadRequestException('تصویر محصول خود را مشخص کنید.');
            const duplicate = await manager.findOne(Product, { where: { name: data.name } });
            if (duplicate) throw new NotFoundException('این نام محصول از قبل ثبت شده است.')
            const category = await manager.findOne(Category, { where: { id: data.categoryId } });
            if (!category) throw new NotFoundException('دسته بندی مورد نظر یافت نشد');
            if (data.helperId && data.helperId !== 0) {
                const helper = await manager.findOne(HelperEntity, { where: { id: data.helperId } })
                if (!helper) throw new NotFoundException('راهنمای تصویر یافت نشد.');
            }
            const brand = await manager.findOne(Brand, { where: { id: data.brandId } })
            if (!brand) throw new NotFoundException('برند مورد نظر یافت نشد');
            const product = manager.create(Product, data);
            if (!data.requiresPreparation) {
                product.preparationDays = null;
            }
            const media = await manager.findOne(Media, { where: { id: data.mediaPinnedId } });
            if (media) {
                product.mediaPinned = media;
                product.mediaPinnedId = media.id;
            }
            const savedProduct = await manager.save(Product, {
                ...product,
                category,
            });
            await manager.update(Media, { id: In(data.mediaIds) }, { product: savedProduct })
            const result = await manager.findOne(Product, {
                where: { id: savedProduct.id },
                relations
            });
            if (!result) throw new NotFoundException('محصول مورد نظر ثبت نشده است.');

            // ✅✅✅ یکپارچه‌سازی با انبارداری - ثبت موجودی اولیه
            if (data.stock && data.stock > 0) {
                try {
                    this.eventEmitter.emit(
                        'product.created',
                        new ProductCreatedEvent(savedProduct.id, data.stock, userId || 1),
                    );
                    this.logger.log(`🎉 Event 'product.created' emitted for product ${savedProduct.id} with stock ${data.stock}`);
                } catch (error) {
                    this.logger.error(`Failed to emit product.created event for product ${savedProduct.id}`, error.stack);
                }
            }

            return ProductMapper.toResponse(result, { cartesian: true });
        })
    }


    async update(id: number, data: UpdateProductDto, userId?: number): Promise<IProductResponse> {
        return runInTransaction(this.dataSource, async (manager) => {
            // load product with relations so we can manage medias and pinned media
            const product = await manager.findOne(Product, { where: { id }, relations });
            if (!product) throw new NotFoundException('محصول یافت نشد');
            if (data.name) {
                const duplicate = await manager.findOne(Product, { where: { name: data.name } });
                if (duplicate && duplicate.id !== id) throw new BadRequestException('این نام محصول از قبل ثبت شده است.')
            }
            const category = await manager.findOne(Category, { where: { id: data.categoryId ?? product.categoryId } })
            if (!category) throw new NotFoundException('دسته بندی مورد نظر یافت نشد');
            if ((data.helperId ?? product.helperId) && (data.helperId ?? product.helperId) !== 0) {
                const helper = await manager.findOne(HelperEntity, { where: { id: data.helperId ?? product.helperId } })
                if (!helper) throw new NotFoundException('راهنمای تصویر یافت نشد.');
            }
            if ((data.discountAmount ?? product.discountAmount) && (data.discountPercent ?? product.discountPercent)) {
                throw new BadRequestException('نمی توان همزمان تخفیف قیمت ثابت و درصدی را وارد کرد.');
            }
            const brand = await manager.findOne(Brand, { where: { id: data.brandId ?? product.brandId } })
            if (!brand) throw new NotFoundException('برند مورد نظر یافت نشد');

            // ✅ ذخیره موجودی قدیمی
            const oldStock = product.stock;

            // merge incoming data
            const updated = manager.merge(Product, product, data);
            if (!data.requiresPreparation) {
                updated.preparationDays = null;
            }

            // handle mediaPinned in payload (set/unset)
            if (data.mediaPinnedId != null) {
                if (data.mediaPinnedId === 0) {
                    // unset pinned media
                    updated.mediaPinned = null as unknown as Media;
                    updated.mediaPinnedId = null;
                } else {
                    const media = await manager.findOne(Media, { where: { id: data.mediaPinnedId } });
                    if (!media) throw new NotFoundException('تصویر پین‌شده یافت نشد.');
                    updated.mediaPinned = media;
                    updated.mediaPinnedId = media.id;
                }
            }

            const savedProduct = await manager.save(Product, updated);

            // update media associations if mediaIds provided
            if (data.mediaIds?.length) {
                // detach previous medias
                const prevMediaIds = (product.medias || []).map((m) => m.id);
                if (prevMediaIds.length) {
                    await manager.update(Media, { id: In(prevMediaIds) }, { product: null });
                }
                // attach new medias to product
                await manager.update(Media, { id: In(data.mediaIds) }, { product: savedProduct });
            }

            // ensure pinned media is associated with the product (or unset previous pinned)
            if (data.mediaPinnedId != null) {
                if (data.mediaPinnedId === 0) {
                    if (product.mediaPinned) {
                        // if previous pinned media existed, clear its product link only if it still references this product
                        await manager.update(Media, { id: product.mediaPinned.id, product: { id: savedProduct.id } }, { product: null });
                    }
                } else {
                    // attach the pinned media to the product (if not already)
                    await manager.update(Media, { id: data.mediaPinnedId }, { product: savedProduct });
                }
            }

            const result = await manager.findOne(Product, {
                where: { id: savedProduct.id },
                relations
            });
            if (!result) throw new NotFoundException('محصول مورد نظر ثبت نشده است.');

            // ✅✅✅ یکپارچه‌سازی با انبارداری - بروزرسانی موجودی
            if (data.stock != null && data.stock !== oldStock) {
                try {
                    this.eventEmitter.emit(
                        'product.stock.updated',
                        new ProductStockUpdatedEvent(savedProduct.id, oldStock, data.stock, userId || 1),
                    );
                    this.logger.log(`🎉 Event 'product.stock.updated' emitted for product ${savedProduct.id}: ${oldStock} → ${data.stock}`);
                } catch (error) {
                    this.logger.error(`Failed to emit product.stock.updated event for product ${savedProduct.id}`, error.stack);
                }
            }

            return ProductMapper.toResponse(result, { cartesian: true });
        });
    }

    async updateBulk(ids: number[], dto: UpdateBulkDto) {
        return runInTransaction(this.dataSource, async (manager) => {
            const products = await manager.find(Product, { where: { id: In(ids) }, relations });
            if (!products.length) throw new NotFoundException("محصولات مورد نظر یافت نشدند.");

            if (dto.categoryId) {
                const category = await manager.findOne(Category, { where: { id: dto.categoryId } });
                if (!category) {
                    throw new NotFoundException('دسته مورد نظر یافت نشد.');
                }
            }

            if (dto.discountAmount && dto.discountPercent) {
                throw new BadRequestException('نمی توان همزمان تخفیف قیمت ثابت و درصدی را وارد کرد.');
            }

            const updatedProductsData = products.map((product) => {
                const basePrice = Number(product.price) || 0;
                const delta = Number(dto.priceValue) || 0;
                let newPrice = basePrice;

                // 🔹 تغییر قیمت
                if (dto.priceValue != null && dto.priceMode) {
                    switch (dto.priceMode) {
                        case "set":
                            newPrice = delta;
                            break;
                        case "increase":
                            newPrice = basePrice + delta;
                            break;
                        case "decrease":
                            newPrice = Math.max(0, basePrice - delta);
                            break;
                    }
                }

                if (Number.isNaN(newPrice)) {
                    throw new BadRequestException("مقدار قیمت نامعتبر است.");
                }

                // 🔹 تخفیف‌ها (درصدی یا مبلغی)
                let discountPercent = Number(product.discountPercent) || 0;
                let discountAmount = Number(product.discountAmount) || 0;

                if (dto.discountPercent != null) {
                    discountPercent = dto.discountPercent;
                    discountAmount = 0; // ✅ چون نوع درصدی انتخاب شده
                } else if (dto.discountAmount != null) {
                    discountAmount = dto.discountAmount;
                    discountPercent = 0; // ✅ چون نوع مبلغی انتخاب شده
                }

                // ✅ جلوگیری از محدوده غیرمجاز قیمت
                if (newPrice > 999999999.99)
                    throw new BadRequestException("مقدار قیمت از محدوده مجاز بیشتر است.");

                return manager.merge(Product, product, {
                    isVisible: dto.isVisible ?? product.isVisible,
                    isFeatured: dto.isFeatured ?? product.isFeatured,
                    price: newPrice,
                    discountPercent,
                    discountAmount,
                    category: dto.categoryId ? { id: dto.categoryId } : product.category
                });
            });

            await manager.save(Product, updatedProductsData);
            const updatedProducts = await manager.find(Product, { where: { id: In(ids) }, relations });

            return {
                message: "محصولات با موفقیت ویرایش شدند.",
                data: updatedProducts.map((p) => ProductMapper.toResponse(p, { cartesian: true })),
            };
        });
    }

    async remove(id: number): Promise<Object> {
        return runInTransaction(this.dataSource, async (manager) => {
            const product = await manager.findOne(Product, {
                where: { id },
                relations
            });
            if (!product) throw new NotFoundException("محصول مورد نظر یافت نشد.");
            await manager.remove(Product, product);
            await manager.update(Media, { productId: id }, { product: null });
            return {
                message: 'محصول با موفقیت حذف شد.',
                data: null
            }
        })
    }

    async removeBulk(ids: number[]): Promise<Object> {
        return runInTransaction(this.dataSource, async (manager) => {
            const products = await manager.find(Product, {
                where: { id: In(ids) },
                relations
            });
            if (!products.length) {
                throw new NotFoundException('هیچ محصولی یافت نشد.');
            }
            if (!products) throw new NotFoundException("محصول مورد نظر یافت نشد.");
            await manager.remove(Product, products);
            await manager.update(Media, { productId: In(ids) }, { product: null });
            return {
                message: 'محصول با موفقیت حذف شد.',
                data: null
            }
        })
    }

}
