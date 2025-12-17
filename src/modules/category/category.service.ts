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

@Injectable()
export class CategoryService implements ICategoryService {
    private treeCatRepo: TreeRepository<Category>
    constructor(
        @InjectRepository(Category)
        private readonly catRepo: Repository<Category>,
        @InjectRepository(Media)
        private readonly mediaRepo: Repository<Media>,
        private dataSource: DataSource,
    ) {
        this.treeCatRepo = this.dataSource.getTreeRepository(Category);
    }

    async findOne(id: number): Promise<Category> {
        const category = await this.treeCatRepo.findOne({ where: { id } });
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }

    async findOneSlug(slug: string) {
        const node = await this.treeCatRepo.findOne({
            where: { slug },
            relations: ['parent']
        })
        if (!node) throw new NotFoundException(`دسته مورد نظر یافت نشد.`);

        const category = await this.treeCatRepo.findDescendantsTree(node, {
            relations: ['parent']
        });
        return category;
    }

    /**
     * پیدا کردن دسته‌بندی با slug به همراه تمام parent ها (بدون children)
     * برای استفاده در SEO و Breadcrumb
     * @param slug - نامک دسته‌بندی
     * @returns دسته‌بندی همراه با آرایه‌ای از تمام parent ها
     */
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
        // پیدا کردن دسته با slug (بدون children)
        const category = await this.treeCatRepo.findOne({
            where: { slug },
            relations: ['media']
        });

        if (!category) {
            throw new NotFoundException(`دسته‌بندی با slug "${slug}" یافت نشد.`);
        }

        // دریافت تمام ancestor ها (parent ها) - بدون children
        const ancestors = await this.treeCatRepo.findAncestors(category);

        // حذف خود دسته از لیست
        const parents = ancestors.filter(ancestor => ancestor.id !== category.id);

        // مرتب‌سازی parent ها از بالاترین (root) به پایین‌ترین
        parents.sort((a, b) => a.level - b.level);

        // ساخت breadcrumb (مسیر کامل)
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

        // خروجی تمیز بدون children
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

    /**
     * پیدا کردن دسته‌بندی با ID به همراه تمام parent ها (بدون children)
     * برای استفاده در SEO و Breadcrumb
     * @param id - شناسه دسته‌بندی
     * @returns دسته‌بندی همراه با آرایه‌ای از تمام parent ها
     */
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
        // پیدا کردن دسته (بدون children)
        const category = await this.treeCatRepo.findOne({
            where: { id },
            relations: ['media']
        });

        if (!category) {
            throw new NotFoundException(`دسته‌بندی با ID ${id} یافت نشد.`);
        }

        // دریافت تمام ancestor ها (parent ها) - بدون children
        const ancestors = await this.treeCatRepo.findAncestors(category);

        // حذف خود دسته از لیست
        const parents = ancestors.filter(ancestor => ancestor.id !== category.id);

        // مرتب‌سازی parent ها از بالاترین (root) به پایین‌ترین
        parents.sort((a, b) => a.level - b.level);

        // ساخت breadcrumb
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

        // خروجی تمیز بدون children
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

    // متد کمکی برای استخراج فیلترهای discount
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

    // متد کمکی برای فیلتر کردن tree
    private filterTreeByDiscount(
        category: Category,
        filters: { min?: number; max?: number; eq?: number }
    ): Category | null {
        // اگر فیلتری نیست، همه رو برگردون
        if (!filters.min && !filters.max && filters.eq === undefined) {
            return category;
        }

        // چک کردن discount این category
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

        // اگر این category مطابقت نداره، null برگردون
        if (!matchesFilter) {
            return null;
        }

        // فیلتر کردن children ها
        if (category.children && category.children.length > 0) {
            category.children = category.children
                .map(child => this.filterTreeByDiscount(child, filters))
                .filter(child => child !== null);
        }

        return category;
    }

