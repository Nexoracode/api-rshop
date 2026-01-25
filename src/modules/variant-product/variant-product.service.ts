import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, In } from "typeorm";
import { CreateVariantProductDto } from "./dto/create-variant-product.dto";
import { UpdateVariantProductDto } from "./dto/update-variant-product.dto";
import { VariantProduct } from "./entities/variant-product.entity";
import { Product } from "../product/entities/product.entity";
import { VariantAttributeValue } from "../attributes/variant-attribute-value/entities/variant-attribute-value.entity";
import { VariantProductMapper } from "./mappers/variant-product.mapper";
import { runInTransaction } from "src/common/helpers/transaction.helper";
import { ProductCacheService } from "../product/cache";
import { CatalogCacheService } from "../catalogs/cache";

type Pair = { attributeId: number; valueId: number };
function cartesian<T>(arr: T[][]): T[][] {
  if (!arr.length) return [];
  return arr.reduce((a, b) => a.flatMap(x => b.map(y => [...x, y])), [[]] as T[][]);
}

function buildKeyFromPairs(pairs: Pair[]): string {
  return pairs.map(p => `${p.attributeId}:${p.valueId}`).sort().join("|");
}

function buildKeyFromVariant(v: VariantProduct): string {
  return (v.attributes || [])
    .map(va => `${va.attribute.id}:${va.value.id}`)
    .sort()
    .join("|");
}

function buildDeterministicSku(baseSku: string, combo: Pair[], productId: number): string {
  const suffix = combo.map(p => p.valueId).sort((a, b) => a - b).join("-");
  return `${baseSku}-${productId}-${suffix}`;
}

async function ensureUniqueSku(
  manager: any,
  sku: string
): Promise<string> {
  let finalSku = sku;
  let bump = 0;
  while (await manager.findOne(VariantProduct, { where: { sku: finalSku } })) {
    bump += 1;
    finalSku = `${sku}-${bump}`;
  }
  return finalSku;
}
@Injectable()
export class VariantProductService {
  constructor(
    @InjectRepository(VariantProduct)
    private readonly varRepo: Repository<VariantProduct>,
    private readonly productCatchService: ProductCacheService,
    private readonly catalogCatchService: CatalogCacheService,
    private readonly dataSource: DataSource
  ) { }



