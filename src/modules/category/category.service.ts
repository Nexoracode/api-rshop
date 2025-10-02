import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In, Repository, TreeRepository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryMapper } from './mappers/category.mapper';
import { ICategoryResponse, ICategoryResponseSite } from './interfaces/category.response.interface';
import { ICategoryService } from './interfaces/category.service.interface';
import { MediaService } from '../media/media.service';
import { Media } from '../media/entities/image.entity';
import { runInTransaction } from 'src/common/helpers/transaction.helper';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UploadService } from 'src/common/services/upload.service';

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

    async findAllTree(): Promise<ICategoryResponse[]> {
        const categories = await this.treeCatRepo.findTrees({ relations: ['parent', 'media', 'products', 'products.media', 'products.mediaPinned'] });
        return categories.map((category) => CategoryMapper.toResponse(category));
    }

    async findAllTreeForSite(): Promise<ICategoryResponseSite[]> {
        const categories = await this.treeCatRepo.findTrees({ relations: ['parent'] });
        return categories.map((category) => CategoryMapper.toResponseSite(category));
    }

    async findByIdWithDescendants(id: number): Promise<ICategoryResponse> {
        const node = await this.treeCatRepo.findOne({ where: { id }, relations: ['parent', 'children.parent', 'media', 'products', 'products.media', 'products.mediaPinned'] })
        if (!node) throw new NotFoundException(`دسته مورد نظر یافت نشد.`);
        const category = await this.treeCatRepo.findDescendantsTree(node, { relations: ['parent', 'media', 'products', 'products.media', 'products.mediaPinned'] });
        return CategoryMapper.toResponse(category);
    }

    async create(data: CreateCategoryDto) {
        return runInTransaction(this.dataSource, async (manager) => {
            let level = 0;
            const existingTitle = await this.catRepo.findOne({ where: { title: data.title } });
            if (existingTitle)
                throw new BadRequestException('عنوان دسته بندی تکراری است.');
            const existingSlug = await this.catRepo.findOne({ where: { slug: data.slug } });
            if (existingSlug)
                throw new BadRequestException('نامک دسته بندی تکراری است.');
            if (data.parentId && data.parentId !== 0) {
                const parent = await manager.findOne(Category, { where: { id: data.parentId } });
                if (!parent) throw new NotFoundException('دسته مادر یافت نشد');
                level = parent.level;
            }
            const category = manager.create(Category, {
                ...data,
                parent: data.parentId === 0 ? null : { id: data.parentId },
                level: level + 1,
            });
            const savedCategory = await manager.save(Category, category);
            if (data.mediaId) {
                const media = await manager.findOne(Media, { where: { id: data.mediaId } });
                if (!media) throw new NotFoundException('فایل مدیا یافت نشد.');
                await manager.update(Media, { id: data.mediaId }, { category: savedCategory });
            }
            return CategoryMapper.toResponse(savedCategory);
        });
    }

    async update(id: number, data: UpdateCategoryDto) {
        console.log(id, data);
        return runInTransaction(this.dataSource, async (manager) => {
            const existsCategory = await manager.findOne(Category, { where: { id } });
            if (!existsCategory) throw new NotFoundException('دسته مورد نظر یافت نشد');

            const existingTitle = await this.catRepo.findOne({ where: { title: data.title } });
            if (existingTitle && existingTitle.id !== id)
                throw new BadRequestException('عنوان دسته بندی تکراری است.');

            const existingSlug = await this.catRepo.findOne({ where: { slug: data.slug } });
            if (existingSlug && existingSlug.id !== id)
                throw new BadRequestException('نامک دسته بندی تکراری است.');

            const category = manager.merge(Category, existsCategory, data);
            const savedCategory = await manager.save(Category, category);

            const mediaDeleted = await manager.findOne(Media, { where: { category: { id } } });
            if (data.mediaId) {
                if (mediaDeleted) {
                    mediaDeleted.category = null;
                    await manager.save(Media, mediaDeleted);
                }
                const media = await manager.findOne(Media, { where: { id: category.media?.id } });
                console.log(media, data.mediaId)
                if (!media) throw new NotFoundException('فایل مدیا یافت نشد.');
                await manager.update(Media, { id: data.mediaId }, { category: savedCategory });
            } else {
                const media = await manager.findOne(Media, { where: { category: { id } } })
                if (media) {
                    media.category = null;
                    await manager.save(Media, media);
                }
            }
            console.log(category);
            return CategoryMapper.toResponse(savedCategory);
        });
    }

    async remove(id: number): Promise<Object> {
        return runInTransaction(this.dataSource, async (manager) => {
            const node = await this.treeCatRepo.findOne({ where: { id } })
            if (!node) throw new NotFoundException(`دسته مورد نظر یافت نشد.`);
            const category = await this.treeCatRepo.findDescendantsTree(node);
            const mapper = CategoryMapper.toResponse(category);
            if (!mapper.isDelete) {
                throw new BadRequestException('حذف امکان‌پذیر نیست، دسته شامل زیرمجموعه یا آیتم است');
            }
            const media = await manager.findOne(Media, { where: { category: { id } } });
            if (media) await manager.remove(Media, media);

            const deleted = await manager.delete(Category, id);
            if (deleted.affected === 0)
                throw new BadRequestException('حذف انجام نشد، خطایی رخ داده است');
            return { message: 'دسته با موفقیت حذف شد', data: null };
        })
    }
}
