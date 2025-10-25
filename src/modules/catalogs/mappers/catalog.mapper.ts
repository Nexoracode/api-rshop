import { IProduct } from 'src/modules/product/interfaces/product.interface';
import { CatalogProduct } from '../interfaces/catalog-product.interface';
import { Product } from 'src/modules/product/entities/product.entity';

export class CatalogMapper {
    static toProduct(raw: any): CatalogProduct {
        return {
            id: raw.id,
            name: raw.name,
            price: raw.price,
            discountAmount: raw.discountAmount || 0,
            discountPrecent: raw.discountPercent || 0,
            isSameDayShipping: raw.isSameDayShipping,
            category: raw.category,
            brand: raw.brand || null,
            medias: raw.medias
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
        };
    }
}
