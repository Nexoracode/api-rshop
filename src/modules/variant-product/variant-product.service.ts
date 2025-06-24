import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateVariantProductDto } from './dto/create-variant-product.dto';
import { UpdateVariantProductDto } from './dto/update-variant-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { VariantProduct } from './entities/variant-product.entity';
import { DataSource, In, Repository } from 'typeorm';
import { IVariantProductService } from './interfaces/variant-product.service.interface';
import { Product } from '../product/entities/product.entity';
import { VariantAttributeValue } from '../attributes/variant-attribute-value/entities/variant-attribute-value.entity';
import { VariantProductMapper } from './mappers/variant-product.mapper';
import { runInTransaction } from 'src/common/helpers/transaction.helper';
import { Attribute } from '../attributes/attribute/entities/attribute.entity';
import { IGroupedVariantProductResponse, IVariantProductGroupedResponse } from './interfaces/variant-product.response.interface';
import { AttributeValue } from '../attributes/attribute-value/entities/attribute-value.entity';

@Injectable()
export class VariantProductService implements IVariantProductService {
  constructor(
    @InjectRepository(VariantProduct)
    private readonly varRepo: Repository<VariantProduct>,
    private readonly dataSource: DataSource,
  ) { }

  async create(data: CreateVariantProductDto): Promise<IGroupedVariantProductResponse> {
    return runInTransaction(this.dataSource, async (manager) => {
      const product = await manager.findOne(Product, { where: { id: data.productId } });
      if (!product) throw new NotFoundException('محصول مورد نظر یافت نشد');
      const variant = manager.create(VariantProduct, {
        sku: data.sku,
        price: data.price,
        stock: data.stock,
        product,
      });
      for (const attr of data.attributes) {
        const attribute = await manager.findOne(Attribute, { where: { id: attr.attributeId } });
        if (!attribute) throw new NotFoundException('attributeId یافت نشد');

        const value = await manager.findOne(AttributeValue, { where: { id: attr.valueId } });
        if (!value) throw new NotFoundException('valueId یافت نشد');
      }
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
        relations: ['attributes', 'attributes.attribute', 'attributes.attribute.group', 'attributes.value']
      });

      return VariantProductMapper.toGroupedByGroupResponse(result!);

    })
  }

  async findAllByProductId(productId: number, grouped: boolean = false): Promise<IGroupedVariantProductResponse[] | IVariantProductGroupedResponse[]> {
    const variants = await this.varRepo.find({
      where: { product: { id: productId } },
      relations: ['attributes', 'attributes.attribute', 'attributes.attribute.group', 'attributes.value']
    })
    if (!variants || variants.length === 0) throw new NotFoundException('ویژگی محصولی برای این محصول یافت نشد');
    if (grouped) {
      return variants.map((variant) => VariantProductMapper.toGroupedByGroupResponse(variant));
    } else {
      return variants.map((variant) => VariantProductMapper.toGroupedResponse(variant));

    }
  }

  async findOne(id: number, grouped: boolean = false): Promise<IGroupedVariantProductResponse | IVariantProductGroupedResponse> {
    const variant = await this.varRepo.findOne({
      where: { id },
      relations: ['attributes', 'attributes.attribute', 'attributes.attribute.group', 'attributes.value']
    })
    if (!variant) throw new NotFoundException('ویژگی محصولی برای این محصول یافت نشد');
    if (grouped) {
      return VariantProductMapper.toGroupedResponse(variant);
    } else {
      return VariantProductMapper.toGroupedResponse(variant);

    }
  }

  remove(id: number): Promise<Object> {
    return runInTransaction(this.dataSource, async (manager) => {
      const variant = await manager.findOne(VariantProduct, { where: { id } });
      if (!variant) throw new NotFoundException('ویژگی مورد نظر یافت نشد.');
      await manager.remove(variant);
      return {
        message: 'حذف با موفقیت انجام شد',
        data: null,
      }
    })
  }

  update(id: number, data: UpdateVariantProductDto): Promise<IGroupedVariantProductResponse> {
    return runInTransaction(this.dataSource, async (manager) => {
      let variant = await manager.findOne(VariantProduct, { where: { id } });
      if (!variant) throw new NotFoundException('ویژگی محصول یافت نشد');
      const product = await manager.findOne(Product, { where: { id: data.productId } });
      if (!product) throw new NotFoundException('محصول مورد نظر یافت نشد');
      if (!data.attributes || !Array.isArray(data.attributes)) {
        throw new BadRequestException('مقدار ویژگی ارسال نشده یا نامعتبر است');
      }
      for (const attr of data.attributes) {
        const attribute = await manager.findOne(Attribute, { where: { id: attr.attributeId } });
        if (!attribute) throw new NotFoundException('attributeId یافت نشد');

        const value = await manager.findOne(AttributeValue, { where: { id: attr.valueId } });
        if (!value) throw new NotFoundException('valueId یافت نشد');
      }
      manager.merge(VariantProduct, variant, {
        sku: data.sku,
        price: data.price,
        stock: data.stock,
        product,
      });
      await manager.save(VariantProduct, variant);
      await manager.delete(VariantAttributeValue, { variant: { id } });
      const attributeValue = data.attributes.map((attr) =>
        manager.create(VariantAttributeValue, {
          variant,
          attributeId: attr.attributeId,
          valueId: attr.valueId,
          label: attr.label,
        })
      );
      await manager.save(VariantAttributeValue, attributeValue);
      const result = await manager.findOne(VariantProduct, {
        where: { id },
        relations: ['attributes', 'attributes.attribute', 'attributes.attribute.group', 'attributes.value']
      });
      return VariantProductMapper.toGroupedByGroupResponse(result!);
    })
  }
}
