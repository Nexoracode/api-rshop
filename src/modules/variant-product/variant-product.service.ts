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

      if (!data.attributes?.length) {
        throw new BadRequestException('حداقل یک ویژگی باید ارسال شود');
      }

      // بررسی attributeId ها و valueId ها به صورت یکجا
      const attrIds = data.attributes.map(a => a.attributeId);
      const valIds = data.attributes.map(a => a.valueId);

      const attributes = await manager.find(Attribute, { where: { id: In(attrIds) } });
      if (attributes.length !== attrIds.length) throw new NotFoundException('بعضی attributeId معتبر نیست');

      const values = await manager.find(AttributeValue, { where: { id: In(valIds) } });
      if (values.length !== valIds.length) throw new NotFoundException('بعضی valueId معتبر نیست');

      // جلوگیری از ثبت دابلیکیت
      const existingVariant = await manager.findOne(VariantProduct, {
        where: { product: { id: product.id } },
        relations: ['attributes'],
      });

      if (existingVariant) {
        const existingPairs = existingVariant.attributes.map(av => `${av.attributeId}:${av.valueId}`);
        const newPairs = data.attributes.map(av => `${av.attributeId}:${av.valueId}`);

        const isDuplicate = newPairs.every(p => existingPairs.includes(p));
        if (isDuplicate) throw new BadRequestException('این ترکیب ویژگی قبلاً ثبت شده است');
      }

      // ساخت و ذخیره variant
      const variant = manager.create(VariantProduct, { ...data, product });
      const savedVariant = await manager.save(variant);

      const attributeValueEntities = data.attributes.map((attr) =>
        manager.create(VariantAttributeValue, {
          variant: savedVariant,
          attributeId: attr.attributeId,
          valueId: attr.valueId,
        })
      );
      await manager.save(VariantAttributeValue, attributeValueEntities);

      const result = await manager.findOne(VariantProduct, {
        where: { id: savedVariant.id },
        relations: ['attributes', 'attributes.attribute', 'attributes.attribute.group', 'attributes.value']
      });

      return VariantProductMapper.toGroupedByGroupResponse(result!);
    });
  }

  async findAllByProductId(productId: number, grouped = false): Promise<IGroupedVariantProductResponse[] | IVariantProductGroupedResponse[]> {
    const variants = await this.varRepo.find({
      where: { product: { id: productId } },
      relations: ['attributes', 'attributes.attribute', 'attributes.attribute.group', 'attributes.value']
    });
    if (!variants.length) throw new NotFoundException('ویژگی محصولی برای این محصول یافت نشد');
    return grouped
      ? variants.map((variant) => VariantProductMapper.toGroupedByGroupResponse(variant))
      : variants.map((variant) => VariantProductMapper.toGroupedResponse(variant));
  }

  async findOne(id: number, grouped = false): Promise<IGroupedVariantProductResponse | IVariantProductGroupedResponse> {
    const variant = await this.varRepo.findOne({
      where: { id },
      relations: ['attributes', 'attributes.attribute', 'attributes.attribute.group', 'attributes.value']
    });
    if (!variant) throw new NotFoundException('ویژگی محصول یافت نشد');
    return grouped
      ? VariantProductMapper.toGroupedByGroupResponse(variant)
      : VariantProductMapper.toGroupedResponse(variant);
  }

  async remove(id: number): Promise<Object> {
    return runInTransaction(this.dataSource, async (manager) => {
      const variant = await manager.findOne(VariantProduct, { where: { id } });
      if (!variant) throw new NotFoundException('ویژگی مورد نظر یافت نشد');
      await manager.remove(variant);
      return { message: 'حذف با موفقیت انجام شد', data: null };
    });
  }

  async update(id: number, data: UpdateVariantProductDto): Promise<IGroupedVariantProductResponse> {
    return runInTransaction(this.dataSource, async (manager) => {
      const variant = await manager.findOne(VariantProduct, { where: { id } });
      if (!variant) throw new NotFoundException('ویژگی محصول یافت نشد');

      const product = await manager.findOne(Product, { where: { id: data.productId } });
      if (!product) throw new NotFoundException('محصول مورد نظر یافت نشد');

      if (!data.attributes?.length) throw new BadRequestException('ویژگی‌ها ارسال نشده یا نامعتبر است');

      const attrIds = data.attributes.map(a => a.attributeId);
      const valIds = data.attributes.map(a => a.valueId);

      const attributes = await manager.find(Attribute, { where: { id: In(attrIds) } });
      if (attributes.length !== attrIds.length) throw new NotFoundException('بعضی attributeId معتبر نیست');

      const values = await manager.find(AttributeValue, { where: { id: In(valIds) } });
      if (values.length !== valIds.length) throw new NotFoundException('بعضی valueId معتبر نیست');

      manager.merge(VariantProduct, variant, {
        sku: data.sku,
        price: data.price,
        stock: data.stock,
        product,
      });
      await manager.save(variant);

      await manager.delete(VariantAttributeValue, { variant: { id } });

      const attributeValueEntities = data.attributes.map((attr) =>
        manager.create(VariantAttributeValue, {
          variant,
          attributeId: attr.attributeId,
          valueId: attr.valueId,
        })
      );
      await manager.save(VariantAttributeValue, attributeValueEntities);

      const result = await manager.findOne(VariantProduct, {
        where: { id },
        relations: ['attributes', 'attributes.attribute', 'attributes.attribute.group', 'attributes.value']
      });

      return VariantProductMapper.toGroupedByGroupResponse(result!);
    });
  }
}
