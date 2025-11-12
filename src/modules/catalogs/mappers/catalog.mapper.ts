// mappers/catalog.mapper.ts
import { Product } from '../../product/entities/product.entity';
import { VariantProduct } from 'src/modules/variant-product/entities/variant-product.entity';
import { CatalogProduct } from '../interfaces/catalog-product.interface';
import { buildPriceObject } from 'src/common/helpers/price.helper';

export class CatalogMapper {
    static toProduct(entity: Product): CatalogProduct {
        const buildPrice = buildPriceObject(entity);
        return {
            id: entity.id,
            name: entity.name,
            price: buildPrice.price,
            discountAmount: buildPrice.discountAmount,
            discountPercent: buildPrice.discountPercent,
            finalPrice: buildPrice.finalPrice,
            isSameDayShipping: entity.isSameDayShipping,
            isFeautered: entity.isFeatured,
            stock: entity.stock,
            hasVariants: entity.variants?.length > 0,
            mediaPinned: {
                id: entity.mediaPinned?.id,
                url: entity.mediaPinned?.url,
                altText: entity.mediaPinned?.altText ?? null,
                type: entity.mediaPinned?.type,
            },
            medias: entity.medias
                ?.filter((media) => media.type === 'image')
                .slice(0, 2)
                .map((media) => {
                    return {
                        id: media.id,
                        url: media.url,
                        altText: media.altText ?? undefined,
                        type: media.type,
                    };
                }) ?? null,
            brand: entity.brand,
            category: entity.category,
            variants: entity.variants
                ? (entity.variants.map((v) => CatalogMapper.toVariant(v)) as unknown as VariantProduct[])
                : [],
        } as unknown as CatalogProduct;
    }

    static toVariant(variant: VariantProduct) {
        return {
            id: variant.id,
            sku: variant.sku,
            price: Number(variant.price),
            discountAmount: Number(variant.discountAmount || 0),
            discountPercent: Number(variant.discountPercent || 0),
            stock: variant.stock,
            attributes: variant.attributes?.map((a) => ({
                id: a.attribute.id,
                name: a.attribute.name,
                type: a.attribute.type,
                value: {
                    id: a.value.id,
                    value: a.value.value,
                    displayColor: a.value.displayColor,
                },
            })),
        };
    }
}
