// promotion/infrastructure/repositories/promotion-repository.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    paginate,
    PaginateQuery,
    FilterOperator,
} from 'nestjs-paginate';
import { DataSource, In, Repository } from 'typeorm';
import {
    PromotionRepository as PromotionRepoInterface,
    OrderPreview,
} from '../../domain/interfaces/promotion-repository.interface';
import { Promotion } from '../../domain/entities/promotion.entity';
import { PromotionOrmEntity } from '../entities/promotion.orm-entity';
import { PromotionMapper } from '../../application/mappers/promotion.mapper';
import { Product } from 'src/modules/product/entities/product.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Category } from 'src/modules/category/entities/category.entity';
import { VariantProduct } from 'src/modules/variant-product/entities/variant-product.entity';
import { ConditionType } from '../../domain/enums/condition-type.enum';
import { ProductMapper } from 'src/modules/product/mappers/product.mapper';

@Injectable()
export class PromotionRepositoryImpl extends PromotionRepoInterface {
    private readonly logger = new Logger(PromotionRepositoryImpl.name);

    constructor(
        @InjectRepository(PromotionOrmEntity)
        private readonly ormRepo: Repository<PromotionOrmEntity>,
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,
        @InjectRepository(VariantProduct)
        private readonly variantRepo: Repository<VariantProduct>,
        private dataSource: DataSource,
    ) {
        super();
    }

    /**
     * Helper: ساخت name برای variant از روی attributes
     */
    private buildVariantName(variant: VariantProduct): string {
        if (!variant.attributes || variant.attributes.length === 0) {
            return variant.sku;
        }

        const sortedAttributes = [...variant.attributes].sort((a, b) => {
            const orderA = a.attribute?.displayOrder ?? 0;
            const orderB = b.attribute?.displayOrder ?? 0;
            return orderA - orderB;
        });

        const nameParts = sortedAttributes
            .map(attr => attr.value?.value)
            .filter(Boolean);

        return nameParts.join(' - ') || variant.sku;
    }

