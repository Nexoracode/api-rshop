import { Review } from "src/modules/review/entities/review.entity";

export function getAverageRating(reviews: Review[]): number {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
    return Number((total / reviews.length).toFixed(1));
}
