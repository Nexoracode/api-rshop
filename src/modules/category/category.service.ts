import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository, TreeRepository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryMapper } from './mappers/category.mapper';
import { ICategoryResponse, ICategoryResponseSite } from './interfaces/category.response.interface';
import { ICategoryService } from './interfaces/category.service.interface';
import { Media } from '../media/entities/image.entity';
import { runInTransaction } from 'src/common/helpers/transaction.helper';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FilterOperator, paginate, PaginateConfig, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CategoryCacheService } from './cache/category-cache.service';
import { CatalogCacheService } from '../catalogs/cache';

@Injectable()
export class CategoryService implements ICategoryService {
    private treeCatRepo: TreeRepository<Category>

    constructor(
        private dataSource: DataSource,
        private readonly cacheService: CategoryCacheService, // ✅ اضافه شد
        private readonly catalogCatchService: CatalogCacheService, // ✅ اضافه شد
    ) {
        this.treeCatRepo = this.dataSource.getTreeRepository(Category);
    }

    async findOne(id: number) {
        const category = await this.treeCatRepo.findOne({ where: { id } });
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }

    async findOneSlug(slug: string) {
        const cached = await this.cacheService.getCategoryBySlug(slug);
        if (cached) {
            console.log(`✅ Category slgu ${slug} for site to cache`);
            return cached as any;
        }
        const node = await this.treeCatRepo.findOne({
            where: { slug },
            relations: ['parent']
        })
        if (!node) throw new NotFoundException(`دسته مورد نظر یافت نشد.`);

        const category = await this.treeCatRepo.findDescendantsTree(node, {
            relations: ['parent']
        });
        await this.cacheService.setCategoryBySlug(slug, category);
        console.log(`💾 Category slug ${slug} for site ذخیره شد در cache`);
        return category;
    }

    async findBySlugWithParents(slug: string): Promise<{
        category: {
            id: number;
            title: string;
            slug: string;
            description?: string | null;
            level: number;
            isActive: boolean;
            media: any;
        };
        parents?: Array<{
            id: number;
            title: string;
            slug: string;
            description: string | null;
            level: number;
        }>;
        breadcrumb: Array<{
            id: number;
            title: string;
            slug: string;
            level: number;
        }>;
    }> {
        const category = await this.treeCatRepo.findOne({
            where: { slug },
            relations: ['media']
        });

        if (!category) {
            throw new NotFoundException(`دسته‌بندی با slug "${slug}" یافت نشد.`);
        }

        const ancestors = await this.treeCatRepo.findAncestors(category);
        const parents = ancestors.filter(ancestor => ancestor.id !== category.id);
        parents.sort((a, b) => a.level - b.level);

        const breadcrumb = [
            ...parents.map(p => ({
                id: p.id,
                title: p.title,
                slug: p.slug,
                level: p.level,
            })),
            {
                id: category.id,
                title: category.title,
                slug: category.slug,
                level: category.level,
            }
        ];

        return {
            category: {
                id: category.id,
                title: category.title,
                slug: category.slug,
                description: category.description,
                level: category.level,
                isActive: category.isActive,
                media: category.media,
            },
            parents: parents.map(p => ({
                id: p.id,
                title: p.title,
                slug: p.slug,
                description: p.description ?? null,
                level: p.level,
            })),
            breadcrumb,
        };
    }

    async findByIdWithParents(id: number): Promise<{
        category: {
            id: number;
            title: string;
            slug: string;
            description?: string | null;
            level: number;
            isActive: boolean;
            media: any;
        };
        parents: Array<{
            id: number;
            title: string;
            slug: string;
            description?: string | null;
            level: number;
        }>;
        breadcrumb: Array<{
            id: number;
            title: string;
            slug: string;
            level: number;
        }>;
    }> {
        const category = await this.treeCatRepo.findOne({
            where: { id },
            relations: ['media']
        });

        if (!category) {
            throw new NotFoundException(`دسته‌بندی با ID ${id} یافت نشد.`);
        }

        const ancestors = await this.treeCatRepo.findAncestors(category);
        const parents = ancestors.filter(ancestor => ancestor.id !== category.id);
        parents.sort((a, b) => a.level - b.level);

        const breadcrumb = [
            ...parents.map(p => ({
                id: p.id,
                title: p.title,
                slug: p.slug,
                level: p.level,
            })),
            {
                id: category.id,
                title: category.title,
                slug: category.slug,
                level: category.level,
            }
        ];

        return {
            category: {
                id: category.id,
                title: category.title,
                slug: category.slug,
                description: category.description,
                level: category.level,
                isActive: category.isActive,
                media: category.media,
            },
            parents: parents.map(p => ({
                id: p.id,
                title: p.title,
                slug: p.slug,
                description: p.description,
                level: p.level,
            })),
            breadcrumb,
        };
    }

