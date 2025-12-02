import { ConditionType } from "../enums/condition-type.enum";

export interface PromotionProductCondition {
    productId: number;
    variantIds?: number[];
}

export class PromotionCondition {
    id?: number;
    type: ConditionType;

    userId?: number;
    products?: PromotionProductCondition[];
    categoryIds?: number[];
    minAmount?: number;

    constructor(partial: Partial<PromotionCondition>) {
        Object.assign(this, partial);
    }
}
