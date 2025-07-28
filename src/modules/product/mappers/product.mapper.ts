import { Media } from "src/modules/media/entities/image.entity";
import { IProduct } from "../interfaces/product.interface";
import { IProductResponse } from "../interfaces/product.response";

export class ProductMapper {
    static toResponse(product: IProduct): IProductResponse {
        return {
            id: product.id,
            category: product.category,
            variants: !product.variants || product.variants.length === 0 ? [] : product.variants,
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
            mediaPinnedId: product.mediaPinnedId ?? 0,
            helper: product.helper,
            categoryId: product.categoryId,
            isFeatured: product.isFeatured,
            isLimitedStock: product.isLimitedStock,
            isVisible: product.isVisible,
            orderLimit: product.orderLimit,
            name: product.name,
            price: product.price,
            stock: product.stock,
            weight: product.weight,
            weightUnit: product.weightUnit,
            description: product.description,
            discountAmount: product.discountAmount,
            discountPercent: product.discountPercent,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        }
    }
}