// catalog.service.ts - نسخه نهایی با کد تو که کار می‌کنه
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { DataSource } from 'typeorm';
import { CatalogQueryService } from './services/catalog-query.service';
import { CatalogCacheService } from './cache/catalog-cache.service';
import { Category } from '../category/entities/category.entity';
import { Brand } from '../brand/entities/brand.entity';
import { Product } from '../product/entities/product.entity';
import { extractCategoryIds } from './utils/category-tree.util';
import { parseAttributeFilter } from './utils/parse-attribute-filter.util';
import { CatalogMapper } from './mappers/catalog.mapper';
import { SortEnum } from './enums/sort.enum';

@Injectable()
export class CatalogService {
    private readonly logger = new Logger(CatalogService.name);

    constructor(
        private readonly queryService: CatalogQueryService,
        private readonly cacheService: CatalogCacheService,
        private readonly dataSource: DataSource,
    ) { }

    private getFinalPriceQuery(): string {
        return `CAST(p.price AS DECIMAL(15,2)) - 
                CAST(COALESCE(p.discount_amount, 0) AS DECIMAL(15,2)) - 
                (CAST(p.price AS DECIMAL(15,2)) * CAST(COALESCE(p.discount_percent, 0) AS DECIMAL(10,2)) / 100)`;
    }

    private applySorting(qb: any, sortBy: string): void {
        const sortEnum: SortEnum[] = Object.values(SortEnum);

        if (!sortEnum.includes(sortBy as SortEnum)) {
            qb.addOrderBy('p.createdAt', 'DESC');
            return;
        }

        switch (sortBy as SortEnum) {
            case SortEnum.NEWEST:
                qb.addOrderBy('p.createdAt', 'DESC');
                break;
            case SortEnum.CHEAPEST:
                qb.addSelect(this.getFinalPriceQuery(), 'final_price')
                    .orderBy('final_price', 'ASC');
                break;
            case SortEnum.BESTSELLING:
                qb.addSelect(subQuery => {
                    return subQuery
                        .select('COALESCE(SUM(oi.quantity), 0)')
                        .from('order_items', 'oi')
                        .where('oi.product_id = p.id');
                }, 'sales_count')
                    .addOrderBy('sales_count', 'DESC');
                break;
            case SortEnum.POPULAR:
                qb.addSelect(subQuery => {
                    return subQuery
                        .select('COUNT(w.id)')
                        .from('wishlists', 'w')
                        .where('w.product_id = p.id');
                }, 'wishlist_count')
                    .addOrderBy('wishlist_count', 'DESC');
                break;
            case SortEnum.EXPENSIVE:
                qb.addSelect(this.getFinalPriceQuery(), 'final_price')
                    .orderBy('final_price', 'DESC');
                break;
            case SortEnum.VISITED:
                qb.addSelect(subQuery => {
                    return subQuery
                        .select('COUNT(rv.id)')
                        .from('recent_views', 'rv')
                        .where('rv.product_id = p.id');
                }, 'view_count')
                    .addOrderBy('view_count', 'DESC');
                break;
            default:
                qb.addOrderBy('p.createdAt', 'DESC');
                break;
        }
    }