    private extractDiscountFilters(query: PaginateQuery): { min?: number; max?: number; eq?: number } {
        const filters: { min?: number; max?: number; eq?: number } = {};

        if (query.filter?.discount) {
            const discountFilter = query.filter.discount;

            if (Array.isArray(discountFilter)) {
                discountFilter.forEach(filter => {
                    if (typeof filter === 'string') {
                        if (filter.startsWith('$gte:')) {
                            filters.min = Number(filter.replace('$gte:', ''));
                        } else if (filter.startsWith('$lte:')) {
                            filters.max = Number(filter.replace('$lte:', ''));
                        } else if (filter.startsWith('$eq:')) {
                            filters.eq = Number(filter.replace('$eq:', ''));
                        }
                    }
                });
            }
        }

        return filters;
    }

    private filterTreeByDiscount(
        category: Category,
        filters: { min?: number; max?: number; eq?: number }
    ): Category | null {
        if (!filters.min && !filters.max && filters.eq === undefined) {
            return category;
        }

        const discount = category.discount || 0;
        let matchesFilter = true;

        if (filters.eq !== undefined) {
            matchesFilter = discount === filters.eq;
        } else {
            if (filters.min !== undefined && Number(discount) < filters.min) {
                matchesFilter = false;
            }
            if (filters.max !== undefined && Number(discount) > filters.max) {
                matchesFilter = false;
            }
        }

        if (!matchesFilter) {
            return null;
        }

        if (category.children && category.children.length > 0) {
            category.children = category.children
                .map(child => this.filterTreeByDiscount(child, filters))
                .filter(child => child !== null);
        }

        return category;
    }

    /**
     * دریافت tree با pagination و cache
     */
    async findAllTree(query: PaginateQuery) {
        // ساخت کلید cache با filters
        const filters = JSON.stringify(query.filter || {});
        const search = JSON.stringify(query.search || {});
        const page = query.page || 1;
        const limit = query.limit || 20;

        // ✅ چک کردن cache
        const cached = await this.cacheService.getCategoryTreePaginated(page, limit, filters, search);
        if (cached) {
            console.log('✅ Category tree paginated از cache');
            return cached;
        }

        // اجرای query
        const config: PaginateConfig<Category> = {
            sortableColumns: ['id', 'title', 'level', 'displayOrder'],
            defaultSortBy: [['displayOrder', 'ASC']],
            searchableColumns: ['title', 'description', 'slug'],
            filterableColumns: {
                isActive: [FilterOperator.EQ],
                level: [FilterOperator.EQ],
                discount: [FilterOperator.GTE, FilterOperator.LTE],
            },
        };

        const queryBuilder = this.treeCatRepo
            .createQueryBuilder('category')
            .leftJoinAndSelect('category.media', 'media')
            .where('category.parentId IS NULL');

        const paginatedRoots: Paginated<Category> = await paginate(
            query,
            queryBuilder,
            config
        );

        const discountFilters = this.extractDiscountFilters(query);

        const categoriesWithChildren = await Promise.all(
            paginatedRoots.data.map(async (root) => {
                const fullTree = await this.treeCatRepo.findDescendantsTree(root, {
                    relations: ['media', 'products', 'products.medias', 'products.mediaPinned']
                });
                return this.filterTreeByDiscount(fullTree, discountFilters);
            })
        );

        const result = {
            items: CategoryMapper.toResponseList(categoriesWithChildren.filter((cat) => cat !== null)),
            meta: paginatedRoots.meta,
            links: paginatedRoots.links,
        };

        // ✅ ذخیره در cache
        await this.cacheService.setCategoryTreePaginated(page, limit, result, filters);
        console.log('💾 Category tree paginated ذخیره شد در cache');

        return result;
    }

    /**
     * دریافت tree برای سایت با cache
     */
    async findAllTreeForSite(): Promise<ICategoryResponseSite[]> {
        // ✅ چک کردن cache
        const cached = await this.cacheService.getCategoryTree();
        if (cached) {
            console.log('✅ Category tree for site از cache');
            return cached as any;
        }

        // دریافت از دیتابیس
        const categories = await this.treeCatRepo.findTrees();
        const result = CategoryMapper.toResponseSiteList(categories);

        // ✅ ذخیره در cache
        await this.cacheService.setCategoryTree(result as any);
        console.log('💾 Category tree for site ذخیره شد در cache');

        return result;
    }

