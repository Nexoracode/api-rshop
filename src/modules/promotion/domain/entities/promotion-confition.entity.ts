import { ConditionType } from "../enums/confition-type.enum";

export class PromotionCondition {
    id: number;
    type: ConditionType;

    // برای انواع مختلف شرط‌ها
    userId?: number | null;
    productIds?: number[] | null;
    categoryIds?: number[] | null;
    variantIds?: number[] | null;
    minAmount?: number | null;

    constructor(partial: Partial<PromotionCondition>) {
        Object.assign(this, partial);
    }
}