    /**
     * ✅ Helper برای اعمال فیلتر attribute
     * پشتیبانی از هم variant attributes و هم product attributes
     */
    private async applyAttributeFilter(qb: any, query: PaginateQuery): Promise<void> {
        const rawMap = parseAttributeFilter(query['filter[attributes]']);
        const attrIds = Object.keys(rawMap).map((k) => +k).filter(Boolean);

        if (attrIds.length === 0) return;

        this.logger.debug('🔍 Attribute Filter:');
        this.logger.debug(`   Input: ${query['filter[attributes]']}`);
        this.logger.debug(`   Parsed: ${JSON.stringify(rawMap)}`);

        // ✅ فقط attributeهای isPublic
        const validAttrs = await this.dataSource.query(
            `SELECT DISTINCT a.id
             FROM attributes a
             WHERE a.id IN (${attrIds.map(() => '?').join(',')})
               AND a.is_public = 1`,
            attrIds,
        );

        const validIds = validAttrs.map((a) => a.id);
        this.logger.debug(`   Valid IDs: ${JSON.stringify(validIds)}`);

        const attributeMap: Record<number, number[]> = {};
        for (const [attrId, values] of Object.entries(rawMap)) {
            if (validIds.includes(+attrId)) {
                attributeMap[+attrId] = values;
            }
        }

        this.logger.debug(`   Filter Map: ${JSON.stringify(attributeMap)}`);

        const finalAttrIds = Object.keys(attributeMap).map(k => +k);

        if (finalAttrIds.length > 0) {
            // ✅ ساخت OR parts برای استفاده در query
            const orParts: string[] = [];
            const params: any = { filter_numAttrs: finalAttrIds.length };

            finalAttrIds.forEach((attrId) => {
                const paramAttr = `filter_attr_${attrId}`;
                const paramVals = `filter_vals_${attrId}`;
                orParts.push(`(attribute_id = :${paramAttr} AND value_id IN (:...${paramVals}))`);
                params[paramAttr] = attrId;
                params[paramVals] = attributeMap[attrId];
            });

            // ✅ کد تو که کار می‌کنه - بدون تغییر!
            const existsSql = `
                EXISTS (
                    SELECT 1
                    FROM variants_product vp2
                    WHERE vp2.product_id = p.id
                    AND (
                        SELECT COUNT(DISTINCT vav2.attribute_id)
                        FROM variant_attribute_values vav2
                        WHERE vav2.variant_id = vp2.id
                        AND (${orParts.join(' OR ')})
                    ) = :filter_numAttrs
                ) OR EXISTS (
                    SELECT 1
                    FROM product_attribute_values pav2
                    WHERE pav2.product_id = p.id
                    AND (${orParts.join(' OR ')})
                    GROUP BY pav2.product_id
                    HAVING COUNT(DISTINCT pav2.attribute_id) = :filter_numAttrs
                )
            `;

            qb.andWhere(existsSql, params);

            this.logger.debug(`   ✅ Filter applied for ${finalAttrIds.length} attributes (variant + product)`);
        }
    }

