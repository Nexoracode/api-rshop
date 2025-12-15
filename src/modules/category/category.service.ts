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

    async findAllTree(): Promise<ICategoryResponse[]> {
        const categories = await this.treeCatRepo.findTrees({
            relations: ['parent', 'media', 'products', 'products.medias', 'products.mediaPinned']
        });
        return categories.map((category) => CategoryMapper.toResponse(category));
    }

    async findAllTreeForSite(): Promise<ICategoryResponseSite[]> {
        // TODO: Add caching here for better performance
        const categories = await this.treeCatRepo.findTrees({ relations: ['parent', 'parent.children'] });
        return categories.map((category) => CategoryMapper.toResponseSite(category));
    }

    async findByIdWithDescendants(id: number): Promise<ICategoryResponse> {
        const node = await this.treeCatRepo.findOne({
            where: { id },
            relations: ['parent', 'children.parent', 'media', 'products', 'products.medias', 'products.mediaPinned']
        })
        if (!node) throw new NotFoundException(`دسته مورد نظر یافت نشد.`);

        const category = await this.treeCatRepo.findDescendantsTree(node, {
            relations: ['parent', 'media', 'products', 'products.medias', 'products.mediaPinned']
        });
        return CategoryMapper.toResponse(category);
    }

    async create(data: CreateCategoryDto): Promise<ICategoryResponse> {
        return runInTransaction(this.dataSource, async (manager) => {
            let level = 0;

            // Check for duplicate title
            const existingTitle = await manager.findOne(Category, { where: { title: data.title } });
            if (existingTitle) {
                throw new BadRequestException('عنوان دسته بندی تکراری است.');
            }

            // Check for duplicate slug
            const existingSlug = await manager.findOne(Category, { where: { slug: data.slug } });
            if (existingSlug) {
                throw new BadRequestException('نامک دسته بندی تکراری است.');
            }

            // Handle parent and level calculation
            let parent: Category | null = null;
            if (data.parentId && data.parentId !== 0) {
                parent = await this.treeCatRepo.findOne({
                    where: { id: data.parentId },
                    relations: ['parent']
                });
                if (!parent) {
                    throw new NotFoundException('دسته مادر یافت نشد');
                }
                level = parent.level;
            }

            // Create category
            const category = manager.create(Category, {
                ...data,
                parentId: parent ? parent.id : null,
                level: level + 1,
            });

            const savedCategory = await manager.save(Category, category);

            // Handle media if provided
            if (data.mediaId) {
                const media = await manager.findOne(Media, { where: { id: data.mediaId } });
                if (!media) {
                    throw new NotFoundException('فایل مدیا یافت نشد.');
                }
                await manager.update(Media, { id: data.mediaId }, { category: savedCategory });
            }

            return CategoryMapper.toResponse(savedCategory);
        });
    }

    async update(id: number, data: UpdateCategoryDto): Promise<ICategoryResponse> {
        return runInTransaction(this.dataSource, async (manager) => {
            const existsCategory = await manager.findOne(Category, {
                where: { id },
                relations: ['parent', 'media']
            });

            if (!existsCategory) {
                throw new NotFoundException('دسته مورد نظر یافت نشد');
            }

            // Check for duplicate title (only if title is being updated)
            if (data.title && data.title !== existsCategory.title) {
                const existingTitle = await manager.findOne(Category, { where: { title: data.title } });
                if (existingTitle && existingTitle.id !== id) {
                    throw new BadRequestException('عنوان دسته بندی تکراری است.');
                }
            }

            // Check for duplicate slug (only if slug is being updated)
            if (data.slug && data.slug !== existsCategory.slug) {
                const existingSlug = await manager.findOne(Category, { where: { slug: data.slug } });
                if (existingSlug && existingSlug.id !== id) {
                    throw new BadRequestException('نامک دسته بندی تکراری است.');
                }
            }

            // Handle parent update and level recalculation
            let newParent = existsCategory.parent;
            let newLevel = existsCategory.level;

            if (data.parentId !== undefined) {
                if (data.parentId === 0 || data.parentId === null) {
                    newParent = null;
                    newLevel = 1;
                } else {
                    const parent = await this.treeCatRepo.findOne({
                        where: { id: data.parentId },
                        relations: ['parent']
                    });

                    if (!parent) {
                        throw new NotFoundException('دسته مادر یافت نشد');
                    }

                    // Prevent setting a category as its own parent or child
                    if (parent.id === id) {
                        throw new BadRequestException('دسته نمی‌تواند والد خودش باشد');
                    }

                    newParent = parent;
                    newLevel = parent.level + 1;
                }
            }

            // Merge updates
            const category = manager.merge(Category, existsCategory, {
                ...data,
                parentId: newParent ? newParent.id : null,
                level: newLevel,
            });

            const savedCategory = await manager.save(Category, category);

            // Handle media updates
            if (data.mediaId !== undefined) {
                // Remove old media association
                const oldMedia = await manager.findOne(Media, { where: { category: { id } } });
                if (oldMedia) {
                    oldMedia.category = null;
                    await manager.save(Media, oldMedia);
                }

                // Add new media association
                if (data.mediaId) {
                    const newMedia = await manager.findOne(Media, { where: { id: data.mediaId } });
                    if (!newMedia) {
                        throw new NotFoundException('فایل مدیا یافت نشد.');
                    }
                    await manager.update(Media, { id: data.mediaId }, { category: savedCategory });
                }
            }

            return CategoryMapper.toResponse(savedCategory);
        });
    }

    async remove(id: number): Promise<Object> {
        return runInTransaction(this.dataSource, async (manager) => {
            const node = await this.treeCatRepo.findOne({ where: { id } })
            if (!node) {
                throw new NotFoundException(`دسته مورد نظر یافت نشد.`);
            }

            const category = await this.treeCatRepo.findDescendantsTree(node);
            const mapper = CategoryMapper.toResponse(category);

            if (!mapper.isDelete) {
                throw new BadRequestException('حذف امکان‌پذیر نیست، دسته شامل زیرمجموعه یا آیتم است');
            }

            // Remove associated media
            const media = await manager.findOne(Media, { where: { category: { id } } });
            if (media) {
                media.category = null;
                await manager.save(Media, media);
            }

            const deleted = await manager.delete(Category, id);

            if (deleted.affected === 0) {
                throw new BadRequestException('حذف انجام نشد، خطایی رخ داده است');
            }

            return { message: 'دسته با موفقیت حذف شد', data: null };
        })
    }
}
