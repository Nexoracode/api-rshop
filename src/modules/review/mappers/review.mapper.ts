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
            createdAt: review.createdAt,
            product: {
                id: product.id,
                name: product.name,
                image: product.mediaPinned?.url,
                ...priceData, // 👈 شامل price, discountAmount, discountPercent, finalPrice
            },
        };
    }

    static toResponseProduct(review: Review) {
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
            createdAt: review.createdAt,
            product: {
                id: product.id,
                name: product.name,
                image: product.mediaPinned?.url,
                ...priceData, // 👈 شامل price, discountAmount, discountPercent, finalPrice
            },
            user: {
                id: review.user.id,
                name: review.user.firstName === null ? 'کاربر مهمان' : review.user.firstName + ' ' + review.user.lastName,
            }
        };
    }

    static toList(reviews: Review[]) {
        return reviews.map(this.toResponse);
    }

    static toListProduct(reviews: Review[]) {
        return reviews.map(this.toResponseProduct);
    }
}