    async findAllTree(query: PaginateQuery) {
        const config: PaginateConfig<Category> = {
            sortableColumns: ['id', 'title', 'level', 'displayOrder', 'displayOrder'],
            defaultSortBy: [['displayOrder', 'ASC'], ['displayOrder', 'ASC']],
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

        // استخراج فیلترهای discount از query
        const discountFilters = this.extractDiscountFilters(query);

        // برای هر root، دریافت tree و اعمال فیلتر روی children
        const categoriesWithChildren = await Promise.all(
            paginatedRoots.data.map(async (root) => {
                const fullTree = await this.treeCatRepo.findDescendantsTree(root, {
                    relations: ['media', 'products', 'products.medias', 'products.mediaPinned']
                });

                // فیلتر کردن tree
                return this.filterTreeByDiscount(fullTree, discountFilters);
            })
        );

        return {
            items: CategoryMapper.toResponseList(categoriesWithChildren.filter((cat) => cat !== null)),
            meta: paginatedRoots.meta,
            links: paginatedRoots.links,
        };
    }

    async findAllTreeForSite(): Promise<ICategoryResponseSite[]> {
        // TODO: Add caching here for better performance
        const categories = await this.treeCatRepo.findTrees();
        return CategoryMapper.toResponseSiteList(categories);
    }

    async findByIdWithDescendants(id: number): Promise<ICategoryResponse> {
        const node = await this.treeCatRepo.findOne({
            where: { id },
            relations: ['parent', 'media', 'products', 'products.medias', 'products.mediaPinned']
        })
        if (!node) throw new NotFoundException(`دسته مورد نظر یافت نشد.`);

        const category = await this.treeCatRepo.findDescendantsTree(node, {
            relations: ['media', 'products', 'products.medias', 'products.mediaPinned']
        });
        return CategoryMapper.toResponseWithDescendants(category);
    }

    async create(data: CreateCategoryDto): Promise<ICategoryResponse> {
        return runInTransaction(this.dataSource, async (manager) => {
            // دریافت TreeRepository از transaction manager
            const treeRepo = manager.getTreeRepository(Category);

            let level = 0;

            // Check for duplicate title
            const existingTitle = await treeRepo.findOne({ where: { title: data.title } });
            if (existingTitle) {
                throw new BadRequestException('عنوان دسته بندی تکراری است.');
            }

            // Check for duplicate slug
            const existingSlug = await treeRepo.findOne({ where: { slug: data.slug } });
            if (existingSlug) {
                throw new BadRequestException('نامک دسته بندی تکراری است.');
            }

            // Handle parent and level calculation
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

            // Create category با parent relation
            const category = treeRepo.create({
                title: data.title,
                slug: data.slug,
                description: data.description,
                discount: data.discount,
                displayOrder: data.displayOrder,
                isActive: data.isActive,
                parent: parent,  // استفاده از relation به جای parentId
                level: level + 1,
            });

            // ذخیره با TreeRepository برای به‌روزرسانی closure table
            const savedCategory = await treeRepo.save(category);

            // Handle media if provided
            if (data.mediaId) {
                const media = await manager.findOne(Media, { where: { id: data.mediaId } });
                if (!media) {
                    throw new NotFoundException('فایل مدیا یافت نشد.');
                }
                media.category = savedCategory;
                await manager.save(Media, media);
            }

            // بارگذاری دوباره با relations برای response
            const loadedCategory = await treeRepo.findOne({
                where: { id: savedCategory.id },
                relations: ['parent', 'media']
            });

            return CategoryMapper.toResponse(loadedCategory!);
        });
    }

    async update(id: number, data: UpdateCategoryDto): Promise<ICategoryResponse> {
        return runInTransaction(this.dataSource, async (manager) => {
            // دریافت TreeRepository از transaction manager
            const treeRepo = manager.getTreeRepository(Category);

            const existsCategory = await treeRepo.findOne({
                where: { id },
                relations: ['parent', 'media', 'children']
            });

            if (!existsCategory) {
                throw new NotFoundException('دسته مورد نظر یافت نشد');
            }

            // Check for duplicate title (only if title is being updated)
            if (data.title && data.title !== existsCategory.title) {
                const existingTitle = await treeRepo.findOne({ where: { title: data.title } });
                if (existingTitle && existingTitle.id !== id) {
                    throw new BadRequestException('عنوان دسته بندی تکراری است.');
                }
            }

            // Check for duplicate slug (only if slug is being updated)
            if (data.slug && data.slug !== existsCategory.slug) {
                const existingSlug = await treeRepo.findOne({ where: { slug: data.slug } });
                if (existingSlug && existingSlug.id !== id) {
                    throw new BadRequestException('نامک دسته بندی تکراری است.');
                }
            }

            // Handle parent update and level recalculation
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

                    // جلوگیری از تنظیم دسته به عنوان parent خودش
                    if (parent.id === id) {
                        throw new BadRequestException('دسته نمی‌تواند والد خودش باشد');
                    }

                    // بررسی اینکه آیا parent در descendants این دسته است
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

            // به‌روزرسانی فیلدهای ساده
            if (data.title !== undefined) existsCategory.title = data.title;
            if (data.slug !== undefined) existsCategory.slug = data.slug;
            if (data.description !== undefined) existsCategory.description = data.description;
            if (data.discount !== undefined) existsCategory.discount = data.discount;
            if (data.displayOrder !== undefined) existsCategory.displayOrder = data.displayOrder;
            if (data.isActive !== undefined) existsCategory.isActive = data.isActive;

            // اگر parent تغییر کرده، باید level همه descendants به‌روز شود
            if (parentChanged) {
                existsCategory.parent = newParent;
                existsCategory.level = newLevel;

                // ذخیره با TreeRepository برای به‌روزرسانی closure table
                await treeRepo.save(existsCategory);

                // به‌روزرسانی level همه فرزندان
                if (existsCategory.children && existsCategory.children.length > 0) {
                    await this.updateDescendantsLevel(treeRepo, existsCategory);
                }
            } else {
                // ذخیره عادی
                await treeRepo.save(existsCategory);
            }

            // Handle media updates
            if (data.mediaId !== undefined) {
                // حذف ارتباط media قبلی
                const oldMedia = await manager.findOne(Media, { where: { category: { id } } });
                if (oldMedia) {
                    oldMedia.category = null;
                    await manager.save(Media, oldMedia);
                }

                // اضافه کردن media جدید
                if (data.mediaId) {
                    const newMedia = await manager.findOne(Media, { where: { id: data.mediaId } });
                    if (!newMedia) {
                        throw new NotFoundException('فایل مدیا یافت نشد.');
                    }
                    newMedia.category = existsCategory;
                    await manager.save(Media, newMedia);
                }
            }

            // بارگذاری دوباره با relations کامل
            const updatedCategory = await treeRepo.findOne({
                where: { id },
                relations: ['parent', 'media']
            });

            return CategoryMapper.toResponse(updatedCategory!);
        });
    }

    /**
     * به‌روزرسانی بازگشتی level تمام فرزندان
     */
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
        return runInTransaction(this.dataSource, async (manager) => {
            // دریافت TreeRepository از transaction manager
            const treeRepo = manager.getTreeRepository(Category);

            const node = await treeRepo.findOne({
                where: { id },
                relations: ['children', 'products']
            });

            if (!node) {
                throw new NotFoundException(`دسته مورد نظر یافت نشد.`);
            }

            // بررسی اینکه آیا دسته فرزند دارد
            const descendants = await treeRepo.findDescendants(node);
            if (descendants.length > 1) { // خودش + فرزندان
                throw new BadRequestException('حذف امکان‌پذیر نیست، دسته شامل زیرمجموعه است');
            }

            // بررسی اینکه آیا دسته محصول دارد
            if (node.products && node.products.length > 0) {
                throw new BadRequestException('حذف امکان‌پذیر نیست، دسته شامل محصول است');
            }

            // حذف ارتباط media
            const media = await manager.findOne(Media, { where: { category: { id } } });
            if (media) {
                media.category = null;
                await manager.save(Media, media);
            }

            // حذف دسته - closure table به صورت خودکار پاک می‌شود
            await treeRepo.remove(node);

            return { message: 'دسته با موفقیت حذف شد', data: null };
        })
    }
}
