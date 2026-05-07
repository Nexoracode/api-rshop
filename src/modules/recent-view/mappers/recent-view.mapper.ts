import { buildPriceObject } from 'src/common/helpers/price.helper';
import { RecentView } from '../entities/recent-view.entity';

export class RecentViewMapper {
    static toResponse(view: RecentView) {
        const product = view.product;

        if (!product) {
            return {
                id: view.id,
                product: null,
                viewedAt: view.updatedAt,
            };
        }

        const { price, discountAmount, discountPercent, finalPrice } = buildPriceObject({
            price: product.price,
            discountAmount: product.discountAmount,
            discountPercent: product.discountPercent,
        });

        return {
            id: view.id,
            viewedAt: view.updatedAt,
            product: {
                id: product.id,
                name: product.name,
                price,
                discountAmount,
                discountPercent,
                finalPrice,
                stock: product.stock,
                image: product.mediaPinned?.url || null,
                isAvailable: product.isVisible && product.stock > 0,
            },
        };
    }

    static toList(views: RecentView[]) {
        return views.map(this.toResponse);
    }
}
