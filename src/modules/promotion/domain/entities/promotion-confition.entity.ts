import { ConditionType } from "../enums/confition-type.enum";

export class PromotionCondition {
    id: number;
    type: ConditionType;

    // برای انواع مختلف شرط‌ها
    userId?: number;
    productIds?: number[];
    categoryIds?: number[];
    minAmount?: number;

    constructor(partial: Partial<PromotionCondition>) {
        Object.assign(this, partial);
    }
}