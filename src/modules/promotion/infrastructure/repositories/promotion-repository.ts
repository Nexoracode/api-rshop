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
     * دریافت پروموشن با ID به همراه اطلاعات کامل بر اساس type
     */
    async findById(id: number): Promise<Promotion | null> {
        const entity = await this.ormRepo.findOne({
            where: { id },
            relations: ['conditions', 'actions'],
        });

        if (!entity) {
            return null;
        }

        // جمع‌آوری IDs بر اساس type
        const productIds = new Set<number>();
        const variantIds = new Set<number>();
        const categoryIds = new Set<number>();
        const userIds = new Set<number>();

        console.log(entity.conditions.map(c => c.type))

        for (const condition of entity.conditions) {
            // ✅ فقط برای type: 'product'
            if (condition.type === ConditionType.PRODUCT && condition.products && Array.isArray(condition.products)) {
                condition.products.forEach((p) => {
                    if (p && typeof p.productId === 'number') {
                        productIds.add(p.productId);
                        if (p.variantIds && Array.isArray(p.variantIds)) {
                            p.variantIds.forEach((vId) => {
                                if (typeof vId === 'number') {
                                    variantIds.add(vId);
                                }
                            });
                        }
                    }
                });
            }

            // ✅ فقط برای type: 'category'
            if (condition.type === ConditionType.CATEGORY && condition.categoryIds && Array.isArray(condition.categoryIds)) {
                condition.categoryIds.forEach((cId) => {
                    if (typeof cId === 'number') {
                        categoryIds.add(cId);
                    }
                });
            }

            // ✅ فقط برای type: 'user'
            if (condition.type === ConditionType.USER) {
                if (condition.userId && typeof condition.userId === 'number') {
                    userIds.add(condition.userId);
                }
                if (condition.userIds && Array.isArray(condition.userIds)) {
                    condition.userIds.forEach((uId) => {
                        if (typeof uId === 'number') {
                            userIds.add(uId);
                        }
                    });
                }
            }
        }

        this.logger.debug(
            `Loading details for promotion ${id}: ${productIds.size} products, ${variantIds.size} variants, ${categoryIds.size} categories, ${userIds.size} users`,
        );

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

        const domain = PromotionMapper.fromOrmToDomain(entity);

        // Enrichment بر اساس type
        const enrichedConditions = domain.conditions.map((condition) => {
            const enrichedCondition: any = {
                id: condition.id,
                type: condition.type,
            };

            // ✅ TYPE: PRODUCT
            if (condition.type === ConditionType.PRODUCT) {
                enrichedCondition.products = condition.products?.map((p) => {
                    const product = productMap.get(p.productId);

                    if (!product) {
                        return {
                            productId: p.productId,
                            variantIds: p.variantIds,
                        };
                    }

                    let enrichedVariants: any[] = [];
                    if (p.variantIds && Array.isArray(p.variantIds)) {
                        enrichedVariants = p.variantIds
                            .map((vId) => variantMap.get(vId))
                            .filter((v) => v !== undefined);
                    }

                    const productMapper = ProductMapper.toResponse(product, { cartesian: true })

                    return {
                        ...productMapper,
                        variants: enrichedVariants.map((v) => ({
                            id: v.id,
                            name: this.buildVariantName(v),
                            sku: v.sku,
                            price: v.price,
                            stock: v.stock,
                            discountPercent: v.discountPercent,
                            discountAmount: v.discountAmount,
                            attributes: v.attributes,
                        })),
                    };
                }) || [];
            }

            // ✅ TYPE: CATEGORY
            if (condition.type === ConditionType.CATEGORY) {
                enrichedCondition.categoryIds = condition.categoryIds || [];
                enrichedCondition.categories = (condition.categoryIds || [])
                    .map((cId) => categoryMap.get(cId))
                    .filter((c) => c !== undefined)
                    .map((c) => ({
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

            // ✅ TYPE: USER
            if (condition.type === ConditionType.USER) {
                // userId (deprecated)
                if (condition.userId) {
                    enrichedCondition.userId = condition.userId;
                    const user = userMap.get(condition.userId);
                    if (user) {
                        enrichedCondition.user = {
                            id: user.id,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            phone: user.phone,
                        };
                    }
                }

                // userIds (جدید)
                if (condition.userIds && Array.isArray(condition.userIds)) {
                    enrichedCondition.userIds = condition.userIds;
                    enrichedCondition.users = condition.userIds
                        .map((uId) => userMap.get(uId))
                        .filter((u) => u !== undefined)
                        .map((u) => ({
                            id: u.id,
                            firstName: u.firstName,
                            lastName: u.lastName,
                            email: u.email,
                            phone: u.phone,
                        }));
                }
            }

            // ✅ TYPE: MIN_ORDER_AMOUNT
            if (condition.type === ConditionType.MIN_ORDER_AMOUNT) {
                enrichedCondition.minAmount = condition.minAmount;
            }

            // ✅ TYPE: FIRST_ORDER
            if (condition.type === ConditionType.FIRST_ORDER) {
                // این type فقط type داره، هیچ فیلد اضافی نداره
            }

            return enrichedCondition;
        });

        return {
            ...domain,
            conditions: enrichedConditions,
        } as any;
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

        // فیلتر بر اساس userId و userIds
        qb.andWhere(`
            (
                c.type != 'user'
                OR 
                (c.type = 'user' AND c.userId = :uid)
                OR
                (c.type = 'user' AND JSON_CONTAINS(c.user_ids, :uidJson))
            )
        `, {
            uid: order.userId,
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
     * لیست پروموشن‌ها با Pagination
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

        // جمع‌آوری IDs بر اساس type
        const allProductIds = new Set<number>();
        const allCategoryIds = new Set<number>();
        const allUserIds = new Set<number>();

        for (const entity of result.data) {
            if (!entity.conditions || !Array.isArray(entity.conditions)) {
                continue;
            }

            for (const c of entity.conditions) {
                if (c.type === ConditionType.PRODUCT && c.products && Array.isArray(c.products)) {
                    c.products.forEach((p) => {
                        if (p && typeof p.productId === 'number') {
                            allProductIds.add(p.productId);
                        }
                    });
                }

                if (c.type === ConditionType.CATEGORY && c.categoryIds && Array.isArray(c.categoryIds)) {
                    c.categoryIds.forEach((id) => {
                        if (typeof id === 'number') {
                            allCategoryIds.add(id);
                        }
                    });
                }

                if (c.type === ConditionType.USER) {
                    if (c.userId && typeof c.userId === 'number') {
                        allUserIds.add(c.userId);
                    }
                    if (c.userIds && Array.isArray(c.userIds)) {
                        c.userIds.forEach((id) => {
                            if (typeof id === 'number') {
                                allUserIds.add(id);
                            }
                        });
                    }
                }
            }
        }

        this.logger.debug(
            `Loading details: ${allProductIds.size} products, ${allCategoryIds.size} categories, ${allUserIds.size} users`,
        );

        const [products, categories, users] = await Promise.all([
            allProductIds.size > 0
                ? this.productRepo.find({
                    where: { id: In([...allProductIds]) },
                    relations: ['mediaPinned', 'variants'],
                })
                : Promise.resolve([]),
            allCategoryIds.size > 0
                ? this.categoryRepo.find({
                    where: { id: In([...allCategoryIds]) },
                })
                : Promise.resolve([]),
            allUserIds.size > 0
                ? this.userRepo.find({
                    where: { id: In([...allUserIds]) },
                })
                : Promise.resolve([]),
        ]);

        const productMap = new Map<number, Product>(
            products.map((p) => [p.id, p])
        );
        const categoryMap = new Map<number, Category>(
            categories.map((c) => [c.id, c])
        );
        const userMap = new Map<number, User>(
            users.map((u) => [u.id, u])
        );

        const items: Array<
            Promotion & {
                products: Product[];
                categories: Category[];
                users: User[]
            }
        > = [];

        for (const entity of result.data) {
            const domain = PromotionMapper.fromOrmToDomain(entity);

            const productDetails: Product[] = [];
            const categoryDetails: Category[] = [];
            const userDetails: User[] = [];

            if (entity.conditions && Array.isArray(entity.conditions)) {
                for (const c of entity.conditions) {
                    if (c.type === ConditionType.PRODUCT && c.products && Array.isArray(c.products)) {
                        c.products.forEach((p) => {
                            if (p && typeof p.productId === 'number') {
                                const product = productMap.get(p.productId);
                                if (product) {
                                    const exists = productDetails.some(
                                        (pd) => pd.id === product.id
                                    );
                                    if (!exists) {
                                        productDetails.push(product);
                                    }
                                }
                            }
                        });
                    }

                    if (c.type === ConditionType.CATEGORY && c.categoryIds && Array.isArray(c.categoryIds)) {
                        c.categoryIds.forEach((id) => {
                            if (typeof id === 'number') {
                                const category = categoryMap.get(id);
                                if (category) {
                                    const exists = categoryDetails.some(
                                        (cd) => cd.id === category.id
                                    );
                                    if (!exists) {
                                        categoryDetails.push(category);
                                    }
                                }
                            }
                        });
                    }

                    if (c.type === ConditionType.USER) {
                        if (c.userId && typeof c.userId === 'number') {
                            const user = userMap.get(c.userId);
                            if (user) {
                                const exists = userDetails.some(
                                    (ud) => ud.id === user.id
                                );
                                if (!exists) {
                                    userDetails.push(user);
                                }
                            }
                        }

                        if (c.userIds && Array.isArray(c.userIds)) {
                            c.userIds.forEach((id) => {
                                if (typeof id === 'number') {
                                    const user = userMap.get(id);
                                    if (user) {
                                        const exists = userDetails.some(
                                            (ud) => ud.id === user.id
                                        );
                                        if (!exists) {
                                            userDetails.push(user);
                                        }
                                    }
                                }
                            });
                        }
                    }
                }
            }

            items.push({
                ...domain,
                products: productDetails,
                categories: categoryDetails,
                users: userDetails,
            });
        }

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
            if (condition.type === ConditionType.PRODUCT && condition.products && Array.isArray(condition.products)) {
                condition.products.forEach((p) => {
                    if (p && typeof p.productId === 'number') {
                        productIds.add(p.productId);
                    }
                });
            }
        }

        this.logger.debug(`Found ${productIds.size} products for promotion ${promotionId}`);
        return Array.from(productIds);
    }
}
