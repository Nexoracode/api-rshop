import { buildPriceObject } from 'src/common/helpers/price.helper';
import { CompareProduct } from '../entities/compare.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { Attribute } from 'src/modules/attributes/attribute/entities/attribute.entity';
import { ProductAttributeValue } from 'src/modules/product-attribute-value/entities/product-attribute-value.entity';

export class CompareMapper {
    static toResponse(compare: CompareProduct) {
        const product = compare.product as Product;

        if (!product) return null;

        const priceData = buildPriceObject({
            price: product.price,
            discountAmount: product.discountAmount,
            discountPercent: product.discountPercent,
        });

        // 🧩 استخراج attribute‌ها از variantها
        const attributesMap: Record<string, Set<string>> = {};

        return {
            id: compare.id,
            addedAt: compare.createdAt,
            product: {
                id: product.id,
                name: product.name,
                image: product.mediaPinned?.url || null,
                brand: product.brand?.name || null,
                price: priceData.price,
                discountAmount: priceData.discountAmount,
                discountPercent: priceData.discountPercent,
                finalPrice: priceData.finalPrice,
                attributes: product.attributeValues.map((attr) => ({
                    id: attr.attribute.id,
                    name: attr.attribute.name,
                    values: attr.attribute.values ? attr.attribute.values.map((v) => ({
                        name: v.value
                    })) : [],
                })),
                category: {
                    id: product.categoryId,
                    title: product.category?.title || null,
                    slug: product.category?.slug || null,
                }
            },

        };
    }

    static attributeValuesList(attributes: ProductAttributeValue[]) {
        return attributes.map((attr) => attr.attribute)
    }

    static toList(items: CompareProduct[]) {
        return items.map(this.toResponse).filter(Boolean);
    }
}
