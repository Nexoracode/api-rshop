// catalog.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginateQuery, PaginationType, paginate } from 'nestjs-paginate';
import { DataSource } from 'typeorm';
import { CatalogQueryService } from './services/catalog-query.service';
import { CatalogCacheService } from './services/catalog-cache.service';
import { Category } from '../category/entities/category.entity';
import { Product } from '../product/entities/product.entity';
import { extractCategoryIds } from './utils/category-tree.util';
import { parseAttributeFilter } from './utils/parse-attribute-filter.util';
import { CatalogMapper } from './mappers/catalog.mapper';
import { SortEnum } from './enums/sort.enum';

const relations = [
    'brand',
    'category',
    'mediaPinned',
    'medias',
    'variants',
    'variants.attributes',
    'variants.attributes.attribute',
    'variants.attributes.value',
];

@Injectable()
export class CatalogService {
    constructor(
        private readonly queryService: CatalogQueryService,
        private readonly cacheService: CatalogCacheService,
        private readonly dataSource: DataSource,
    ) { }

    async getProductsByCategoryWithPaginate(
        slug: string,
        query: PaginateQuery,
    ): Promise<any> {
        // ------------------------------------------
        // ۱. بررسی کش
        // ------------------------------------------
        const cacheKey = `catalog:category:${slug}:${JSON.stringify(query)}`;
        const cached = await this.cacheService.get<any>(cacheKey);
        if (cached) return cached;

        // ------------------------------------------
        // ۲. یافتن دسته فعلی و ساخت مسیر
        // ------------------------------------------
        const categoryRepo = this.dataSource.getTreeRepository(Category);
        const categoryNode = await categoryRepo.findOne({
            where: { slug },
            relations: ['children', 'parent'],
        });
        if (!categoryNode) throw new NotFoundException('دسته یافت نشد');

        // درخت کامل زیرمجموعه برای محصولات
        const categoryTree = await categoryRepo.findDescendantsTree(categoryNode);

        // ✅ محصولات فقط از دسته فعلی و زیرمجموعه‌اش
        const categoryIdsForProducts = extractCategoryIds(categoryTree, false);

        // ✅ فیلتر attribute از والدها و خودش
        const categoryIdsForAttributes = extractCategoryIds(categoryTree, true);

        // ------------------------------------------
        // ۳. ساخت query پایه
        // ------------------------------------------
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
            .where('p.is_active = true')
            .andWhere('p.is_visible = true')
            .andWhere('p.category_id IN (:...ids)', { ids: categoryIdsForProducts });

        // ------------------------------------------
        // ۴. فیلتر برند
        // ------------------------------------------
        if (query['filter[brand]']) {
            const brandIds = Array.isArray(query['filter[brand]'])
                ? query['filter[brand]']
                : query['filter[brand]'].split(',').map((id: string) => parseInt(id.trim(), 10));

            qb.andWhere('b.id IN (:...brandIds)', { brandIds });
        }

        // ------------------------------------------
        // ۵. بازه قیمت
        // ------------------------------------------
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

        // ------------------------------------------
        // ۶. محصولات پیشنهاد ویژه
        // ------------------------------------------
        if (query['filter[special_offer]'] === '1') {
            qb.andWhere('(p.is_featured > 0)');
        }

        // ------------------------------------------
        // 7. محصولات دارای تخفیف
        // ------------------------------------------
        if (query['filter[discounted]'] === '1') {
            qb.andWhere('(p.discount_amount > 0 OR p.discount_percent > 0)');
        }

        // ------------------------------------------
        // 7. محصولات ارسال امروز
        // ------------------------------------------

        if (query['filter[same_day_shipping]'] === '1') {
            qb.andWhere('(p.is_same_day_shipping > 0)');
        }

        // ------------------------------------------
        // 7. محصولات ارسال موجود در انبار
        // ------------------------------------------

        if (query['filter[in_stock]'] === '1') {
            qb.andWhere('(p.stock > 0)');
        }

        // Support sorting by stock descending when sortBy is provided as a string ('stock_desc')
        // or as an array of [column, direction] pairs (e.g. [['stock','DESC']])

        if (query.sortBy) {
            const sortEnum: SortEnum[] = Object.values(SortEnum);
            if (typeof query.sortBy === 'string' && sortEnum.includes(query.sortBy as SortEnum)) {
                switch (query.sortBy) {
                    case SortEnum.NEWEST:
                        qb.addOrderBy('p.createdAt', 'DESC');
                        break;

                    case SortEnum.CHEAPEST:
                        qb.addOrderBy(
                            "CAST(p.price AS DECIMAL(15,2)) - CAST(COALESCE(p.discount_amount, '0') AS DECIMAL(15,2)) - (CAST(p.price AS DECIMAL(15,2)) * CAST(COALESCE(p.discount_percent, '0') AS DECIMAL(10,2)) / 100)",
                            "ASC"
                        );

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
                        qb.addOrderBy(
                            "CAST(p.price AS DECIMAL(15,2)) - CAST(COALESCE(p.discount_amount, '0') AS DECIMAL(15,2)) - (CAST(p.price AS DECIMAL(15,2)) * CAST(COALESCE(p.discount_percent, '0') AS DECIMAL(10,2)) / 100)",
                            "DESC"
                        );
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
                        qb.addOrderBy('p.created_at', 'DESC');  // Default sorting by ID
                        break;
                }
                console.log('🔹 sortBy:', query.sortBy);
            }
        }


        // ------------------------------------------
        // 8. فیلتر attributeها
        // ------------------------------------------
        const rawMap = parseAttributeFilter(query['filter[attributes]']);
        const attrIds = Object.keys(rawMap).map((k) => +k).filter(Boolean);

        if (attrIds.length > 0) {
            // فقط attributeهای مجاز از دسته و والدها
            const validAttrs = await this.dataSource.query(
                `
          SELECT DISTINCT ca.attribute_id as id
          FROM category_attributes ca
          INNER JOIN attributes a ON a.id = ca.attribute_id
          WHERE ca.category_id IN (${categoryIdsForAttributes.map(() => '?').join(',')})
            AND a.is_public = 1
        `,
                categoryIdsForAttributes,
            );

            const validIds = validAttrs.map((a) => a.id);
            const attributeMap: Record<number, number[]> = {};
            for (const [attrId, values] of Object.entries(rawMap)) {
                if (validIds.includes(+attrId)) attributeMap[+attrId] = values;
            }

            // 🚫 فقط محصولاتی که variant دارند در نظر بگیر
            qb.andWhere(`EXISTS (SELECT 1 FROM variants_product vp WHERE vp.product_id = p.id)`);

            // شرط دقیق برای match attribute-value در variantها
            for (const [attrId, valueIds] of Object.entries(attributeMap)) {
                qb.andWhere(
                    `
            EXISTS (
              SELECT 1 FROM variant_attribute_values vav
              JOIN variants_product vp ON vp.id = vav.variant_id
              WHERE vp.product_id = p.id
                AND vav.attribute_id = :attr_${attrId}
                AND vav.value_id IN (:...vals_${attrId})
            )
          `,
                    {
                        [`attr_${attrId}`]: +attrId,
                        [`vals_${attrId}`]: valueIds,
                    },
                );
            }
        }

        // ------------------------------------------
        // 9. اجرای paginate
        // ------------------------------------------
        const paginated = await paginate(query, qb, {
            sortableColumns: ['id', 'price', 'createdAt'],
            searchableColumns: ['name', 'description'],
            defaultSortBy: [['id', 'DESC']],
            // return result for all page for test
            // paginationType: PaginationType.LIMIT_AND_OFFSET,
            relations,
            defaultLimit: query.limit,
            maxLimit: 100,
        });

        // ------------------------------------------
        // 10. مپ محصولات
        // ------------------------------------------
        const products = paginated.data.map(CatalogMapper.toProduct);

        // ------------------------------------------
        // 🔟 فیلترها (شامل breadcrumb + tree)
        // ------------------------------------------
        const filters = await this.queryService.buildFilters(categoryNode, categoryIdsForAttributes);

        // ------------------------------------------
        // ✅ خروجی نهایی
        // ------------------------------------------
        const result = {
            // data: { count: products.length, products },
            items_count: paginated.meta.totalItems,
            data: products,
            meta: paginated.meta,
            filters,
        };

        await this.cacheService.set(cacheKey, result, 300);
        return result;
    }
}
