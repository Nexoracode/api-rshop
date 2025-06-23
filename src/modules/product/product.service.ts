import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { DataSource, In, Repository } from 'typeorm';
import { CategoryService } from '../category/category.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IProductService } from './interfaces/product.service.interface';
import { IProductResponse } from './interfaces/product.response';
import { runInTransaction } from 'src/common/helpers/transaction.helper';
import { Media } from '../media/entities/image.entity';
import { AttributeValue } from '../attributes/attribute-value/entities/attribute-value.entity';
import { VariantProduct } from '../variant-product/entities/variant-product.entity';
import { Category } from '../category/entities/category.entity';

@Injectable()
export class ProductService implements IProductService {
    constructor(
        private dataSource: DataSource,
    ) { }

    async create(data: CreateProductDto): Promise<IProductResponse> {
        return runInTransaction(this.dataSource, async (manager) => {
            const duplicate = await manager.findOne(Product, { where: { name: data.name } });
            if (duplicate) throw new NotFoundException('این نام محصول از قبل ثبت شده است.')
            const category = await manager.findOne(Category, { where: { id: data.categoryId } });
            if (!category) throw new NotFoundException('دسته بندی مورد نظر یافت نشد');
            const product = manager.create(Product, data);
            if (!data.requiresPreparation) {
                product.preparationDays = null;
            }
            const savedProduct = await manager.save(Product, {
                ...product,
                category,
            });
            if (data.mediaIds?.length) {
                await manager.update(Media, { id: In(data.mediaIds) }, { product: savedProduct })
            }
            if (data.attributeValueIds?.length) {
                await manager.update(AttributeValue, { id: In(data.attributeValueIds) }, { product: savedProduct })
            }
            if (data.variantIds?.length) {
                await manager.update(VariantProduct, { id: In(data.variantIds) }, { product: savedProduct })
            }
            return savedProduct;
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
            const updated = manager.merge(Product, product, data);
            if (!data.requiresPreparation) {
                updated.preparationDays = null;
            }
            const savedProduct = await manager.save(Product, updated);

            if (data.mediaIds?.length) {
                await manager.update(Media, { id: In(data.mediaIds) }, { product: savedProduct });
            }

            if (data.attributeValueIds?.length) {
                await manager.update(AttributeValue, { id: In(data.attributeValueIds) }, { product: savedProduct });
            }

            if (data.variantIds?.length) {
                await manager.update(VariantProduct, { id: In(data.variantIds) }, { product: savedProduct });
            }

            return savedProduct;
        });
    }
}
