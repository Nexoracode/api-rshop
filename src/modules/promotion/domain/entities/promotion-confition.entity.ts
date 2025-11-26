import { ConditionType } from "../enums/confition-type.enum";

export interface PromotionProductCondition {
    productId: number;
    variantIds?: number[];
}

export class PromotionCondition {
    id?: number;
    type: ConditionType;

    userId?: number;

    // ✅ مدل جدید: product + variant ها در کنار هم
    products?: PromotionProductCondition[];

    categoryIds?: number[];
    minAmount?: number;

    constructor(partial: Partial<PromotionCondition>) {
        Object.assign(this, partial);
    }
}
