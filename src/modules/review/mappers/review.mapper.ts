import { buildPriceObject } from 'src/common/helpers/price.helper';
import { Review } from '../entities/review.entity';

export class ReviewMapper {
    static toResponse(review: Review) {
        const product = review.product;
        const priceData = buildPriceObject({
            price: product.price,
            discountAmount: product.discountAmount,
            discountPercent: product.discountPercent,
        });

        return {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            product: {
                id: product.id,
                name: product.name,
                image: product.mediaPinned?.url,
                ...priceData, // 👈 شامل price, discountAmount, discountPercent, finalPrice
            },
        };
    }

    static toList(reviews: Review[]) {
        return reviews.map(this.toResponse);
    }
}
