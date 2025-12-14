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

    async findOneSlug(slug: string): Promise<Category> {
        const category = await this.treeCatRepo.findOne({ where: { slug } });
        if (!category) {
            throw new NotFoundException(`Category with ID ${slug} not found`);
        }
        return category;
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
                parent: parent,
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
                parent: newParent,
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
