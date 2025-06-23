import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVariantProductDto } from './dto/create-variant-product.dto';
import { UpdateVariantProductDto } from './dto/update-variant-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { VariantProduct } from './entities/variant-product.entity';
import { DataSource, Repository } from 'typeorm';
import { IVariantProductService } from './interfaces/variant-product.service.interface';
import { IVariantProductGroupedResponse } from './interfaces/variant-product.response.interface';
import { Product } from '../product/entities/product.entity';
import { VariantAttributeValue } from '../attributes/variant-attribute-value/entities/variant-attribute-value.entity';
import { VariantProductMapper } from './mappers/variant-product.mapper';
import { runInTransaction } from 'src/common/helpers/transaction.helper';

@Injectable()
export class VariantProductService implements IVariantProductService {
  constructor(
    private readonly dataSource: DataSource,
  ) { }

  async create(data: CreateVariantProductDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const product = await manager.findOne(Product, { where: { id: data.productId } });
      if (!product) throw new NotFoundException('محصول مورد نظر یافت نشد');
      const variant = manager.create(VariantProduct, {
        sku: data.sku,
        price: data.price,
        stock: data.stock,
        product,
      });
      const savedVariant = await manager.save(VariantProduct, variant);

      const attributeValue = data.attributes.map((attr) =>
        manager.create(VariantAttributeValue, {
          variant: savedVariant,
          attributeId: attr.attributeId,
          valueId: attr.valueId,
          label: attr.label,
        })
      );

      await manager.save(VariantAttributeValue, attributeValue);
      const result = await manager.findOne(VariantProduct, {
        where: { id: savedVariant.id },
        relations: ['attributes', 'attributes.attribute', 'attributes.value']
      });

      return VariantProductMapper.toGroupedResponse(result!);

    })
  }

  findAll(): Promise<IVariantProductGroupedResponse[]> {
    throw new Error('Method not implemented.');
  }

  findOne(id: number): Promise<IVariantProductGroupedResponse> {
    throw new Error('Method not implemented.');
  }

  remove(id: number): Promise<string> {
    throw new Error('Method not implemented.');
  }

  update(id: number, data: UpdateVariantProductDto): Promise<IVariantProductGroupedResponse> {
    return runInTransaction(this.dataSource, async (manager) => {
      const variant = await manager.findOne(VariantProduct, { where: { id } });
      if (!variant) throw new NotFoundException('ویژگی محصول یافت نشد');
      manager.merge(VariantProduct, variant, data);
      await manager.delete(VariantAttributeValue, { variant: { id } });
      const newAttributes = data.attributes?.map((attr) =>
        manager.create(VariantAttributeValue, {
          variant,
          attributeId: attr.attributeId,
          valueId: attr.valueId,
          label: attr.label
        })
      );
      await manager.save(VariantAttributeValue, newAttributes!);
      const result = await manager.findOne(VariantProduct, {
        where: { id },
        relations: ['attributes', 'attributes.attribute', 'attribute.value']
      })
      return VariantProductMapper.toGroupedResponse(result!);
    })
  }
}
