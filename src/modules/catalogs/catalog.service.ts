import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
    PaginateQuery,
    paginate,
    Paginated,
} from 'nestjs-paginate';

import { Product } from '../product/entities/product.entity';
import { Category } from '../category/entities/category.entity';
import { CategoryAttribute } from '../category-attribute/entities/category-attribute.entity';

export type ParsedAttributeFilter = Record<number, number[]>;

/**
 * ورودی شبیه  "47:55,56|48:60"
 * خروجی: { 47: [55,56], 48: [60] }
 */
export function parseAttributeFilter(str?: string): ParsedAttributeFilter {
    const out: ParsedAttributeFilter = {};
    if (!str) return out;

    for (const group of str.split("|")) {
        const [aid, vals] = group.split(":");
        if (!aid || !vals) continue;
        const attrId = Number(aid);
        out[attrId] = vals.split(",").map((v) => Number(v)).filter(Boolean);
    }

    return out;
}


@Injectable()
export class CatalogService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,
        @InjectRepository(CategoryAttribute)
        private readonly catAttrRepo: Repository<CategoryAttribute>,
    ) { }

    async listWithFilters(
        query: PaginateQuery,
        categorySlug: string,
    ) {
        // 1) دسته فعلی
        const category = await this.categoryRepo.findOne({
            where: { slug: categorySlug },
        });
        if (!category) throw new NotFoundException('دسته یافت نشد');

        // 2) attribute های مربوط به دسته
        const categoryAttributes = await this.catAttrRepo.find({
            where: { category: { id: category.id } },
            relations: ['attribute', 'attribute.values'],
        });

        // 3) Query اصلی
        let qb = this.productRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.media', 'media')
            .leftJoinAndSelect('p.mediaPinned', 'mediaPinned')
            .leftJoinAndSelect('p.brand', 'brand')
            .leftJoinAndSelect('p.category', 'category')
            .where('p.categoryId = :cid', { cid: category.id });

        // ------------------ 📌 فیلترهای عمومی ------------------

        // فقط محصولات دارای تخفیف
        if (query.filter?.special_offer === 'true') {
            qb = qb.andWhere('(p.discount_amount > 0 OR p.discount_percent > 0)');
        }

        // بازه قیمت
        if (query.filter?.min_price) {
            qb = qb.andWhere('p.price >= :minPrice', {
                minPrice: Number(query.filter.min_price),
            });
        }
        if (query.filter?.max_price) {
            qb = qb.andWhere('p.price <= :maxPrice', {
                maxPrice: Number(query.filter.max_price),
            });
        }

        // برند
        if (query.filter?.brand) {
            const brands =
                typeof query.filter.brand === 'string'
                    ? query.filter.brand.split(',').map(Number)
                    : (query.filter.brand as string[]).map(Number);

            qb = qb.andWhere('p.brandId IN (:...brands)', { brands });
        }

        // زیردسته‌ها
        if (query.filter?.category) {
            const cats =
                typeof query.filter.category === 'string'
                    ? query.filter.category.split(',').map(Number)
                    : (query.filter.category as string[]).map(Number);

            qb = qb.andWhere('p.categoryId IN (:...cats)', { cats });
        }

        // ------------------ 📌 فیلترهای Attribute ------------------
        const parsedAttrs = parseAttributeFilter(query.filter?.attributes as string);

        for (const [attrIdStr, valueIds] of Object.entries(parsedAttrs)) {
            const attrId = Number(attrIdStr);

            if (!valueIds.length) continue;

            // فیلتر روی VariantAttributeValue
            qb = qb.andWhere((qb2) => {
                const sub = qb2
                    .subQuery()
                    .select('1')
                    .from('variant_attribute_values', 'vav2')
                    .innerJoin('variant_products', 'vp2', 'vp2.id = vav2.variant_id')
                    .where('vp2.product_id = p.id')
                    .andWhere('vav2.attribute_id = :aid', { aid: attrId })
                    .andWhere('vav2.value_id IN (:...vals)', { vals: valueIds });
                return `EXISTS ${sub.getQuery()}`;
            });

            // فیلتر روی ProductAttributeValue
            qb = qb.andWhere((qb2) => {
                const sub = qb2
                    .subQuery()
                    .select('1')
                    .from('product_attribute_values', 'pav2')
                    .where('pav2.product_id = p.id')
                    .andWhere('pav2.attribute_id = :aid', { aid: attrId })
                    .andWhere('pav2.value_id IN (:...vals)', { vals: valueIds });
                return `EXISTS ${sub.getQuery()}`;
            });
        }

        // ------------------ 📌 صفحه‌بندی محصولات ------------------
        const products = await paginate(query, qb, {
            sortableColumns: ['id', 'price', 'createdAt'],
            defaultSortBy: [['createdAt', 'DESC']],
            searchableColumns: ['name', 'description'],
        });

        // ------------------ 📌 Facets (فیلترهای مرتبط) ------------------

        // بازه قیمت
        const price_range = await qb
            .clone()
            .orderBy() // پاک کردن ORDER BY
            .select('MIN(p.price)', 'min')
            .addSelect('MAX(p.price)', 'max')
            .getRawOne();

        // برندها
        const brands = await qb
            .clone()
            .orderBy()
            .select('brand2.id', 'id')
            .addSelect('brand2.name', 'name')
            .addSelect('COUNT(DISTINCT p.id)', 'count')
            .innerJoin('p.brand', 'brand2')
            .groupBy('brand2.id')
            .addGroupBy('brand2.name')
            .getRawMany();

        // دسته‌ها (با children)
        const categoryIds = await qb
            .clone()
            .orderBy()
            .select('DISTINCT p.categoryId', 'id')
            .getRawMany();

        const categories = await this.categoryRepo.find({
            where: { id: In(categoryIds.map((c) => c.id)) },
            relations: ['children'],
            select: ['id', 'title', 'slug'],
        });

        // attributes (از categoryAttributes)
        const attributes = categoryAttributes.map((ca) => ({
            id: ca.attribute.id,
            name: ca.attribute.name,
            slug: ca.attribute.slug,
            type: ca.attribute.type,
            is_variant: ca.attribute.isVariant,
            values: ca.attribute.values.map((val) => ({
                id: val.id,
                value: val.value,
                display_color: val.displayColor,
                display_order: val.displayOrder,
                is_active: val.isActive,
            })),
        }));

        // ------------------ 📌 خروجی ------------------
        const filters = {
            attributes,
            generic: {
                special_offer: {
                    type: 'boolean',
                    label: 'فقط محصولات دارای تخفیف',
                },
                price_range,
                categories,
                brands,
            },
        };

        return { ...products, filters };
    }
}