    async getProductsByCategoryWithPaginate(
        slug: string,
        query: PaginateQuery,
    ): Promise<any> {
        const categoryRepo = this.dataSource.getTreeRepository(Category);
        const categoryNode = await categoryRepo.findOne({
            where: { slug },
            relations: ['children', 'parent'],
        });
        if (!categoryNode) throw new NotFoundException('دسته یافت نشد');

        const categoryTree = await categoryRepo.findDescendantsTree(categoryNode);
        const categoryIdsForProducts = extractCategoryIds(categoryTree, false);
        const categoryIdsForAttributes = extractCategoryIds(categoryTree, true);

        const qb = this.dataSource
            .getRepository(Product)
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.brand', 'b')
            .leftJoinAndSelect('p.category', 'c')
            .leftJoinAndSelect('p.mediaPinned', 'm')
            .leftJoinAndSelect('p.medias', 'me')
            .leftJoinAndSelect('p.variants', 'v')
            .leftJoinAndSelect('v.attributes', 'va')
            .leftJoinAndSelect('va.attribute', 'attr')
            .leftJoinAndSelect('va.value', 'aval')
            .where('p.is_active = :active', { active: true })
            .andWhere('p.is_visible = :visible', { visible: true })
            .andWhere('p.category_id IN (:...ids)', { ids: categoryIdsForProducts });

        if (query['filter[brand]']) {
            const brandIds = Array.isArray(query['filter[brand]'])
                ? query['filter[brand]']
                : query['filter[brand]'].split(',').map((id: string) => parseInt(id.trim(), 10));
            qb.andWhere('b.id IN (:...brandIds)', { brandIds });
        }

        if (query['filter[price_min]']) {
            qb.andWhere('(p.price - COALESCE(p.discount_amount,0)) >= :min', {
                min: query['filter[price_min]']
            });
        }
        if (query['filter[price_max]']) {
            qb.andWhere('(p.price - COALESCE(p.discount_amount,0)) <= :max', {
                max: query['filter[price_max]']
            });
        }

        if (query['filter[special_offer]'] === '1' || query['filter[special_offer]'] === 'true') {
            qb.andWhere('p.is_featured > 0');
        }

        if (query['filter[discounted]'] === '1' || query['filter[discounted]'] === 'true') {
            qb.andWhere('(p.discount_amount > 0 OR p.discount_percent > 0)');
        }

        if (query['filter[same_day_shipping]'] === '1' || query['filter[same_day_shipping]'] === 'true') {
            qb.andWhere('p.is_same_day_shipping > 0');
        }

        if (query['filter[in_stock]'] === '1' || query['filter[in_stock]'] === 'true') {
            qb.andWhere('p.stock > 0');
        }

        if (query.sortBy && typeof query.sortBy === 'string') {
            this.applySorting(qb, query.sortBy);
        }

        // ✅ فیلتر attribute (variant + product)
        await this.applyAttributeFilter(qb, query);

        const paginated = await paginate(query, qb, {
            sortableColumns: ['id', 'price', 'createdAt'],
            searchableColumns: ['name', 'description'],
            defaultSortBy: [['id', 'DESC']],
            defaultLimit: query.limit || 20,
            maxLimit: 100,
        });

        const products = paginated.data.map(CatalogMapper.toProduct);
        const filters = await this.queryService.buildFilters(categoryNode, categoryIdsForAttributes);

        return {
            items_count: paginated.meta.totalItems,
            data: products,
            meta: paginated.meta,
            filters,
        };
    }

    async getAllProducts(query: PaginateQuery): Promise<any> {
        const qb = this.dataSource
            .getRepository(Product)
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.brand', 'b')
            .leftJoinAndSelect('p.category', 'c')
            .leftJoinAndSelect('p.mediaPinned', 'm')
            .leftJoinAndSelect('p.medias', 'me')
            .leftJoinAndSelect('p.variants', 'v')
            .leftJoinAndSelect('v.attributes', 'va')
            .leftJoinAndSelect('va.attribute', 'attr')
            .leftJoinAndSelect('va.value', 'aval')
            .where('p.is_active = :active', { active: true })
            .andWhere('p.is_visible = :visible', { visible: true });

        if (query['filter[brand]']) {
            const brandIds = Array.isArray(query['filter[brand]'])
                ? query['filter[brand]']
                : query['filter[brand]'].split(',').map((id: string) => parseInt(id.trim(), 10));
            qb.andWhere('b.id IN (:...brandIds)', { brandIds });
        }

        if (query['filter[price_min]']) {
            qb.andWhere('(p.price - COALESCE(p.discount_amount,0)) >= :min', {
                min: query['filter[price_min]']
            });
        }
        if (query['filter[price_max]']) {
            qb.andWhere('(p.price - COALESCE(p.discount_amount,0)) <= :max', {
                max: query['filter[price_max]']
            });
        }

        if (query['filter[special_offer]'] === '1' || query['filter[special_offer]'] === 'true') {
            qb.andWhere('p.is_featured > 0');
        }

        if (query['filter[discounted]'] === '1' || query['filter[discounted]'] === 'true') {
            qb.andWhere('(p.discount_amount > 0 OR p.discount_percent > 0)');
        }

        if (query['filter[same_day_shipping]'] === '1' || query['filter[same_day_shipping]'] === 'true') {
            qb.andWhere('p.is_same_day_shipping > 0');
        }

        if (query['filter[in_stock]'] === '1' || query['filter[in_stock]'] === 'true') {
            qb.andWhere('p.stock > 0');
        }

        if (query.sortBy && typeof query.sortBy === 'string') {
            this.applySorting(qb, query.sortBy);
        }

        // ✅ فیلتر attribute (variant + product)
        await this.applyAttributeFilter(qb, query);

        const paginated = await paginate(query, qb, {
            sortableColumns: ['id', 'price', 'createdAt'],
            searchableColumns: ['name', 'description'],
            defaultSortBy: [['id', 'DESC']],
            defaultLimit: query.limit || 20,
            maxLimit: 100,
        });

        const products = paginated.data.map(CatalogMapper.toProduct);
        const filters = await this.queryService.buildFiltersForAllProducts();

        return {
            items_count: paginated.meta.totalItems,
            data: products,
            meta: paginated.meta,
            filters,
        };
    }

