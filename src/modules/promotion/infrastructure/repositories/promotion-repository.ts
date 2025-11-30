// promotion/infrastructure/repositories/promotion-repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    paginate,
    PaginateQuery,
    FilterOperator,
} from 'nestjs-paginate';
import { In, Repository } from 'typeorm';
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
    constructor(
        @InjectRepository(PromotionOrmEntity)
        private readonly ormRepo: Repository<PromotionOrmEntity>,
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,

    ) {
        super();
    }

    async findById(id: number): Promise<Promotion | null> {
        const entity = await this.ormRepo.findOne({
            where: { id },
        });

        return entity ? PromotionMapper.fromOrmToDomain(entity) : null;
    }

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

    async findActiveForOrder(order: OrderPreview): Promise<Promotion[]> {
        const now = new Date();

        const qb = this.ormRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.conditions', 'c')
            .leftJoinAndSelect('p.actions', 'a')
            .where('p.isActive = :isActive', { isActive: true })
            .andWhere('p.startsAt <= :now', { now })
            .andWhere('p.endsAt >= :now', { now });

        // -------------------------------------
        // 1) فیلتر ساده بر اساس userId
        // -------------------------------------
        qb.andWhere(`
        (
            c.type != 'user'
            OR 
            (c.type = 'user' AND c.userId = :uid)
        )
    `, { uid: order.userId });

        // -------------------------------------
        // 2) first_order در DB فیلتر نمی‌شود
        //    می‌گذاریم Validator هندل کند
        // -------------------------------------

        const entities = await qb.getMany();

        return entities.map(PromotionMapper.fromOrmToDomain);
    }


    async create(promotion: Promotion): Promise<Promotion> {
        const entity = PromotionMapper.fromDomainToOrm(promotion);
        const saved = await this.ormRepo.save(entity);
        return PromotionMapper.fromOrmToDomain(saved);
    }

    async update(id: number, promotion: Promotion): Promise<Promotion> {
        const entity = PromotionMapper.fromDomainToOrm(promotion);
        entity.id = id;
        const saved = await this.ormRepo.save(entity);
        return PromotionMapper.fromOrmToDomain(saved);
    }

    async delete(id: number): Promise<void> {
        await this.ormRepo.delete(id);
    }

    // ✅ این متد با nestjs-paginate کار می‌کند و سرچ/فیلتر را هندل می‌کند
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

        const items: Array<Promotion & { products: Product[]; categories: Category[]; users: User[] }> = [];

        for (const entity of result.data) {
            const domain = PromotionMapper.fromOrmToDomain(entity);

            // ---------------------------------------
            // Resolve details: products, categories, users
            // ---------------------------------------

            let productDetails: Product[] = [];
            let categoryDetails: Category[] = [];
            let userDetails: User[] = [];

            for (const c of entity.conditions) {
                // 1) PRODUCTS
                if (c.products?.length) {
                    const ids = c.products.map(p => p.productId);
                    const products = await this.productRepo.find({
                        where: { id: In(ids) },
                        relations: ['mediaPinned', 'variants'],
                    });
                    productDetails.push(...products);
                }

                // 2) CATEGORIES
                if (c.categoryIds?.length) {
                    const cats = await this.categoryRepo.find({
                        where: { id: In(c.categoryIds) }
                    });
                    categoryDetails.push(...cats);
                }

                // 3) USERS
                if (c.userId) {
                    const user = await this.userRepo.findOne({
                        where: { id: c.userId }
                    });
                    if (user) userDetails.push(user);
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

}
