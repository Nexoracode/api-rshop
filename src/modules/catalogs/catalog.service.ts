import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { DataSource } from 'typeorm';
import { CatalogQueryService } from './services/catalog-query.service';
import { CatalogCacheService } from './services/catalog-cache.service';
import { Category } from '../category/entities/category.entity';
import { extractCategoryIds } from './utils/category-tree.util';
import { Product } from '../product/entities/product.entity';
import { CatalogMapper } from './mappers/catalog.mapper';

@Injectable()
export class CatalogService {
    constructor(
        private readonly queryService: CatalogQueryService,
        private readonly cacheService: CatalogCacheService,
        private readonly dataSource: DataSource,
    ) { }

    // 🛍️ محصولات دسته همراه با paginate و فیلترها
    async getProductsByCategoryWithPaginate(
        slug: string,
        query: PaginateQuery,
    ): Promise<any> {
        const cacheKey = `catalog:category:${slug}:${JSON.stringify(query)}`;
        const cached = await this.cacheService.get<any>(cacheKey);
        if (cached) return cached;

        // ------------------------------------------
        // ۱. گرفتن درخت دسته و id زیرمجموعه‌ها
        // ------------------------------------------
        const categoryRepo = this.dataSource.getTreeRepository(Category);
        const categoryNode = await categoryRepo.findOne({
            where: { slug },
            relations: ['children.parent'],
        });
        if (!categoryNode) throw new NotFoundException('دسته یافت نشد');
        const categoryTree = await categoryRepo.findDescendantsTree(categoryNode);
        const categoryIds = extractCategoryIds(categoryTree);

        // ------------------------------------------
        // ۲. Query اصلی محصولات
        // ------------------------------------------
        const qb = this.dataSource
            .getRepository(Product)
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.brand', 'b')
            .leftJoinAndSelect('p.category', 'c')
            .leftJoinAndSelect('p.mediaPinned', 'm')
            .leftJoinAndSelect('p.medias', 'me')
            .where('p.is_active = true')
            .andWhere('p.is_visible = true')
            // .andWhere('me.type = image')
            .andWhere('p.category_id IN (:...ids)', { ids: categoryIds });

        // فیلتر برند
        if (query.filter?.brand) {
            qb.andWhere('b.id = :brandId', { brandId: query.filter.brand });
        }

        // فیلتر بازه قیمت
        if (query.filter?.price_min) {
            qb.andWhere('(p.price - COALESCE(p.discount_amount,0)) >= :min', {
                min: query.filter.price_min,
            });
        }
        if (query.filter?.price_max) {
            qb.andWhere('(p.price - COALESCE(p.discount_amount,0)) <= :max', {
                max: query.filter.price_max,
            });
        }

        // محصولات دارای تخفیف
        if (query.filter?.special_offer === 'true') {
            qb.andWhere('p.discount_amount > 0');
        }

        // ------------------------------------------
        // ۳. اجرای paginate
        // ------------------------------------------
        const paginated = await paginate(query, qb, {
            sortableColumns: ['id', 'price', 'createdAt'],
            searchableColumns: ['name', 'description'],
            defaultSortBy: [['id', 'DESC']],
            defaultLimit: 20,
            maxLimit: 100,
        });

        // ------------------------------------------
        // ۴. تبدیل داده‌ها به مدل خروجی
        // ------------------------------------------
        const products = paginated.data.map(CatalogMapper.toProduct);

        // ------------------------------------------
        // ۵. دریافت فیلترها (از QueryService)
        // ------------------------------------------
        const filters = await this.queryService.buildFilters(categoryTree, categoryIds);

        // ------------------------------------------
        // ۶. ساخت خروجی سفارشی برای فرانت
        // ------------------------------------------
        const result = {
            data: products,
            meta: paginated.meta,
            filters,
        };

        // cache کردن خروجی
        await this.cacheService.set(cacheKey, result, 300);

        return result;
    }
}
