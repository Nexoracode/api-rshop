import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { DataSource, In, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IProductService } from './interfaces/product.service.interface';
import { IProductResponse } from './interfaces/product.response';
import { runInTransaction } from 'src/common/helpers/transaction.helper';
import { Media } from '../media/entities/image.entity';
import { Category } from '../category/entities/category.entity';
import { ProductMapper } from './mappers/product.mapper';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import axios from 'axios';
import { HelperEntity } from '../helper/entities/helper.entity';
import { Brand } from '../brand/entities/brand.entity';
@Injectable()
export class ProductService implements IProductService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        private dataSource: DataSource,
    ) { }


    async findAll(query: PaginateQuery): Promise<Object> {
        const products = await paginate(query, this.productRepo, {
            sortableColumns: ['id', 'name', 'price', 'stock', 'media', 'mediaPinned'],
            relations: ['media', 'mediaPinned', 'category', 'variants', 'helper',
                'brand',
                'variants.attributes',
                'variants.attributes.attribute',],
            defaultSortBy: [['id', 'DESC']],
            searchableColumns: ['name'],
            select: ['id', 'name', 'price', 'brandId', 'helperId', 'brand.id', 'brand.name', 'brand.logo',
                'brand.slug', 'helper.id', 'helper.title', 'helper.image', 'helper.description', 'mediaPinnedId', 'stock', 'createdAt', 'isVisible', 'orderLimit', 'media.id', 'media.url', 'media.type', 'mediaPinned.id', 'mediaPinned.url', 'mediaPinned.type', 'category.id', 'category.title'],
        });
        return {
            message: 'محصولات با موفقیت دریافت شد.',
            data: {
                items: products.data,
                meta: products.meta,
                links: products.links,
            }
        };
    }

    async findOne(id: number): Promise<IProductResponse> {
        const product = await this.productRepo.findOne({
            where: { id },
            relations: [
                'variants',
                'variants.attributes',
                'variants.attributes.attribute',
                'variants.attributes.attribute.group',
                'variants.attributes.attribute.values', // برای پر شدن values در attribute_nodes
                'variants.attributes.value',
                'media',
                'mediaPinned',
                'category',
                'brand',
                'helper',
            ]
        });
        if (!product) throw new NotFoundException('محصول مورد نظر یافت نشد.');
        return ProductMapper.toResponse(product, { cartesian: true });
    }

    async create(data: CreateProductDto): Promise<IProductResponse> {
        return runInTransaction(this.dataSource, async (manager) => {
            if (!data.mediaIds) throw new BadRequestException('تصویر محصول خود را مشخص کنید.');
            const duplicate = await manager.findOne(Product, { where: { name: data.name } });
            if (duplicate) throw new NotFoundException('این نام محصول از قبل ثبت شده است.')
            const category = await manager.findOne(Category, { where: { id: data.categoryId } });
            if (!category) throw new NotFoundException('دسته بندی مورد نظر یافت نشد');
            const helper = await manager.findOne(HelperEntity, { where: { id: data.helperId } })
            if (!helper) throw new NotFoundException('راهنمای تصویر مورد نظر یافت نشد');
            const brand = await manager.findOne(Brand, { where: { id: data.brandId } })
            if (!brand) throw new NotFoundException('راهنمای تصویر مورد نظر یافت نشد');
            const product = manager.create(Product, data);
            if (!data.requiresPreparation) {
                product.preparationDays = null;
            }
            const media = await manager.findOne(Media, { where: { id: data.mediaPinnedId } });
            if (media) {
                product.mediaPinned = media;
                product.mediaPinnedId = media.id;
            }
            const savedProduct = await manager.save(Product, {
                ...product,
                category,
            });
            await manager.update(Media, { id: In(data.mediaIds) }, { product: savedProduct })
            const result = await manager.findOne(Product, {
                where: { id: savedProduct.id },
                relations: ['variants',
                    'variants.attributes',
                    'variants.attributes.attribute',
                    'variants.attributes.attribute.group',
                    'variants.attributes.attribute.values', // برای پر شدن values در attribute_nodes
                    'variants.attributes.value',
                    'media',
                    'mediaPinned',
                    'category',
                    'brand',
                    'helper',]
            });
            if (!result) throw new NotFoundException('محصول مورد نظر ثبت نشده است.');
            return ProductMapper.toResponse(result, { cartesian: true });
        })
    }


    async update(id: number, data: UpdateProductDto): Promise<IProductResponse> {
        return runInTransaction(this.dataSource, async (manager) => {
            const product = await manager.findOne(Product, { where: { id } });
            if (!product) throw new NotFoundException('محصول یافت نشد');
            const duplicate = await manager.findOne(Product, { where: { name: data.name } });
            if (duplicate && duplicate.id !== id) throw new NotFoundException('این نام محصول از قبل ثبت شده است.')
            const category = manager.findOne(Category, { where: { id: data.categoryId } })
            if (!category) throw new NotFoundException('دسته بندی مورد نظر یافت نشد');
            const helper = await manager.findOne(HelperEntity, { where: { id: data.helperId } })
            if (!helper) throw new NotFoundException('راهنمای تصویر مورد نظر یافت نشد');
            const brand = await manager.findOne(Brand, { where: { id: data.brandId } })
            if (!brand) throw new NotFoundException('راهنمای تصویر مورد نظر یافت نشد');
            const updated = manager.merge(Product, product, data);
            if (!data.requiresPreparation) {
                updated.preparationDays = null;
            }
            const savedProduct = await manager.save(Product, updated);
            if (data.mediaIds?.length) {
                await manager.update(Media, { id: In(data.mediaIds) }, { product: savedProduct });
            }
            const result = await manager.findOne(Product, {
                where: { id: savedProduct.id },
                relations: ['variants',
                    'variants.attributes',
                    'variants.attributes.attribute',
                    'variants.attributes.attribute.group',
                    'variants.attributes.attribute.values', // برای پر شدن values در attribute_nodes
                    'variants.attributes.value',
                    'media',
                    'mediaPinned',
                    'category',
                    'brand',
                    'helper',]
            });
            if (!result) throw new NotFoundException('محصول مورد نظر ثبت نشده است.');
            return ProductMapper.toResponse(result, { cartesian: true });
        });
    }

    async remove(id: number): Promise<Object> {
        return runInTransaction(this.dataSource, async (manager) => {
            const product = await manager.findOne(Product, {
                where: { id },
                relations: ['variants',
                    'variants.attributes',
                    'variants.attributes.attribute',
                    'variants.attributes.attribute.group',
                    'variants.attributes.attribute.values', // برای پر شدن values در attribute_nodes
                    'variants.attributes.value',
                    'media',
                    'mediaPinned',
                    'category',
                    'brand',
                    'helper',]
            });
            if (!product) throw new NotFoundException("محصول مورد نظر یافت نشد.");
            await manager.remove(Product, product);
            await manager.update(Media, { productId: id }, { product: null });
            return {
                message: 'محصول با موفقیت حذف شد.',
                data: null
            }
        })
    }

}