  async create(dto: CreateVariantProductDto) {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: dto.productId },
        relations: [
          "variants",
          "variants.attributes",
          "variants.attributes.attribute",
          "variants.attributes.value",
          "variants.attributes.attribute.group",
        ],
      });
      if (!product) throw new NotFoundException("محصول یافت نشد");

      // 1) اتریبیوت/والیوی موجود از DB
      const attrMap = new Map<number, Set<number>>();
      for (const v of product.variants || []) {
        for (const va of v.attributes || []) {
          const set = attrMap.get(va.attribute.id) ?? new Set<number>();
          set.add(va.value.id);
          attrMap.set(va.attribute.id, set);
        }
      }

      // 2) اتریبیوت/والیوی جدید از ورودی
      for (const a of dto.attributes) {
        if (!Array.isArray(a.valueIds) || a.valueIds.length === 0) {
          throw new BadRequestException("value_ids برای هر attribute الزامی است");
        }
        const set = attrMap.get(a.attributeId) ?? new Set<number>();
        for (const vid of a.valueIds) set.add(vid);
        attrMap.set(a.attributeId, set);
      }

      if (attrMap.size === 0) {
        throw new BadRequestException("حداقل یک اتریبیوت لازم است");
      }

      // 3) ساخت ورودی کارتیزین از union همهٔ اتریبیوت‌ها
      const perAttribute: Pair[][] = [...attrMap.entries()].map(([aid, set]) => {
        return [...set.values()].map(vid => ({ attributeId: aid, valueId: vid }));
      });
      const combos = cartesian(perAttribute);

      // 4) ایندکس از Variantهای موجود (کلید = attrId:valId|…)
      const existingIndex = new Map<string, VariantProduct>();
      for (const v of product.variants || []) {
        const key = buildKeyFromVariant(v);
        existingIndex.set(key, v);
      }

      const createdOrExisting: VariantProduct[] = [];

      // 5) برای هر ترکیب: اگر نبود بساز، اگر بود نگه دار
      for (const combo of combos) {
        const key = buildKeyFromPairs(combo);

        if (existingIndex.has(key)) {
          createdOrExisting.push(existingIndex.get(key)!);
          continue;
        }

        // SKU یکتا و قطعی
        const deterministic = buildDeterministicSku(dto.sku, combo, product.id);
        const uniqueSku = `${deterministic}sdk${product.id}`

        const variant = manager.create(VariantProduct, {
          sku: uniqueSku,
          price: dto.price,
          stock: dto.stock,
          discountAmount: dto.discountAmount ?? 0,
          discountPercent: dto.discountPercent ?? 0,
          product,
        });
        const saved = await manager.save(variant);

        const vavs = combo.map(p =>
          manager.create(VariantAttributeValue, {
            variant: saved,
            attributeId: p.attributeId,
            valueId: p.valueId,
          })
        );
        await manager.save(VariantAttributeValue, vavs);

        createdOrExisting.push(saved);
        existingIndex.set(key, saved);
      }

      // (اختیاری) 6) پاکسازی واریانت‌های ناقص (آنهایی که همهٔ اتریبیوت‌های محصول را ندارند)
      // اگر نمی‌خواهی چیزی پاک شود، این بلوک را حذف کن.
      const fullAttrCount = attrMap.size;
      const toRemove: number[] = [];
      for (const v of product.variants || []) {
        const uniqAttrCount = new Set(v.attributes?.map(va => va.attribute.id) ?? []).size;
        if (uniqAttrCount < fullAttrCount) {
          toRemove.push(v.id);
        }
      }
      if (toRemove.length) {
        await manager.delete(VariantAttributeValue, { variant: { id: In(toRemove) } });
        await manager.delete(VariantProduct, { id: In(toRemove) });
      }

      // 7) برگرداندن واریانت‌ها با روابط برای مپر
      const variants = await manager.find(VariantProduct, {
        where: { product: { id: product.id } },
        relations: [
          "attributes",
          "attributes.attribute",
          "attributes.value",
          "attributes.attribute.group",
        ],
        order: { id: "ASC" },
      });

      // ✅ پاک کردن cache بعد از update
      await this.productCatchService.clearProductCache(product.id);
      await this.catalogCatchService.clearAllCatalogCache();

      return variants; // یا از همین‌جا Mapper خودت رو صدا بزن
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

  async update(variantId: number, dto: UpdateVariantProductDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const variant = await manager.findOne(VariantProduct, {
        where: {
          id: variantId
        }
      });
      if (!variant) throw new NotFoundException('نوع محصول یافت نشد.');
      const update = manager.merge(VariantProduct, variant, dto);
      const saved = await manager.save(VariantProduct, update);
      // ✅ پاک کردن cache بعد از update
      await this.productCatchService.clearProductCache(variant.productId);
      await this.catalogCatchService.clearAllCatalogCache();
      return saved;
    });
  }

  async remove(id: number) {
    return this.dataSource.transaction(async (manager) => {
      const variant = await manager.findOne(VariantProduct, {
        where: { id },
      });
      if (!variant) throw new NotFoundException("Variant یافت نشد");

      await manager.delete(VariantAttributeValue, { variant: { id } });
      await manager.delete(VariantProduct, { id });

      const variants = await manager.find(VariantProduct, {
        where: { product: { id: variant.productId } },
        relations: ["attributes", "attributes.attribute", "attributes.value"],
      });
      // ✅ پاک کردن cache بعد از update
      await this.productCatchService.clearProductCache(variant.productId);
      await this.catalogCatchService.clearAllCatalogCache();

      return {
        success: true,
        message: "Variant با موفقیت حذف شد",
      };
    });
  }

  async removeByVariant(productId: number, attributeId: number, valueId: number) {
    return this.dataSource.transaction(async (manager) => {
      // پیدا کردن Variantهای محصول
      const variants = await manager.find(VariantProduct, {
        where: { product: { id: productId } },
        relations: ["attributes", "attributes.attribute", "attributes.value"],
      });

      const affectedVariants = variants.filter((v) =>
        v.attributes.some(
          (va) => va.attribute.id === attributeId && va.value.id === valueId
        )
      );

      if (!affectedVariants.length) {
        throw new NotFoundException("هیچ Variant شامل این مقدار یافت نشد");
      }

      // حذف فقط value مشخص از Variantها
      for (const variant of affectedVariants) {
        await manager.delete(VariantAttributeValue, {
          variant: { id: variant.id },
          attributeId,
          valueId,
        });
      }

      // دوباره لود برای خروجی
      const updatedVariants = await manager.find(VariantProduct, {
        where: { product: { id: productId } },
        relations: ["attributes", "attributes.attribute", "attributes.value"],
      });
      await this.productCatchService.clearProductCache(productId);
      await this.catalogCatchService.clearAllCatalogCache();

      return {
        success: true,
        message: "مقدار از Variant ها حذف شد",
        updatedVariants,
      };
    });
  }
}
