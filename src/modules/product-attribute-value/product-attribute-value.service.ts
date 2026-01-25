// product-attribute-value.service.ts
import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, In } from "typeorm";
import { ProductAttributeValue } from "./entities/product-attribute-value.entity";
import { CreateProductAttributeValueDto } from "./dto/create-product-attribute-value.dto";
import { UpdateProductAttributeValueDto } from "./dto/update-product-attribute-value.dto";
import { Product } from "../product/entities/product.entity";
import { Attribute } from "../attributes/attribute/entities/attribute.entity";
import { AttributeValue } from "../attributes/attribute-value/entities/attribute-value.entity";
import { ProductAttributeValueMapper } from "./mappers/product-attribute-value.mapper";
import { runInTransaction } from "src/common/helpers/transaction.helper";
import { CategoryAttribute } from "../category-attribute/entities/category-attribute.entity";
import { AddedImportantDto } from "./dto/added-important.dto";
import { ProductCacheService } from "../product/cache";
import { CatalogCacheService } from "../catalogs/cache";

@Injectable()
export class ProductAttributeValueService {
  constructor(
    @InjectRepository(ProductAttributeValue)
    private readonly pavRepo: Repository<ProductAttributeValue>,
    private readonly productCatchService: ProductCacheService,
    private readonly catalogCatchService: CatalogCacheService,
    private readonly dataSource: DataSource,
  ) { }

  async create(dto: CreateProductAttributeValueDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const product = await manager.findOne(Product, { where: { id: dto.productId } });
      if (!product) throw new NotFoundException("محصول یافت نشد");

      const attribute = await manager.findOne(Attribute, { where: { id: dto.attributeId } });
      if (!attribute) throw new NotFoundException("ویژگی یافت نشد");

      const existsAttributeProduct = await manager.findOne(ProductAttributeValue, {
        where: {
          value: { id: In(dto.valueIds ?? []) },
          attribute: { id: dto.attributeId },
          product: { id: dto.productId }
        },
        select: ['id'],
      })

      if (existsAttributeProduct) {
        throw new BadRequestException('برای این محصول، این ویژگی با این مقدار قبلا ثبت شده است.');
      }

      const equalValue = await manager.findOne(AttributeValue, {
        where: {
          id: In(dto.valueIds ?? []),
          attribute: { id: dto.attributeId },
        },
        select: ['id'],
      })

      if (!equalValue) {
        throw new BadRequestException('مقادیر ارسالی با ویژگی انتخاب شده همخوانی ندارد.');
      }

      const isVariantAttribute = await manager.findOne(Attribute, {
        where: {
          id: dto.attributeId,
          isVariant: true,
        },
        select: ['id', 'isVariant'],
      })

      if (isVariantAttribute) {
        throw new BadRequestException('تنوع محصول را نمی شود به ویژگی محصول اختصاص داد.');
      }

      const existsCategoryAttr = await manager.findOne(CategoryAttribute, {
        where: {
          attribute: { id: dto.attributeId },
          category: { id: product.categoryId },
        },
        select: ['id'],
      });

      if (!existsCategoryAttr) {
        const createCat = manager.create(CategoryAttribute, {
          attribute,
          category: product.category,
          categoryId: product.categoryId,
        });
        await manager.save(CategoryAttribute, createCat);
      }


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
      // ✅ پاک کردن cache بعد از update
      await this.productCatchService.clearProductCache(product.id);
      await this.catalogCatchService.clearAllCatalogCache();
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
      // ✅ پاک کردن cache بعد از update
      await this.productCatchService.clearProductCache(product.id);
      await this.catalogCatchService.clearAllCatalogCache();
      return ProductAttributeValueMapper.toResponses(created);
    });
  }

  async addedImportant(dto: AddedImportantDto) {
    const pav = await this.pavRepo.find({ where: { attributeId: dto.attributeId, productId: dto.productId } });
    if (!pav.length) throw new NotFoundException('مقدار ویژگی یافت نشد یا این ویژگی به این محصول اختصاص ندارد.');
    pav.forEach(p => p.isImportant = dto.important);
    await this.pavRepo.save(pav);
    // ✅ پاک کردن cache بعد از update
    await this.productCatchService.clearProductCache(dto.productId);
    await this.catalogCatchService.clearAllCatalogCache();
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
