import { getFinalPrice } from 'src/common/helpers/price.helper';
import { Wishlist } from '../entities/wishlist.entity';

export class WishlistMapper {
    static toResponse(wishlist: Wishlist) {
        const product = wishlist.product;

        if (!product) {
            return {
                id: wishlist.id,
                product: null,
                createdAt: wishlist.createdAt,
            };
        }

        const price = Number(product.price);
        const finalPrice = getFinalPrice({
            price,
            discountAmount: product.discountAmount,
            discountPercent: product.discountPercent,
        });

        return {
            id: wishlist.id,
            createdAt: wishlist.createdAt,
            product: {
                id: product.id,
                name: product.name,
                price,
                discountAmount: product.discountAmount,
                discountPercent: product.discountPercent,
                finalPrice,
                stock: product.stock,
                isActive: product.isActive,
                image: product.mediaPinned?.url || null,
                isAvailable: product.isVisible && product.stock > 0,
            },
        };
    }

    static toList(wishlists: Wishlist[]) {
        return wishlists.map(this.toResponse);
    }
}
