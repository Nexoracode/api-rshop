import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In, Repository, TreeRepository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryMapper } from './mappers/category.mapper';
import { ICategoryResponse } from './interfaces/category.response.interface';
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
        private uploadService: UploadService
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
        const categories = await this.treeCatRepo.findTrees({ relations: ['media'] });
        return categories.map((category) => CategoryMapper.toResponse(category));
    }

    async findByIdWithDescendants(id: number): Promise<ICategoryResponse> {
        const node = await this.treeCatRepo.findOne({ where: { id } })
        if (!node) throw new NotFoundException(`دسته مورد نظر یافت نشد.`);
        const category = await this.treeCatRepo.findDescendantsTree(node);
        return CategoryMapper.toResponse(category);
    }

    async create(data: CreateCategoryDto): Promise<ICategoryResponse> {
        return runInTransaction(this.dataSource, async (manager) => {
            let level = 0;
            const exists = await this.catRepo.findOne({ where: { title: data.title, slug: data.slug }, });
            if (exists) throw new BadRequestException('نام یا نامک دسته تکراری می باشد.');
            if (data.parentId && data.parentId !== 0) {
                const parent = await manager.findOne(Category, { where: { id: data.parentId } });
                if (!parent) throw new NotFoundException('دسته مادر یافت نشد');
                level = parent.level;
            }
            const media = await this.mediaRepo.findOne({ where: { id: data.mediaId } })
            if (!media) throw new NotFoundException('فایل یافت نشد.');
            const category = manager.create(Category, {
                ...data,
                parent: data.parentId === 0 ? null : { id: data.parentId },
                level: level + 1,
            });
            const savedCategory = await manager.save(Category, category);
            await manager.update(Media, { id: data.mediaId }, { category });
            return CategoryMapper.toResponse(savedCategory);
        })
    }

    async update(id: number, data: UpdateCategoryDto) {
        return runInTransaction(this.dataSource, async (manager) => {
            const existsCategory = await this.findOne(id);
            if (!existsCategory) throw new NotFoundException('دسته مورد نظر یافت نشد');
            let existsNameSlug = await this.catRepo.findOne({ where: { title: data.title, slug: data.slug } });
            if (existsNameSlug) throw new BadRequestException('نام یا نامک دسته تکراری می باشد.');
            const category = manager.merge(Category, existsCategory, data);
            const mediaExists = await this.mediaRepo.findOne({ where: { category: { id } } });
            if (mediaExists) {
                await manager.remove(Media, mediaExists)
                await this.uploadService.deleteFileByUrl(mediaExists.url);
            }
            const savedCategory = await manager.save(Category, category);
            await manager.update(Media, { id: data.mediaId }, { category })
            return CategoryMapper.toResponse(savedCategory);
        })
    }


    async remove(id: number): Promise<Record<string, string | null>> {
        return runInTransaction(this.dataSource, async (manager) => {
            // const node = await this.treeCatRepo.findOne({ where: { id } })
            // if (!node) throw new NotFoundException(`دسته مورد نظر یافت نشد.`);
            // const category = await this.treeCatRepo.findDescendantsTree(node);
            // const mapper = CategoryMapper.toResponse(category);
            // if (!mapper.isDelete) throw new BadRequestException('حذف امکان پذیر نیست، دسته خالی نمی باشد.');
            // const removedCategory = await manager.delete(Category, id);
            // if (removedCategory.affected === 0) throw new BadRequestException('حذف انجام نشد، خطایی یافت شد');
            const mediaExists = await this.mediaRepo.findOne({ where: { category: { id } } });
            // if (mediaExists) {
            //     await manager.remove(Media, mediaExists)
            //     await this.uploadService.deleteFileByUrl(mediaExists.url);
            // }
            await this.uploadService.deleteFileByUrl(mediaExists!.url);
            return {
                message: 'حذف با موفقیت انجام شد',
                data: null,
            }
        })
    }
}