    async findByIdWithDescendants(id: number): Promise<ICategoryResponse> {
        // ✅ چک کردن cache
        const cached = await this.cacheService.getCategoryWithProducts(id);
        if (cached) {
            console.log(`✅ Category ${id} with descendants از cache`);
            return cached;
        }

        // دریافت از دیتابیس
        const node = await this.treeCatRepo.findOne({
            where: { id },
            relations: ['parent', 'media', 'products', 'products.medias', 'products.mediaPinned']
        })
        if (!node) throw new NotFoundException(`دسته مورد نظر یافت نشد.`);

        const category = await this.treeCatRepo.findDescendantsTree(node, {
            relations: ['media', 'products', 'products.medias', 'products.mediaPinned']
        });

        const result = CategoryMapper.toResponseWithDescendants(category);

        // ✅ ذخیره در cache
        await this.cacheService.setCategoryWithProducts(id, result);
        console.log(`💾 Category ${id} with descendants ذخیره شد در cache`);

        return result;
    }

    async create(data: CreateCategoryDto): Promise<ICategoryResponse> {
        const result = await runInTransaction(this.dataSource, async (manager) => {
            const treeRepo = manager.getTreeRepository(Category);

            let level = 0;

            const existingTitle = await treeRepo.findOne({ where: { title: data.title } });
            if (existingTitle) {
                throw new BadRequestException('عنوان دسته بندی تکراری است.');
            }

            const existingSlug = await treeRepo.findOne({ where: { slug: data.slug } });
            if (existingSlug) {
                throw new BadRequestException('نامک دسته بندی تکراری است.');
            }

            let parent: Category | null = null;
            if (data.parentId && data.parentId !== 0) {
                parent = await treeRepo.findOne({
                    where: { id: data.parentId }
                });
                if (!parent) {
                    throw new NotFoundException('دسته مادر یافت نشد');
                }
                level = parent.level;
            }

            const category = treeRepo.create({
                title: data.title,
                slug: data.slug,
                description: data.description,
                discount: data.discount,
                displayOrder: data.displayOrder,
                isActive: data.isActive,
                parent: parent,
                level: level + 1,
            });

            const savedCategory = await treeRepo.save(category);

            if (data.mediaId) {
                const media = await manager.findOne(Media, { where: { id: data.mediaId } });
                if (!media) {
                    throw new NotFoundException('فایل مدیا یافت نشد.');
                }
                media.category = savedCategory;
                await manager.save(Media, media);
            }

            const loadedCategory = await treeRepo.findOne({
                where: { id: savedCategory.id },
                relations: ['parent', 'media']
            });

            return CategoryMapper.toResponse(loadedCategory!);
        });

        // ✅ پاک کردن cache بعد از create
        await this.cacheService.clearAllCategoryCache();
        await this.catalogCatchService.clearAllCatalogCache(); // پاک کردن کش کاتالوگ‌ها
        console.log('🗑️ Cache پاک شد بعد از create');

        return result;
    }