    /**
     * Helper: Enrichment یک promotion با اطلاعات کامل بر اساس type
     * فقط برای findById استفاده می‌شه
     */
    private async enrichPromotion(entity: PromotionOrmEntity): Promise<any> {
        if (!entity) return null;

        // جمع‌آوری IDs بر اساس type
        const productIds = new Set<number>();
        const variantIds = new Set<number>();
        const categoryIds = new Set<number>();
        const userIds = new Set<number>();

        for (const condition of entity.conditions || []) {
            if (condition.type === ConditionType.PRODUCT && condition.products) {
                condition.products.forEach((p: any) => {
                    if (p?.productId) {
                        productIds.add(p.productId);
                        p.variantIds?.forEach((vId: number) => variantIds.add(vId));
                    }
                });
            }

            if (condition.type === ConditionType.CATEGORY && condition.categoryIds) {
                condition.categoryIds.forEach((cId: number) => categoryIds.add(cId));
            }

            if (condition.type === ConditionType.USER && condition.userIds) {
                condition.userIds.forEach((uId: number) => userIds.add(uId));
            }
        }

        // بارگذاری داده‌ها
        const [products, variants, categories, users] = await Promise.all([
            productIds.size > 0
                ? this.productRepo.find({
                    where: { id: In([...productIds]) },
                    relations: ['mediaPinned', 'category'],
                })
                : Promise.resolve([]),
            variantIds.size > 0
                ? this.variantRepo.find({
                    where: { id: In([...variantIds]) },
                    relations: ['attributes', 'attributes.attribute', 'attributes.value'],
                })
                : Promise.resolve([]),
            categoryIds.size > 0
                ? this.categoryRepo.find({
                    where: { id: In([...categoryIds]) },
                })
                : Promise.resolve([]),
            userIds.size > 0
                ? this.userRepo.find({
                    where: { id: In([...userIds]) },
                    select: ['id', 'firstName', 'lastName', 'email', 'phone'],
                })
                : Promise.resolve([]),
        ]);

        // ایجاد Maps
        const productMap = new Map(products.map((p) => [p.id, p]));
        const variantMap = new Map(variants.map((v) => [v.id, v]));
        const categoryMap = new Map(categories.map((c) => [c.id, c]));
        const userMap = new Map(users.map((u) => [u.id, u]));

        // Enrichment بر اساس type
        const enrichedConditions = (entity.conditions || []).map((condition) => {
            const enrichedCondition: any = {
                id: condition.id,
                type: condition.type,
            };

            // TYPE: PRODUCT
            if (condition.type === ConditionType.PRODUCT) {
                enrichedCondition.products = (condition.products || []).map((p: any) => {
                    const product = productMap.get(p.productId);

                    if (!product) {
                        return { productId: p.productId, variantIds: p.variantIds };
                    }

                    const productMapp = ProductMapper.toResponse(product, { cartesian: true });

                    const enrichedVariants = (p.variantIds || [])
                        .map((vId: number) => variantMap.get(vId))
                        .filter(Boolean)
                        .map((v: any) => ({
                            id: v.id,
                            name: this.buildVariantName(v),
                            sku: v.sku,
                            price: v.price,
                            stock: v.stock,
                            discountPercent: v.discountPercent,
                            discountAmount: v.discountAmount,
                            attributes: v.attributes,
                        }));

                    return {
                        ...productMapp,
                        variants: enrichedVariants,
                    };
                });
            }

            // TYPE: CATEGORY
            if (condition.type === ConditionType.CATEGORY) {
                enrichedCondition.categories = (condition.categoryIds || [])
                    .map((cId: number) => categoryMap.get(cId))
                    .filter(Boolean)
                    .map((c: any) => ({
                        id: c.id,
                        title: c.title,
                        slug: c.slug,
                        description: c.description,
                        parentId: c.parentId,
                        level: c.level,
                        displayOrder: c.displayOrder,
                        isActive: c.isActive,
                    }));
            }

            // TYPE: USER
            if (condition.type === ConditionType.USER) {
                if (condition.userIds) {
                    enrichedCondition.users = condition.userIds
                        .map((uId: number) => userMap.get(uId))
                        .filter(Boolean)
                        .map((u: any) => ({
                            id: u.id,
                            firstName: u.firstName,
                            lastName: u.lastName,
                            email: u.email,
                            phone: u.phone,
                        }));
                }
            }

            // TYPE: MIN_ORDER_AMOUNT
            if (condition.type === ConditionType.MIN_ORDER_AMOUNT) {
                enrichedCondition.minAmount = condition.minAmount ? Number(condition.minAmount) : null;
            }

            // TYPE: FIRST_ORDER - فقط type

            return enrichedCondition;
        });

        // برگشت object enriched شده
        return {
            id: entity.id,
            name: entity.name,
            type: entity.type,
            code: entity.code,
            startsAt: entity.startsAt,
            endsAt: entity.endsAt,
            usageLimit: entity.usageLimit,
            usedCount: entity.usedCount,
            isActive: entity.isActive,
            maxDiscountAmount: entity.maxDiscountAmount ? Number(entity.maxDiscountAmount) : null,
            conditions: enrichedConditions,
            actions: (entity.actions || []).map((a) => ({
                id: a.id,
                type: a.type,
                value: a.value ? Number(a.value) : null,
                meta: a.meta,
            })),
        };
    }

    /**
     * دریافت پروموشن با ID - با enrichment کامل
     */
    async findById(id: number): Promise<any> {
        const entity = await this.ormRepo.findOne({
            where: { id },
            relations: ['conditions', 'actions'],
        });

        if (!entity) return null;

        return this.enrichPromotion(entity);
    }

    /**
     * دریافت پروموشن فعال با کد
     */
    async findActiveByCode(code: string): Promise<Promotion | null> {
        const now = new Date();

        const entity = await this.ormRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.conditions', 'c')
            .leftJoinAndSelect('p.actions', 'a')
            .where('p.code = :code', { code })
            .andWhere('p.isActive = :isActive', { isActive: true })
            .andWhere('p.startsAt <= :now', { now })
            .andWhere('p.endsAt >= :now', { now })
            .getOne();

        return entity ? PromotionMapper.fromOrmToDomain(entity) : null;
    }

