import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { DataSource } from 'typeorm';
import { CatalogQueryService } from './services/catalog-query.service';
import { CatalogCacheService } from './services/catalog-cache.service';
import { Category } from '../category/entities/category.entity';
import { extractCategoryIds } from './utils/category-tree.util';
import { Product } from '../product/entities/product.entity';
import { CatalogMapper } from './mappers/catalog.mapper';
import { parseAttributeFilter } from './utils/parse-attribute-filter.util';
import { Attribute } from '../attributes/attribute/entities/attribute.entity';

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
        // ۲. آماده‌سازی Query پایه محصولات
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
            .andWhere('p.category_id IN (:...ids)', { ids: categoryIds });

        // ------------------------------------------
        // ۳. فیلتر برند
        // ------------------------------------------
        if (query.filter?.brand) {
            qb.andWhere('b.id = :brandId', { brandId: query.filter.brand });
        }

        // ------------------------------------------
        // ۴. فیلتر بازه قیمت
        // ------------------------------------------
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

        // ------------------------------------------
        // ۵. محصولات دارای تخفیف
        // ------------------------------------------
        if (query.filter?.special_offer === 'true') {
            qb.andWhere('(p.discount_amount > 0 OR p.discount_percent > 0)');
        }

        // ------------------------------------------
        // ۶. فیلتر بر اساس ویژگی‌ها (Attribute/Value)
        // ------------------------------------------
        const rawMap = parseAttributeFilter(query['filter[attributes]']);
        const attrIds = Object.keys(rawMap).map((k) => +k).filter(Boolean);

        if (attrIds.length > 0) {
            // فقط attributeهای مجاز در گروه‌های همین کتگوری
            // ✅ دریافت attribute‌های مجاز از category_attribute
            const validAttributeIds = await this.dataSource
                .createQueryBuilder()
                .select('ca.attribute_id', 'id')
                .from('category_attributes', 'ca')
                .where('ca.category_id IN (:...categoryIds)', { categoryIds })
                .getRawMany();

            const validIds = validAttributeIds.map(a => a.id);
            const attributeMap: Record<number, number[]> = {};
            for (const [attrId, values] of Object.entries(rawMap)) {
                if (validIds.includes(+attrId)) {
                    attributeMap[+attrId] = values;
                }
            }

            // شرط فیلتر ساده‌تر و دقیق‌تر (بدون HAVING)
            for (const [attrId, valueIds] of Object.entries(attributeMap)) {
                qb.andWhere(
                    `EXISTS (
                        SELECT 1 FROM variant_attribute_values vav
                        JOIN variants_product vp ON vp.id = vav.variant_id
                        WHERE vp.product_id = p.id
                        AND vav.attribute_id = :attr_${attrId}
                        AND vav.value_id IN (:...vals_${attrId})
                    )`,
                    {
                        [`attr_${attrId}`]: +attrId,
                        [`vals_${attrId}`]: valueIds,
                    },
                );
            }
        }

        // ------------------------------------------
        // ۷. اجرای paginate
        // ------------------------------------------
        const paginated = await paginate(query, qb, {
            sortableColumns: ['id', 'price', 'createdAt'],
            searchableColumns: ['name', 'description'],
            defaultSortBy: [['id', 'DESC']],
            relations,
            defaultLimit: 20,
            maxLimit: 100,
        });

        // ------------------------------------------
        // ۸. تبدیل داده‌ها به مدل خروجی
        // ------------------------------------------
        const products = paginated.data.map(CatalogMapper.toProduct);

        // ------------------------------------------
        // ۹. دریافت فیلترهای سایدبار (از QueryService)
        // ------------------------------------------
        const filters = await this.queryService.buildFilters(categoryTree, categoryIds);

        // ------------------------------------------
        // 🔟 ساخت خروجی و کش
        // ------------------------------------------
        const result = {
            data: products,
            meta: paginated.meta,
            filters,
        };

        await this.cacheService.set(cacheKey, result, 300);
        return result;
    }
}
