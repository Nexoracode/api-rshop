// product-attribute-value.service.ts
import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { ProductAttributeValue } from "./entities/product-attribute-value.entity";
import { CreateProductAttributeValueDto } from "./dto/create-product-attribute-value.dto";
import { UpdateProductAttributeValueDto } from "./dto/update-product-attribute-value.dto";
import { Product } from "../product/entities/product.entity";
import { Attribute } from "../attributes/attribute/entities/attribute.entity";
import { AttributeValue } from "../attributes/attribute-value/entities/attribute-value.entity";
import { ProductAttributeValueMapper } from "./mappers/product-attribute-value.mapper";
import { runInTransaction } from "src/common/helpers/transaction.helper";

@Injectable()
export class ProductAttributeValueService {
  constructor(
    @InjectRepository(ProductAttributeValue)
    private readonly pavRepo: Repository<ProductAttributeValue>,
    private readonly dataSource: DataSource,
  ) { }

  async create(dto: CreateProductAttributeValueDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const product = await manager.findOne(Product, { where: { id: dto.productId } });
      if (!product) throw new NotFoundException("محصول یافت نشد");

      const attribute = await manager.findOne(Attribute, { where: { id: dto.attributeId } });
      if (!attribute) throw new NotFoundException("ویژگی یافت نشد");

      const created: ProductAttributeValue[] = [];

      if (dto.valueIds && dto.valueIds.length > 0) {
        for (const valueId of dto.valueIds) {
          const value = await manager.findOne(AttributeValue, { where: { id: valueId } });
          if (!value) throw new NotFoundException(`مقدار ${valueId} یافت نشد`);
          const lastProductAttributeValue = await manager.find(ProductAttributeValue, {
            order: { displayOrder: 'DESC' },
            take: 1,
          });
          const nextOrder = lastProductAttributeValue.length > 0 ? lastProductAttributeValue[0].displayOrder + 1 : 1;
          const pav = manager.create(ProductAttributeValue, {
            product,
            attribute,
            value,
            displayOrder: nextOrder,
          });
          created.push(await manager.save(pav));
        }
      }
      return ProductAttributeValueMapper.toResponses(created);
    });
  }

  async findByProduct(productId: number) {
    const values = await this.pavRepo.find({
      where: { product: { id: productId } },
      relations: ["attribute", "value"],
    });
    return ProductAttributeValueMapper.toGroupedByAttribute(values);
  }

  async update(productId: number, attributeId: number, dto: UpdateProductAttributeValueDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const product = await manager.findOne(Product, { where: { id: productId } });
      if (!product) throw new NotFoundException("محصول یافت نشد");

      const attribute = await manager.findOne(Attribute, { where: { id: attributeId } });
      if (!attribute) throw new NotFoundException("ویژگی یافت نشد");

      await manager.delete(ProductAttributeValue, {
        product: { id: productId },
        attribute: { id: attributeId },
      });

      const created: ProductAttributeValue[] = [];

      // valueIds
      if (dto.valueIds && dto.valueIds.length > 0) {
        for (const valueId of dto.valueIds) {
          const value = await manager.findOne(AttributeValue, { where: { id: valueId } });
          if (!value) throw new NotFoundException(`مقدار ${valueId} یافت نشد`);

          const pav = manager.create(ProductAttributeValue, {
            product,
            attribute,
            value,
          });
          created.push(await manager.save(pav));
        }
      }
      return ProductAttributeValueMapper.toResponses(created);
    });
  }

  async addedImportant(id: number, isImportant: boolean) {
    const pav = await this.pavRepo.findOne({ where: { id } });
    if (!pav) throw new NotFoundException('مقدار ویژگی مورد نظر یافت نشد.');
    pav.isImportant = isImportant;
    await this.pavRepo.save(pav);
    return {
      message: 'ویژگی با موفقیت به عنوان ویژگی مهم تنظیم شد',
      data: null,
    }
  }

  async remove(id: number) {
    return runInTransaction(this.dataSource, async (manager) => {
      const pav = await manager.findOne(ProductAttributeValue, { where: { id } });
      if (!pav) throw new NotFoundException("ویژگی محصول یافت نشد");

      await manager.remove(pav);
      return { success: true, message: "ویژگی محصول حذف شد" };
    });
  }

  async updateOrder(id: number, order: number): Promise<Object> {
    const value = await this.pavRepo.findOne({ where: { id } });
    if (!value) throw new NotFoundException('مقدار ویژگی مورد نظر یافت نشد.');
    value.displayOrder = order;
    await this.pavRepo.save(value);
    return {
      message: 'ترتیب با موفقیت انجام شد',
      data: null,
    }
  }

  async removeByProductAttribute(
    productId: number,
    attributeId: number,
    valueId?: number,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const specs = await manager.find(ProductAttributeValue, {
        where: { product: { id: productId }, attribute: { id: attributeId } },
        relations: ["attribute", "value"],
      });

      if (!specs || specs.length === 0) {
        throw new NotFoundException("هیچ مشخصه‌ای برای این محصول یافت نشد");
      }

      const affected = specs.filter((spec) => {
        if (valueId && spec.value?.id === valueId) return true;
        return false;
      });

      if (!affected.length) {
        throw new NotFoundException("هیچ مقدار مطابق با شرایط یافت نشد");
      }

      for (const spec of affected) {
        await manager.delete(ProductAttributeValue, { id: spec.id });
      }

      const updatedSpecs = await manager.find(ProductAttributeValue, {
        where: { product: { id: productId } },
        relations: ["attribute", "attribute.group", "value"],
      });

      return {
        success: true,
        message: "مقدار از مشخصات محصول حذف شد",
        updatedSpecifications: updatedSpecs,
      };
    });
  }
}
