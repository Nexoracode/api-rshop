import { VariantAttributeValue } from "src/modules/attributes/variant-attribute-value/entities/variant-attribute-value.entity";
import { VariantProduct } from "../entities/variant-product.entity";
import { IGroupedVariantProductResponse, IVariantAttributeValueResponse, IVariantProductGroupedResponse } from "../interfaces/variant-product.response.interface";
import { Product } from "src/modules/product/entities/product.entity";

export class VariantProductMapper {
    static toGroupedByGroupResponse(entity: VariantProduct): IGroupedVariantProductResponse {
        const grouped: Record<number | string, {
            groupId: number | null;
            groupName: string;
            attributes: {
                attributeId: number;
                attributeName: string;
                valueId: number;
                value: string;
                isVariant: boolean;
            }[];
        }> = {};

        for (const attr of entity.attributes || []) {
            const groupId = attr.attribute?.group?.id ?? 'ungrouped';
            const groupName = attr.attribute?.group?.name ?? 'بدون گروه';

            if (!grouped[groupId]) {
                grouped[groupId] = {
                    groupId: attr.attribute?.group?.id ?? null,
                    groupName: groupName ?? 'بدون گروه',
                    attributes: [],
                };
            }

            const exists = grouped[groupId].attributes.some(
                (a) => a.attributeId === attr.attribute?.id && a.valueId === attr.value?.id
            );

            if (!exists) {
                grouped[groupId].attributes.push({
                    attributeId: attr.attribute?.id,
                    attributeName: attr.attribute?.name,
                    valueId: attr.value?.id,
                    value: attr.value?.value,
                    isVariant: attr.attribute.isVariant,
                });
            }
        }

        return {
            id: entity.id,
            sku: entity.sku,
            stock: entity.stock,
            price: entity.price,
            groups: Object.values(grouped),
        };
    }


    static toResponse(variant: VariantProduct, product: Product) {
        const attrs = (variant.attributes || []).map((va: VariantAttributeValue) => ({
            id: va.attribute.id,
            name: va.attribute.name,
            slug: va.attribute.slug,
            is_public: va.attribute.isPublic,
            group_id: va.attribute.group?.id ?? null,
            type: va.attribute.type,
            display_order: va.attribute.displayOrder,
            is_variant: va.attribute.isVariant,
            values: {
                id: va.value.id,
                value: va.value.value,
                attribute_id: va.value.attributeId,
                display_color: va.value.displayColor,
                is_active: va.value.isActive,
                display_order: va.value.displayOrder,
            },
        }));

        const values = attrs.map((a) => a.values?.value).filter(Boolean);
        const name = [product.name, ...values].join(" , ");

        return {
            name,
            id: variant.id,
            product_id: product.id,
            sku: variant.sku,
            price: variant.price,
            discount_amount: variant.discountAmount,
            discount_percent: variant.discountPercent,
            stock: variant.stock,
            attributes: attrs,
        };
    }
}