import { VariantProduct } from "../entities/variant-product.entity";
import { IVariantProductGroupedResponse, IVariantProductResponse, VariantGroupItem } from "../interfaces/variant-product.response.interface";

export class VariantProductMapper {
    static toGroupedResponse(variant: VariantProduct): IVariantProductGroupedResponse {
        const grouped: Record<string, VariantGroupItem[]> = {};
        for (const attr of variant.attributes || []) {
            const groupName = attr.attribute?.group?.name || 'عمومی';
            if (!grouped[groupName]) grouped[groupName] = [];
            grouped[groupName].push({
                attribute: attr.attribute?.name || "عمومی",
                value: attr.value?.value || "عمومی",
                label: attr.label,
            });
        }

        return {
            id: variant.id,
            sku: variant.sku,
            price: variant.price,
            stock: variant.stock,
            productId: variant.productId,
            variants: Object.entries(grouped).map(([groupName, items]) => ({ groupName, items }))
        };
    }


    static toGroupResponseList(variants: VariantProduct[]): IVariantProductGroupedResponse[] {
        return variants.map(variant => this.toGroupedResponse(variant))
    }

    static toFlatResponse(variant: VariantProduct): IVariantProductResponse {
        return {
            id: variant.id,
            sku: variant.sku,
            price: variant.price,
            stock: variant.stock,
            productId: variant.productId,
            attributes: (variant.attributes || []).map(attr => ({
                attributeId: attr.attribute?.id || 0,
                valueId: attr.value?.id || 0,
                label: attr.label
            })),
        };
    }
}