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
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Attribute)
    private readonly attrRepo: Repository<Attribute>,
    @InjectRepository(AttributeValue)
    private readonly valRepo: Repository<AttributeValue>,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * ایجاد ویژگی برای یک محصول (multi-value پشتیبانی می‌شود)
   */
  async create(dto: CreateProductAttributeValueDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const product = await manager.findOne(Product, { where: { id: dto.productId } });
      if (!product) throw new NotFoundException("محصول یافت نشد");

      const attribute = await manager.findOne(Attribute, { where: { id: dto.attributeId } });
      if (!attribute) throw new NotFoundException("ویژگی یافت نشد");

      if ((!dto.valueIds || dto.valueIds.length === 0) && (!dto.customValues || dto.customValues.length === 0)) {
        throw new BadRequestException("حداقل یک مقدار باید ارسال شود");
      }

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

      // customValues
      if (dto.customValues && dto.customValues.length > 0) {
        for (const custom of dto.customValues) {
          const pav = manager.create(ProductAttributeValue, {
            product,
            attribute,
            customValue: custom,
          });
          created.push(await manager.save(pav));
        }
      }

      return ProductAttributeValueMapper.toResponses(created);
    });
  }

  /**
   * دریافت همه ویژگی‌های توصیفی محصول
   */
  async findByProduct(productId: number) {
    const values = await this.pavRepo.find({
      where: { product: { id: productId } },
      relations: ["attribute", "value"],
    });
    return ProductAttributeValueMapper.toGroupedByAttribute(values);
  }

  /**
   * بروزرسانی همه مقادیر یک attribute برای یک محصول
   */
  async update(productId: number, attributeId: number, dto: UpdateProductAttributeValueDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const product = await manager.findOne(Product, { where: { id: productId } });
      if (!product) throw new NotFoundException("محصول یافت نشد");

      const attribute = await manager.findOne(Attribute, { where: { id: attributeId } });
      if (!attribute) throw new NotFoundException("ویژگی یافت نشد");

      // پاک کردن همه مقادیر قبلی
      await manager.delete(ProductAttributeValue, {
        product: { id: productId },
        attribute: { id: attributeId },
      });

      if ((!dto.valueIds || dto.valueIds.length === 0) && (!dto.customValues || dto.customValues.length === 0)) {
        return []; // یعنی خالی شد
      }

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

      // customValues
      if (dto.customValues && dto.customValues.length > 0) {
        for (const custom of dto.customValues) {
          const pav = manager.create(ProductAttributeValue, {
            product,
            attribute,
            customValue: custom,
          });
          created.push(await manager.save(pav));
        }
      }

      return ProductAttributeValueMapper.toResponses(created);
    });
  }

  /**
   * حذف یک ویژگی محصول
   */
  async remove(id: number) {
    return runInTransaction(this.dataSource, async (manager) => {
      const pav = await manager.findOne(ProductAttributeValue, { where: { id } });
      if (!pav) throw new NotFoundException("ویژگی محصول یافت نشد");

      await manager.remove(pav);
      return { success: true, message: "ویژگی محصول حذف شد" };
    });
  }
}
