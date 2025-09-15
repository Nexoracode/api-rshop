import { VariantAttributeValue } from "src/modules/attributes/variant-attribute-value/entities/variant-attribute-value.entity";
import { VariantProduct } from "../entities/variant-product.entity";
import { IGroupedVariantProductResponse, IVariantAttributeValueResponse, IVariantProductGroupedResponse } from "../interfaces/variant-product.response.interface";

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

            // جلوگیری از دابلیکیت
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


    static toGroupedResponse(entity: VariantProduct): IVariantProductGroupedResponse {
        return {
            id: entity.id,
            sku: entity.sku,
            stock: entity.stock,
            price: entity.price,
            attributes: (entity.attributes || []).map((attr: VariantAttributeValue): IVariantAttributeValueResponse => ({
                attributeId: attr.attribute?.id,
                attributeName: attr.attribute?.name,
                valueId: attr.value?.id,
                value: attr.value?.value,
                isVariant: attr.attribute?.isVariant,
            })),
        };
    }
}