    async update(id: number, data: UpdateCategoryDto): Promise<ICategoryResponse> {
        const result = await runInTransaction(this.dataSource, async (manager) => {
            const treeRepo = manager.getTreeRepository(Category);

            const existsCategory = await treeRepo.findOne({
                where: { id },
                relations: ['parent', 'media', 'children']
            });

            if (!existsCategory) {
                throw new NotFoundException('دسته مورد نظر یافت نشد');
            }

            if (data.title && data.title !== existsCategory.title) {
                const existingTitle = await treeRepo.findOne({ where: { title: data.title } });
                if (existingTitle && existingTitle.id !== id) {
                    throw new BadRequestException('عنوان دسته بندی تکراری است.');
                }
            }

            if (data.slug && data.slug !== existsCategory.slug) {
                const existingSlug = await treeRepo.findOne({ where: { slug: data.slug } });
                if (existingSlug && existingSlug.id !== id) {
                    throw new BadRequestException('نامک دسته بندی تکراری است.');
                }
            }

            let newParent: Category | null = existsCategory.parent;
            let newLevel = existsCategory.level;
            let parentChanged = false;

            if (data.parentId !== undefined) {
                if (data.parentId === 0 || data.parentId === null) {
                    if (existsCategory.parent !== null) {
                        newParent = null;
                        newLevel = 1;
                        parentChanged = true;
                    }
                } else {
                    const parent = await treeRepo.findOne({
                        where: { id: data.parentId }
                    });

                    if (!parent) {
                        throw new NotFoundException('دسته مادر یافت نشد');
                    }

                    if (parent.id === id) {
                        throw new BadRequestException('دسته نمی‌تواند والد خودش باشد');
                    }

                    const descendants = await treeRepo.findDescendants(existsCategory);
                    const isDescendant = descendants.some(desc => desc.id === parent.id);
                    if (isDescendant) {
                        throw new BadRequestException('دسته نمی‌تواند فرزند خودش را به عنوان والد داشته باشد');
                    }

                    if (!existsCategory.parent || existsCategory.parent.id !== parent.id) {
                        newParent = parent;
                        newLevel = parent.level + 1;
                        parentChanged = true;
                    }
                }
            }

            if (data.title !== undefined) existsCategory.title = data.title;
            if (data.slug !== undefined) existsCategory.slug = data.slug;
            if (data.description !== undefined) existsCategory.description = data.description;
            if (data.discount !== undefined) existsCategory.discount = data.discount;
            if (data.displayOrder !== undefined) existsCategory.displayOrder = data.displayOrder;
            if (data.isActive !== undefined) existsCategory.isActive = data.isActive;

            if (parentChanged) {
                existsCategory.parent = newParent;
                existsCategory.level = newLevel;
                await treeRepo.save(existsCategory);

                if (existsCategory.children && existsCategory.children.length > 0) {
                    await this.updateDescendantsLevel(treeRepo, existsCategory);
                }
            } else {
                await treeRepo.save(existsCategory);
            }

            if (data.mediaId !== undefined) {
                const oldMedia = await manager.findOne(Media, { where: { category: { id } } });
                if (oldMedia) {
                    oldMedia.category = null;
                    await manager.save(Media, oldMedia);
                }

                if (data.mediaId) {
                    const newMedia = await manager.findOne(Media, { where: { id: data.mediaId } });
                    if (!newMedia) {
                        throw new NotFoundException('فایل مدیا یافت نشد.');
                    }
                    newMedia.category = existsCategory;
                    await manager.save(Media, newMedia);
                }
            }

            const updatedCategory = await treeRepo.findOne({
                where: { id },
                relations: ['parent', 'media']
            });

            return CategoryMapper.toResponse(updatedCategory!);
        });

        // ✅ پاک کردن cache بعد از update
        await this.cacheService.clearCategoryCache(id, data.slug);
        // await this.catalogCatchService.clearAllCatalogCache(); // پاک کردن کش کاتالوگ‌ها
        console.log(`🗑️ Cache پاک شد برای category ${id}`);

        return result;
    }

    private async updateDescendantsLevel(
        treeRepo: TreeRepository<Category>,
        parent: Category
    ): Promise<void> {
        const children = await treeRepo.find({
            where: { parent: { id: parent.id } },
            relations: ['children']
        });

        for (const child of children) {
            child.level = parent.level + 1;
            await treeRepo.save(child);

            if (child.children && child.children.length > 0) {
                await this.updateDescendantsLevel(treeRepo, child);
            }
        }
    }

    async remove(id: number): Promise<Object> {
        const result = await runInTransaction(this.dataSource, async (manager) => {
            const treeRepo = manager.getTreeRepository(Category);

            const node = await treeRepo.findOne({
                where: { id },
                relations: ['children', 'products']
            });

            if (!node) {
                throw new NotFoundException(`دسته مورد نظر یافت نشد.`);
            }

            const descendants = await treeRepo.findDescendants(node);
            if (descendants.length > 1) {
                throw new BadRequestException('حذف امکان‌پذیر نیست، دسته شامل زیرمجموعه است');
            }

            if (node.products && node.products.length > 0) {
                throw new BadRequestException('حذف امکان‌پذیر نیست، دسته شامل محصول است');
            }

            const media = await manager.findOne(Media, { where: { category: { id } } });
            if (media) {
                media.category = null;
                await manager.save(Media, media);
            }

            await treeRepo.remove(node);
            await this.catalogCatchService.clearAllCategoryCache(); // پاک کردن کش کاتالوگ‌ها

            return { message: 'دسته با موفقیت حذف شد', data: null };
        });

        // ✅ پاک کردن cache بعد از delete
        await this.cacheService.clearCategoryCache(id);
        await this.catalogCatchService.clearAllCatalogCache(); // پاک کردن کش کاتالوگ‌ها


        console.log(`🗑️ Cache پاک شد برای category ${id}`);

        return result;
    }
}
