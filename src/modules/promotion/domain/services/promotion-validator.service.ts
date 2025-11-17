import { Injectable } from '@nestjs/common';
import { PromotionValidator } from '../interfaces/promotion-validator.interface';
import { Promotion } from '../entities/promotion.entity';
import { ConditionType } from '../enums/confition-type.enum';
import { OrderPreview } from '../interfaces/promotion-repository.interface';

@Injectable()
export class PromotionValidatorService extends PromotionValidator {
    async isValid(order: OrderPreview, promotion: Promotion): Promise<boolean> {
        const now = new Date();

        if (!promotion.isActive) return false;
        if (promotion.startsAt && promotion.startsAt > now) return false;
        if (promotion.endsAt && promotion.endsAt < now) return false;
        if (
            typeof promotion.usageLimit === 'number' &&
            promotion.usageLimit > 0 &&
            promotion.usedCount >= promotion.usageLimit
        ) {
            return false;
        }

        for (const condition of promotion.conditions) {
            switch (condition.type) {
                case ConditionType.USER:
                    if (condition.userId && condition.userId !== order.userId) {
                        return false;
                    }
                    break;

                case ConditionType.PRODUCT:
                    if (
                        condition.productIds?.length &&
                        !order.items.some((i) =>
                            condition.productIds!.includes(i.productId),
                        )
                    ) {
                        return false;
                    }
                    break;

                case ConditionType.CATEGORY:
                    if (
                        condition.categoryIds?.length &&
                        !order.items.some((i) =>
                            i.categoryId
                                ? condition.categoryIds!.includes(i.categoryId)
                                : false,
                        )
                    ) {
                        return false;
                    }
                    break;

                case ConditionType.VARIANT:   // 🟦 قسمت جدید که لازم داشتی
                    if (condition.variantIds) {
                        const orderVariantIds = order.items.map(i => i.variantId);
                        const required = condition.variantIds;

                        const match = required.some(v => orderVariantIds.includes(v));
                        if (!match) return false;
                    }
                    break;

                case ConditionType.MIN_ORDER_AMOUNT:
                    if (
                        typeof condition.minAmount === 'number' &&
                        order.subtotal < condition.minAmount
                    ) {
                        return false;
                    }
                    break;

                case ConditionType.FIRST_ORDER:
                    if (!order.isFirstOrder) {
                        return false;
                    }
                    break;

                default:
                    break;
            }
        }

        return true;
    }
}