    async getProductsByBrandWithPaginate(slug: string, query: PaginateQuery): Promise<any> {
        const brandRepo = this.dataSource.getRepository(Brand);
        const brand = await brandRepo.findOne({ where: { slug } });
        if (!brand) throw new NotFoundException('برند یافت نشد');

        const qb = this.dataSource
            .getRepository(Product)
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.brand', 'b')
            .leftJoinAndSelect('p.category', 'c')
            .leftJoinAndSelect('p.mediaPinned', 'm')
            .leftJoinAndSelect('p.medias', 'me')
            .leftJoinAndSelect('p.variants', 'v')
            .leftJoinAndSelect('v.attributes', 'va')
            .leftJoinAndSelect('va.attribute', 'attr')
            .leftJoinAndSelect('va.value', 'aval')
            .where('p.is_active = :active', { active: true })
            .andWhere('p.is_visible = :visible', { visible: true })
            .andWhere('p.brand_id = :brandId', { brandId: brand.id });

        if (query['filter[category]']) {
            const categoryIds = Array.isArray(query['filter[category]'])
                ? query['filter[category]']
                : query['filter[category]'].split(',').map((id: string) => parseInt(id.trim(), 10));
            qb.andWhere('c.id IN (:...categoryIds)', { categoryIds });
        }

        if (query['filter[price_min]']) {
            qb.andWhere('(p.price - COALESCE(p.discount_amount,0)) >= :min', {
                min: query['filter[price_min]']
            });
        }
        if (query['filter[price_max]']) {
            qb.andWhere('(p.price - COALESCE(p.discount_amount,0)) <= :max', {
                max: query['filter[price_max]']
            });
        }

        if (query['filter[special_offer]'] === '1' || query['filter[special_offer]'] === 'true') {
            qb.andWhere('p.is_featured > 0');
        }

        if (query['filter[discounted]'] === '1' || query['filter[discounted]'] === 'true') {
            qb.andWhere('(p.discount_amount > 0 OR p.discount_percent > 0)');
        }

        if (query['filter[same_day_shipping]'] === '1' || query['filter[same_day_shipping]'] === 'true') {
            qb.andWhere('p.is_same_day_shipping > 0');
        }

        if (query['filter[in_stock]'] === '1' || query['filter[in_stock]'] === 'true') {
            qb.andWhere('p.stock > 0');
        }

        if (query.sortBy && typeof query.sortBy === 'string') {
            this.applySorting(qb, query.sortBy);
        }

        // ✅ فیلتر attribute (variant + product)
        await this.applyAttributeFilter(qb, query);

        const paginated = await paginate(query, qb, {
            sortableColumns: ['id', 'price', 'createdAt'],
            searchableColumns: ['name', 'description'],
            defaultSortBy: [['id', 'DESC']],
            defaultLimit: query.limit || 20,
            maxLimit: 100,
        });

        const products = paginated.data.map(CatalogMapper.toProduct);
        const filters = await this.queryService.buildFiltersForBrand(brand.id);

        return {
            brand: {
                id: brand.id,
                name: brand.name,
                slug: brand.slug,
                logo: brand.logo,
            },
            items_count: paginated.meta.totalItems,
            data: products,
            meta: paginated.meta,
            filters,
        };
    }
}