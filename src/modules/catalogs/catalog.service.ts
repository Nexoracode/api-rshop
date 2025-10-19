import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository, DataSource, In } from 'typeorm';
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

interface CatalogQuery extends PaginateQuery {
    'filter[attributes]'?: string;
}

interface PriceRange {
    min: number;
    max: number;
}

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
        query: CatalogQuery,
        categorySlug: string,
    ): Promise<Paginated<Product> & { filters: any }> {

        // 1) Find category with descendants
        const category = await this.findBySlugWithDescendants(categorySlug);
        if (!category) {
            throw new NotFoundException('دسته یافت نشد');
        }

        // 2) Get all category IDs (including descendants)
        const categoryIds = this.extractCategoryIds(category);

        // 3) Get category attributes for filters
        const categoryAttributes = await this.catAttrRepo.find({
            where: { category: { id: category.id } },
            relations: ['attribute', 'attribute.values'],
        });

        // 4) Base pagination query
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
            where: { categoryId: In(categoryIds) },
        });

        // 5) Apply attribute filters if provided
        const rawAttributes = query['filter[attributes]'];
        const parsedAttrs = parseAttributeFilter(rawAttributes);

        if (Object.keys(parsedAttrs).length > 0) {
            products = await this.applyAttributeFilters(products, parsedAttrs);
        }

        // 6) Get price range from database (more efficient)
        const priceRange = await this.getPriceRange(categoryIds);

        // 7) Build filters for frontend
        const filters = this.buildFilters(categoryAttributes, products, category, priceRange);

        return { ...products, filters };
    }

    private async findBySlugWithDescendants(slug: string): Promise<Category | null> {
        const node = await this.treeCatRepo.findOne({
            where: { slug },
            relations: ['parent', 'children.parent']
        });

        if (!node) {
            throw new NotFoundException(`دسته مورد نظر یافت نشد.`);
        }

        const category = await this.treeCatRepo.findDescendantsTree(node);
        return category;
    }

    private extractCategoryIds(category: Category): number[] {
        const ids: number[] = [category.id];

        if (category.children && category.children.length > 0) {
            category.children.forEach(child => {
                ids.push(...this.extractCategoryIds(child));
            });
        }

        return ids;
    }

    private async getPriceRange(categoryIds: number[]): Promise<PriceRange> {
        const result = await this.productRepo
            .createQueryBuilder('p')
            .select('MIN(CAST(p.price AS DECIMAL))', 'min')
            .addSelect('MAX(CAST(p.price AS DECIMAL))', 'max')
            .where('p.categoryId IN (:...categoryIds)', { categoryIds })
            .getRawOne();

        return {
            min: parseFloat(result?.min || '0'),
            max: parseFloat(result?.max || '0'),
        };
    }

    private async applyAttributeFilters(
        products: Paginated<Product>,
        parsedAttrs: Record<number, number[]>
    ): Promise<Paginated<Product>> {
        const productIds = products.data.map(p => p.id);

        if (productIds.length === 0) {
            return products;
        }

        const qb = this.productRepo
            .createQueryBuilder('p')
            .where('p.id IN (:...ids)', { ids: productIds });

        for (const [attrIdStr, valueIds] of Object.entries(parsedAttrs)) {
            const attrId = +attrIdStr;

            // Apply OR logic: product should have attribute in either variant OR product attributes
            qb.andWhere((qb2) => {
                const variantSub = qb2
                    .subQuery()
                    .select('1')
                    .from('variant_attribute_values', 'vav')
                    .innerJoin('variant_products', 'vp', 'vp.id = vav.variant_id')
                    .where('vp.product_id = p.id')
                    .andWhere('vav.attribute_id = :aid', { aid: attrId })
                    .andWhere('vav.value_id IN (:...vals)', { vals: valueIds });

                const productSub = qb2
                    .subQuery()
                    .select('1')
                    .from('product_attribute_values', 'pav')
                    .where('pav.product_id = p.id')
                    .andWhere('pav.attribute_id = :aid', { aid: attrId })
                    .andWhere('pav.value_id IN (:...vals)', { vals: valueIds });

                return `(EXISTS ${variantSub.getQuery()} OR EXISTS ${productSub.getQuery()})`;
            });
        }

        const filteredProducts = await qb.getMany();
        const filteredIds = filteredProducts.map(p => p.id);

        products.data = products.data.filter(p => filteredIds.includes(p.id));
        products.meta.totalItems = products.data.length;
        products.meta.totalPages = Math.ceil(
            products.meta.totalItems / products.meta.itemsPerPage,
        );

        return products;
    }

    private buildFilters(
        categoryAttributes: CategoryAttribute[],
        products: Paginated<Product>,
        category: Category,
        priceRange: PriceRange
    ) {
        // Get unique brands from products
        const uniqueBrands = products.data
            .map(p => p.brand)
            .filter(Boolean)
            .reduce((acc, brand) => {
                if (!acc.find(b => b.id === brand.id)) {
                    acc.push({
                        id: brand.id,
                        name: brand.name,
                        slug: brand.slug,
                    });
                }
                return acc;
            }, [] as any[]);

        return {
            attributes: categoryAttributes.map(ca => ({
                id: ca.attribute.id,
                name: ca.attribute.name,
                slug: ca.attribute.slug,
                type: ca.attribute.type,
                is_variant: ca.attribute.isVariant,
                values: ca.attribute.values
                    .filter(val => val.isActive)
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map(val => ({
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
                price_range: {
                    min: priceRange.min,
                    max: priceRange.max,
                },
                brands: uniqueBrands,
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
    }
}
