import { Category } from "src/modules/category/entities/category.entity";
import { ConditionType } from "../enums/condition-type.enum";

export interface PromotionProductCondition {
    productId: number;
    variantIds?: number[];
}

export class PromotionCondition {
    id?: number;
    type: ConditionType;

    userId?: number;
    userIds?: number[];
    products?: PromotionProductCondition[];
    categoryIds?: number[];
    categories?: Category[];
    minAmount?: number;

    constructor(partial: Partial<PromotionCondition>) {
        Object.assign(this, partial);
    }
}
