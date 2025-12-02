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
        private dataSource: DataSource,
    ) {
        super();
    }

    /**
     * دریافت پروموشن با ID
     */
    async findById(id: number): Promise<Promotion | null> {
        const entity = await this.ormRepo.findOne({
            where: { id },
            relations: ['conditions', 'actions'],
        });

        return entity ? PromotionMapper.fromOrmToDomain(entity) : null;
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

        // فیلتر بر اساس userId
        qb.andWhere(`
            (
                c.type != 'user'
                OR 
                (c.type = 'user' AND c.userId = :uid)
            )
        `, { uid: order.userId });

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
     * لیست پروموشن‌ها با Pagination (بهبود یافته - رفع N+1)
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

        // اگر هیچ داده‌ای نیست، برگردان
        if (!result.data || result.data.length === 0) {
            return {
                items: [],
                meta: result.meta,
                links: result.links,
            };
        }

        // ✅ جمع‌آوری همه IDs برای رفع N+1 Problem
        const allProductIds = new Set<number>();
        const allCategoryIds = new Set<number>();
        const allUserIds = new Set<number>();

        for (const entity of result.data) {
            // بررسی وجود conditions
            if (!entity.conditions || !Array.isArray(entity.conditions)) {
                continue;
            }

            for (const c of entity.conditions) {
                // Products
                if (c.products && Array.isArray(c.products)) {
                    c.products.forEach((p) => {
                        if (p && typeof p.productId === 'number') {
                            allProductIds.add(p.productId);
                        }
                    });
                }

                // Categories
                if (c.categoryIds && Array.isArray(c.categoryIds)) {
                    c.categoryIds.forEach((id) => {
                        if (typeof id === 'number') {
                            allCategoryIds.add(id);
                        }
                    });
                }

                // Users
                if (c.userId && typeof c.userId === 'number') {
                    allUserIds.add(c.userId);
                }
            }
        }

        this.logger.debug(
            `Loading details: ${allProductIds.size} products, ${allCategoryIds.size} categories, ${allUserIds.size} users`,
        );

        // ✅ یک query برای همه (بهبود Performance)
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

        // ✅ ایجاد Map برای دسترسی سریع O(1)
        const productMap = new Map<number, Product>(
            products.map((p) => [p.id, p])
        );
        const categoryMap = new Map<number, Category>(
            categories.map((c) => [c.id, c])
        );
        const userMap = new Map<number, User>(
            users.map((u) => [u.id, u])
        );

        // ✅ Mapping با استفاده از Map (سریع‌تر از filter)
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

            // بررسی وجود conditions
            if (entity.conditions && Array.isArray(entity.conditions)) {
                for (const c of entity.conditions) {
                    // ✅ Products با type guard
                    if (c.products && Array.isArray(c.products)) {
                        c.products.forEach((p) => {
                            if (p && typeof p.productId === 'number') {
                                const product = productMap.get(p.productId);
                                if (product) {
                                    // جلوگیری از duplicate
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

                    // ✅ Categories با type guard
                    if (c.categoryIds && Array.isArray(c.categoryIds)) {
                        c.categoryIds.forEach((id) => {
                            if (typeof id === 'number') {
                                const category = categoryMap.get(id);
                                if (category) {
                                    // جلوگیری از duplicate
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

                    // ✅ Users با type guard
                    if (c.userId && typeof c.userId === 'number') {
                        const user = userMap.get(c.userId);
                        if (user) {
                            // جلوگیری از duplicate
                            const exists = userDetails.some(
                                (ud) => ud.id === user.id
                            );
                            if (!exists) {
                                userDetails.push(user);
                            }
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

    /**
     * افزایش شمارنده استفاده از پروموشن
     */
    async incrementUsageCount(id: number): Promise<void> {
        await this.ormRepo.increment({ id }, 'usedCount', 1);
        this.logger.debug(`Incremented usage count for promotion: ${id}`);
    }
}
