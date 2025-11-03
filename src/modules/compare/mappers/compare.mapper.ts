import { buildPriceObject } from 'src/common/helpers/price.helper';
import { CompareProduct } from '../entities/compare.entity';

export class CompareMapper {
    static toResponse(compare: CompareProduct) {
        const product = compare.product;

        if (!product) return null;

        const priceData = buildPriceObject({
            price: product.price,
            discountAmount: product.discountAmount,
            discountPercent: product.discountPercent,
        });

        // 🧩 استخراج attribute‌ها از variantها
        const attributesMap: Record<string, Set<string>> = {};

        (product.variants || []).forEach((variant) => {
            (variant.attributes || []).forEach((va) => {
                const attrName = va.attribute?.name || 'ویژگی';
                const value = va.value?.value || '';
                if (!attributesMap[attrName]) attributesMap[attrName] = new Set();
                attributesMap[attrName].add(value);
            });
        });

        const attributes = Object.entries(attributesMap).map(([name, values]) => ({
            name,
            values: Array.from(values),
        }));

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
                attributes,
                category: {
                    id: product.categoryId,
                    title: product.category?.title || null,
                    slug: product.category?.slug || null,
                }
            },
            user: {
                id: compare.user.id,
                name: compare.user.firstName === null ? 'کاربر مهمان' : `${compare.user.firstName} ${compare.user.lastName || ''}`.trim(),
                email: compare.user.email,
            },
        };
    }

    static toList(items: CompareProduct[]) {
        return items.map(this.toResponse).filter(Boolean);
    }
}
