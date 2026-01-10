import { Collection } from "../entities/collection.entity";

export class CollectionMapp {
    static toResponse(collection: Collection) {
        return {
            data: {
                id: collection.id,
                title: collection.title,
                slug: collection.slug,
                description: collection.description,
                image: collection.image,
                startDate: collection.startDate,
                endDate: collection.endDate,
                products: collection.products.map((product) => ({
                    id: product.id,
                    name: product.name,
                    slug: product.sku,
                    price: Number(product.price),
                    discountPercent: Number(product.discountPercent) || 0,
                    discountAmount: Number(product.discountAmount) || 0,
                    stock: product.stock,
                    isFeatured: product.isFeatured,
                    image: product.mediaPinned?.url || null,
                    category: product.category
                        ? {
                            id: product.category.id,
                            name: product.category.title,
                            slug: product.category.slug,
                        }
                        : null,
                    brand: product.brand
                        ? {
                            id: product.brand.id,
                            name: product.brand.name,
                            slug: product.brand.slug,
                        }
                        : null,
                })),
            },
        }
    }
}