    /**
     * دریافت پروموشن‌های فعال برای سفارش
     */
    async findActiveForOrder(order: OrderPreview): Promise<Promotion[]> {
        const now = new Date();

        const qb = this.ormRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.conditions', 'c')
            .leftJoinAndSelect('p.actions', 'a')
            .where('p.isActive = :isActive', { isActive: true })
            .andWhere('p.startsAt <= :now', { now })
            .andWhere('p.endsAt >= :now', { now });

        // فیلتر بر اساس userIds
        qb.andWhere(`
            (
                c.type != 'user'
                OR
                (c.type = 'user' AND JSON_CONTAINS(c.user_ids, :uidJson))
            )
        `, {
            uidJson: JSON.stringify(order.userId)
        });

        const entities = await qb.getMany();

        this.logger.debug(
            `Found ${entities.length} active promotions for user ${order.userId}`,
        );

        return entities.map(PromotionMapper.fromOrmToDomain);
    }

    /**
     * ایجاد پروموشن جدید با Transaction
     */
    async create(promotion: Promotion): Promise<Promotion> {
        return await this.dataSource.transaction(async (manager) => {
            const entity = PromotionMapper.fromDomainToOrm(promotion);
            const saved = await manager.save(PromotionOrmEntity, entity);

            this.logger.log(`Created promotion: ${saved.id} (${saved.name})`);

            return PromotionMapper.fromOrmToDomain(saved);
        });
    }

    /**
     * بروزرسانی پروموشن با Transaction
     */
    async update(id: number, promotion: Promotion): Promise<Promotion> {
        return await this.dataSource.transaction(async (manager) => {
            const existing = await manager.findOne(PromotionOrmEntity, {
                where: { id },
            });

            if (!existing) {
                throw new Error(`Promotion with ID ${id} not found`);
            }

            const entity = PromotionMapper.fromDomainToOrm(promotion);
            entity.id = id;

            const saved = await manager.save(PromotionOrmEntity, entity);

            this.logger.log(`Updated promotion: ${saved.id} (${saved.name})`);

            return PromotionMapper.fromOrmToDomain(saved);
        });
    }

    /**
     * حذف پروموشن
     */
    async delete(id: number): Promise<void> {
        const existing = await this.ormRepo.findOne({
            where: { id },
        });

        if (!existing) {
            throw new Error(`Promotion with ID ${id} not found`);
        }

        await this.ormRepo.delete(id);

        this.logger.log(`Deleted promotion: ${id}`);
    }

    /**
     * لیست پروموشن‌ها با Pagination - بدون enrichment
     */
    async paginated(query: PaginateQuery): Promise<any> {
        const result = await paginate<PromotionOrmEntity>(query, this.ormRepo, {
            sortableColumns: ['id', 'startsAt', 'endsAt'],
            searchableColumns: ['code', 'name'],
            filterableColumns: {
                type: [FilterOperator.EQ, FilterOperator.IN],
                isActive: [FilterOperator.EQ],
            },
            relations: ['actions', 'conditions'],
            defaultSortBy: [['id', 'DESC']],
        });

        if (!result.data || result.data.length === 0) {
            return {
                items: [],
                meta: result.meta,
                links: result.links,
            };
        }

        // تبدیل به domain entities (بدون enrichment)
        const items = result.data.map(entity => PromotionMapper.fromOrmToDomain(entity));

        return {
            items,
            meta: result.meta,
            links: result.links,
        };
    }

    async incrementUsageCount(id: number): Promise<void> {
        await this.ormRepo.increment({ id }, 'usedCount', 1);
        this.logger.debug(`Incremented usage count for promotion: ${id}`);
    }

    async getPromotionProducts(promotionId: number): Promise<number[]> {
        const promotion = await this.ormRepo.findOne({
            where: { id: promotionId, isActive: true },
            relations: ['conditions'],
        });

        if (!promotion) {
            this.logger.warn(`Promotion ${promotionId} not found or inactive`);
            return [];
        }

        const now = new Date();
        if (promotion.startsAt > now || promotion.endsAt < now) {
            this.logger.warn(`Promotion ${promotionId} is not active in current time range`);
            return [];
        }

        const productIds = new Set<number>();

        for (const condition of promotion.conditions) {
            if (condition.type === ConditionType.PRODUCT && condition.products) {
                condition.products.forEach((p: any) => {
                    if (p?.productId) productIds.add(p.productId);
                });
            }
        }

        this.logger.debug(`Found ${productIds.size} products for promotion ${promotionId}`);
        return Array.from(productIds);
    }
}
