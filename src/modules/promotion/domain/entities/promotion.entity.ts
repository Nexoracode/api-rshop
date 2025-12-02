import { PromotionType } from '../enums/promotion-type.enum';
import { PromotionAction } from './promotion-action.entity';
import { PromotionCondition } from './promotion-condition.entity';

export class Promotion {
    id?: number;
    name: string;
    type: PromotionType;
    code?: string | null;

    startsAt: Date;
    endsAt: Date;

    usageLimit?: number | null;
    usedCount: number;

    isActive: boolean;

    conditions: PromotionCondition[];
    actions: PromotionAction[];

    constructor(partial: Partial<Promotion>) {
        Object.assign(this, partial);
    }
}
