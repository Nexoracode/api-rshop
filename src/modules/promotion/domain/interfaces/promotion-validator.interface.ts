import { Promotion } from '../entities/promotion.entity';
import { OrderPreview } from './promotion-repository.interface';

export interface PromotionValidationResult {
    valid: boolean;
    reason?: string;       // پیام فارسی برای فرانت‌اند
    reasonCode?: string;   // کد ماشین‌خوان برای فرانت‌اند (e.g. MIN_AMOUNT_NOT_MET)
    meta?: Record<string, any>; // اطلاعات اضافه (مثلاً minAmount برای نمایش)
}

export abstract class PromotionValidator {
    abstract validate(order: OrderPreview, promotion: Promotion): Promise<PromotionValidationResult>;
}
