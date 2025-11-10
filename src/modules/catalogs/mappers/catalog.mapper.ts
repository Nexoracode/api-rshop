// mappers/catalog.mapper.ts
import { Product } from '../../product/entities/product.entity';
import { VariantProduct } from 'src/modules/variant-product/entities/variant-product.entity';
import { CatalogProduct } from '../interfaces/catalog-product.interface';

export class CatalogMapper {
    static toProduct(entity: Product): CatalogProduct {
        return {
            id: entity.id,
            name: entity.name,
            price: Number(entity.price),
            discountAmount: Number(entity.discountAmount || 0),
            discountPrecent: Number(entity.discountPercent || 0),
            finalPrice: Number(entity.price) - (Number(entity.discountAmount || 0) || 0),
            mediaPinned: entity.mediaPinned,
            isSameDayShipping: entity.isSameDayShipping,
            medias: entity.medias
                ?.filter((media) => media.type === 'image')
                .slice(0, 2)
                .map((media) => {
                    return {
                        id: media.id,
                        url: media.url,
                        altText: media.altText ?? undefined,
                        type: media.type,
                        createdAt: media.createdAt,
                    };
                }) ?? null,
            brand: entity.brand,
            category: entity.category,
            hasVariants: entity.variants?.length > 0,
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
