import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, In } from "typeorm";
import { CreateVariantProductDto } from "./dto/create-variant-product.dto";
import { UpdateVariantProductDto } from "./dto/update-variant-product.dto";
import { VariantProduct } from "./entities/variant-product.entity";
import { Product } from "../product/entities/product.entity";
import { VariantAttributeValue } from "../attributes/variant-attribute-value/entities/variant-attribute-value.entity";
import { VariantProductMapper } from "./mappers/variant-product.mapper";

function cartesian<T>(arr: T[][]): T[][] {
  return arr.reduce(
    (a, b) => a.flatMap((x) => b.map((y) => [...x, y])),
    [[]] as T[][]
  );
}

@Injectable()
export class VariantProductService {
  constructor(
    @InjectRepository(VariantProduct)
    private readonly varRepo: Repository<VariantProduct>,
    private readonly dataSource: DataSource
  ) { }

  async create(dto: CreateVariantProductDto) {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, { where: { id: dto.productId } });
      if (!product) throw new NotFoundException("محصول یافت نشد");

      // آماده‌سازی لیست valueها برای هر attribute
      const perAttribute = dto.attributes.map((a) =>
        a.valueIds.map((vid) => ({ attributeId: a.attributeId, valueId: vid }))
      );

      // تولید همه ترکیب‌ها
      const combos = cartesian(perAttribute);

      const createdVariants: VariantProduct[] = [];

      for (const combo of combos) {
        // ساخت Variant
        const variant = manager.create(VariantProduct, {
          sku: `${dto.sku}-${combo.map((c) => c.valueId).join("-")}`, // مثال SKU
          price: dto.price,
          stock: dto.stock,
          discountAmount: dto.discountAmount,
          discountPercent: dto.discountPercent,
          product,
        });
        const savedVariant = await manager.save(variant);

        // ذخیره attribute/valueهای مربوطه
        const vavs = combo.map((c) =>
          manager.create(VariantAttributeValue, {
            variant: savedVariant,
            attributeId: c.attributeId,
            valueId: c.valueId,
          })
        );
        await manager.save(vavs);

        createdVariants.push(savedVariant);
      }

      return createdVariants;
    });
  }


  async findOne(id: number) {
    const variant = await this.varRepo.findOne({
      where: { id },
      relations: ["product", "attributes", "attributes.attribute", "attributes.value", "attributes.attribute.group"],
    });
    if (!variant) throw new NotFoundException("Variant یافت نشد");
    return VariantProductMapper.toResponse(variant, variant.product);
  }

  async update(productId: number, dto: UpdateVariantProductDto) {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, { where: { id: productId } });
      if (!product) throw new NotFoundException("محصول یافت نشد");

      // 1. حذف همه variantهای قدیمی محصول
      const oldVariants = await manager.find(VariantProduct, {
        where: { product: { id: productId } },
      });
      if (oldVariants.length > 0) {
        const oldIds = oldVariants.map((v) => v.id);
        await manager.delete(VariantAttributeValue, { variant: { id: In(oldIds) } });
        await manager.delete(VariantProduct, { id: In(oldIds) });
      }

      // 2. ساخت combos از attributes
      const perAttribute = dto.attributes?.map((a) =>
        a.valueIds.map((vid) => ({ attributeId: a.attributeId, valueId: vid }))
      );
      const combos = cartesian(perAttribute!);

      const createdVariants: VariantProduct[] = [];

      // 3. ذخیره Variantها و attribute/valueهایشان
      for (const combo of combos) {
        const variant = manager.create(VariantProduct, {
          sku: `${dto.sku}-${combo.map((c) => c.valueId).join("-")}`,
          price: dto.price,
          stock: dto.stock,
          discountAmount: dto.discountAmount,
          discountPercent: dto.discountPercent,
          product,
        });
        const savedVariant = await manager.save(variant);

        const vavs = combo.map((c) =>
          manager.create(VariantAttributeValue, {
            variant: savedVariant,
            attributeId: c.attributeId,
            valueId: c.valueId,
          })
        );
        await manager.save(vavs);

        createdVariants.push(savedVariant);
      }

      return createdVariants;
    });
  }


  async remove(id: number) {
    return this.dataSource.transaction(async (manager) => {
      const variant = await manager.findOne(VariantProduct, {
        where: { id },
        relations: ["attributes"], // 👈 برای اطمینان از لود شدن روابط
      });

      if (!variant) throw new NotFoundException("Variant یافت نشد");

      // اگر cascade کامل داری:
      await manager.remove(VariantProduct, variant);

      // اگر cascade نداری باید این کارو بکنی:
      // await manager.delete(VariantAttributeValue, { variant: { id } });
      // await manager.delete(VariantProduct, { id });

      return { success: true, message: "Variant با موفقیت حذف شد" };
    });
  }
}
