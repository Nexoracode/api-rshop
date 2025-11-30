import { Promotion } from '../entities/promotion.entity';
import { OrderPreview } from './promotion-repository.interface';

export interface PromotionApplyResult {
    discount: number;
    freeShipping: boolean;
    appliedPromotions: {
        promotion: Promotion,
        discountAmount: number,
    }[];
}

export abstract class PromotionEngine {
    abstract applyPromotions(
        order: OrderPreview,
        promotions: Promotion[],
    ): Promise<PromotionApplyResult>;
}