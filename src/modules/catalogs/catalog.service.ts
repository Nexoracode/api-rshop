import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, TreeRepository, DataSource } from 'typeorm';
import {
    PaginateQuery,
    paginate,
    Paginated,
    FilterOperator,
} from 'nestjs-paginate';

import { Product } from '../product/entities/product.entity';
import { Category } from '../category/entities/category.entity';
import { CategoryAttribute } from '../category-attribute/entities/category-attribute.entity';
import { parseAttributeFilter } from './utils/parse-attribute-filter.util';

@Injectable()
export class CatalogService {
    private treeCatRepo: TreeRepository<Category>
    constructor(
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,
        @InjectRepository(CategoryAttribute)
        private readonly catAttrRepo: Repository<CategoryAttribute>,
        private dataSource: DataSource,
    ) {
        this.treeCatRepo = this.dataSource.getTreeRepository(Category);
    }

    async listWithFilters(
        query: PaginateQuery,
        categorySlug: string,
    ): Promise<Paginated<Product> & { filters: any }> {

        const findByIdWithDescendants = async (slug: string) => {
            const node = await this.treeCatRepo.findOne({ where: { slug }, relations: ['parent', 'children.parent'] })
            if (!node) throw new NotFoundException(`دسته مورد نظر یافت نشد.`);
            const category = await this.treeCatRepo.findDescendantsTree(node,);
            return category;
        }

        const category = await findByIdWithDescendants(categorySlug);
        if (!category) throw new NotFoundException('دسته یافت نشد');

        // 2) attribute های مربوط به دسته
        const categoryAttributes = await this.catAttrRepo.find({
            where: { category: { id: category.id } },
            relations: ['attribute', 'attribute.values'],
        });

        // 3) paginate برای فیلترهای ساده
        let products = await paginate(query, this.productRepo, {
            relations: ['brand', 'category', 'medias', 'mediaPinned'],
            sortableColumns: ['id', 'price', 'createdAt'],
            defaultSortBy: [['createdAt', 'DESC']],
            searchableColumns: ['name', 'description'],
            filterableColumns: {
                price: [FilterOperator.GTE, FilterOperator.LTE],
                discountAmount: [FilterOperator.GT, FilterOperator.EQ],
                discountPercent: [FilterOperator.GT, FilterOperator.EQ],
                brandId: [FilterOperator.IN, FilterOperator.EQ],
                categoryId: [FilterOperator.IN, FilterOperator.EQ],
            },
            where: { categoryId: category.id },
        });

        // 4) فیلتر attributeها (به صورت خام از query)
        const rawAttributes = (query as any)['filter[attributes]'] || (query as any).attributes;
        const parsedAttrs = parseAttributeFilter(rawAttributes);

        if (Object.keys(parsedAttrs).length > 0) {
            const qb = this.productRepo
                .createQueryBuilder('p')
                .where('p.id IN (:...ids)', {
                    ids: products.data.map((p) => p.id),
                });

            for (const [attrIdStr, valueIds] of Object.entries(parsedAttrs)) {
                const attrId = +attrIdStr;

                qb.andWhere((qb2) => {
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

                qb.andWhere((qb2) => {
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

            const ids = (await qb.getMany()).map((p) => p.id);
            products.data = products.data.filter((p) => ids.includes(p.id));
            products.meta.totalItems = products.data.length;
            products.meta.totalPages = Math.ceil(
                products.meta.totalItems / products.meta.itemsPerPage,
            );
        }

        // 5) ساخت خروجی filters برای نمایش در فرانت
        const filters = {
            attributes: categoryAttributes.map((ca) => ({
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
            })),
            generic: {
                special_offer: {
                    type: 'boolean',
                    label: 'فقط محصولات دارای تخفیف',
                },
                // برای قیمت میشه از min/max روی محصولات موجود استفاده کرد
                price_range: {
                    min: Math.min(...products.data.map((p) => +p.price || 0)),
                    max: Math.max(...products.data.map((p) => +p.price || 0)),
                },
                brands: products.data
                    .map((p) => p.brand)
                    .filter(Boolean)
                    .reduce((acc, brand) => {
                        if (!acc.find((b) => b.id === brand.id)) acc.push(brand);
                        return acc;
                    }, [] as any[]),
                categories: [
                    {
                        id: category.id,
                        title: category.title,
                        slug: category.slug,
                        children: category.children || [],
                    },
                ],
            },
        };

        return { ...products, filters };
    }
}
