import { AttributeUnit } from "src/common/enums/attribute.enum";
import { IProduct } from "../interfaces/product.interface";
import { IProductResponse } from "../interfaces/product.response";
import { VariantProduct } from "src/modules/variant-product/entities/variant-product.entity";
import { VariantAttributeValue } from "src/modules/attributes/variant-attribute-value/entities/variant-attribute-value.entity";

export class ProductMapper {

    private static uniqVariantAttributes(variant: VariantProduct): VariantAttributeValue[] {
        const map = new Map<string, VariantAttributeValue>();
        for (const va of (variant.attributes || [])) {
            const key = `${va.attributeId}:${va.valueId}`;
            if (!map.has(key)) map.set(key, va);
        }
        return [...map.values()];
    }

    private static buildVariantName(productName: string, variant: VariantProduct): string {
        const uniqAttrs = ProductMapper.uniqVariantAttributes(variant);
        const values = uniqAttrs
            .map((a) => a?.value?.value)
            .filter((v): v is string => !!v);
        return [productName, ...values].join(" ، ");
    }

    private static mapVariants(product: IProduct) {
        return (product.variants || []).map((v) => ({
            name: ProductMapper.buildVariantName(product.name, v),
            id: v.id,
            stock: v.stock,
            price: v.price,
            sku: v.sku || "",
            discount_amount: v.discountAmount ?? null,
            discount_percent: v.discountPercent ?? null,
            product_id: v.productId,

            attributes: (v.attributes || []).map((va) => ({
                id: va.id,
                variant_id: va.variantId,
                attribute_id: va.attributeId,
                value_id: va.valueId,
                attribute: va.attribute ? {
                    id: va.attribute.id,
                    name: va.attribute.name,
                    slug: (va.attribute as any).slug ?? null,
                    is_public: (va.attribute as any).isPublic ?? true,
                    group_id: va.attribute.group ? (va.attribute.group as any).id : null,
                    type: va.attribute.type,
                    display_order: va.attribute.displayOrder ?? null,
                    is_variant: va.attribute.isVariant ?? false,
                    values: (va.attribute.values || []).map((val) => ({
                        id: val.id,
                        value: val.value,
                        attribute_id: val.attributeId,
                        display_color: val.displayColor ?? null,
                        display_order: val.displayOrder ?? null,
                        is_active: val.isActive ?? true,
                    })),
                } : null,
            })),
        }));
    }

    static toResponse(product: IProduct): IProductResponse {
        return {
            id: product.id,
            category: product.category,
            medias: !product.media || product.media.length === 0 ? [] : product.media.map((m) => ({
                id: m.id,
                type: m.type,
                url: m.url,
            })),
            mediaPinned: {
                id: product.mediaPinned.id ?? 0,
                type: product.mediaPinned.type ?? 'image',
                url: product.mediaPinned.url ?? '',
            },
            name: product.name,
            mediaPinnedId: product.mediaPinnedId ?? 0,
            helper: product.helper,
            helperId: product.helperId,
            categoryId: product.categoryId,
            isFeatured: product.isFeatured,
            isLimitedStock: product.isLimitedStock,
            isVisible: product.isVisible,
            orderLimit: product.orderLimit,
            price: product.price,
            stock: product.stock,
            weight: product.weight,
            brand: product.brand,
            brandId: product.brandId,
            weightUnit: product.weightUnit,
            description: product.description,
            discountAmount: product.discountAmount,
            discountPercent: product.discountPercent,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            variants: ProductMapper.mapVariants(product),
        } as any;
    }
}
