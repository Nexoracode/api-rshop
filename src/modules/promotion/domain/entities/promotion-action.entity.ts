import { ActionType } from '../enums/action-type.enum';

export class PromotionAction {
    id: number;
    type: ActionType;
    value?: number; // درصد یا مبلغ
    meta?: Record<string, any>; // برای تنظیمات اضافه (مثلا معتبر بودن کوپن خرید بعدی)

    constructor(partial: Partial<PromotionAction>) {
        Object.assign(this, partial);
    }
}