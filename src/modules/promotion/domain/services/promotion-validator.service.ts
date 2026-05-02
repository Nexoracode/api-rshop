import { Injectable, Logger } from '@nestjs/common';
import { PromotionValidator, PromotionValidationResult } from '../interfaces/promotion-validator.interface';
import { Promotion } from '../entities/promotion.entity';
import { ConditionType } from '../enums/condition-type.enum';
import { OrderPreview } from '../interfaces/promotion-repository.interface';

@Injectable()
export class PromotionValidatorService extends PromotionValidator {
    private readonly logger = new Logger(PromotionValidatorService.name);

    async validate(order: OrderPreview, promotion: Promotion): Promise<PromotionValidationResult> {
        const now = new Date();
        const promotionId = `${promotion.id} (${promotion.code || promotion.name})`;

        if (!promotion.isActive) {
            this.logger.debug(`Promotion ${promotionId} is inactive`);
            return {
                valid: false,
                reason: 'این کد تخفیف غیرفعال است.',
                reasonCode: 'PROMOTION_INACTIVE',
            };
        }

        if (promotion.startsAt && promotion.startsAt > now) {
            this.logger.debug(`Promotion ${promotionId} has not started yet.`);
            return {
                valid: false,
                reason: `این کد تخفیف هنوز فعال نشده است.`,
                reasonCode: 'PROMOTION_NOT_STARTED',
                meta: { startsAt: promotion.startsAt },
            };
        }

        if (promotion.endsAt && promotion.endsAt < now) {
            this.logger.debug(`Promotion ${promotionId} has expired.`);
            return {
                valid: false,
                reason: 'مدت اعتبار این کد تخفیف به پایان رسیده است.',
                reasonCode: 'PROMOTION_EXPIRED',
                meta: { endsAt: promotion.endsAt },
            };
        }

        if (
            typeof promotion.usageLimit === 'number' &&
            promotion.usageLimit > 0 &&
            promotion.usedCount >= promotion.usageLimit
        ) {
            this.logger.debug(`Promotion ${promotionId} usage limit reached.`);
            return {
                valid: false,
                reason: 'ظرفیت استفاده از این کد تخفیف تکمیل شده است.',
                reasonCode: 'USAGE_LIMIT_REACHED',
            };
        }

        // بررسی تمام شرایط
        for (const condition of promotion.conditions) {
            const conditionResult = this.validateCondition(order, condition, promotionId);
            if (!conditionResult.valid) {
                return conditionResult;
            }
        }

        this.logger.debug(`Promotion ${promotionId} is valid for user ${order.userId}`);
        return { valid: true };
    }

    private validateCondition(
        order: OrderPreview,
        condition: any,
        promotionId: string,
    ): PromotionValidationResult {
        switch (condition.type) {
            case ConditionType.USER:
                return this.validateUserCondition(order, condition, promotionId);

            case ConditionType.PRODUCT:
                return this.validateProductCondition(order, condition, promotionId);

            case ConditionType.CATEGORY:
                return this.validateCategoryCondition(order, condition, promotionId);

            case ConditionType.MIN_ORDER_AMOUNT:
                return this.validateMinAmountCondition(order, condition, promotionId);

            case ConditionType.FIRST_ORDER:
                return this.validateFirstOrderCondition(order, condition, promotionId);

            default:
                this.logger.warn(`Unknown condition type: ${condition.type} for promotion ${promotionId}`);
                return { valid: true };
        }
    }

    private validateUserCondition(
        order: OrderPreview,
        condition: any,
        promotionId: string,
    ): PromotionValidationResult {
        if (condition.userIds && Array.isArray(condition.userIds) && condition.userIds.length > 0) {
            if (!condition.userIds.includes(order.userId)) {
                this.logger.debug(`Promotion ${promotionId}: user ${order.userId} not in allowed list`);
                return {
                    valid: false,
                    reason: 'این کد تخفیف برای حساب کاربری شما معتبر نیست.',
                    reasonCode: 'USER_NOT_ELIGIBLE',
                };
            }
        }
        return { valid: true };
    }

    private validateProductCondition(
        order: OrderPreview,
        condition: any,
        promotionId: string,
    ): PromotionValidationResult {
        if (!condition.products?.length) return { valid: true };

        const match = condition.products.some((rule: any) => {
            return order.items.some((item) => {
                if (item.productId !== rule.productId) return false;
                if (!rule.variantIds?.length) return true;
                if (!item.variantId) return false;
                return rule.variantIds.includes(item.variantId);
            });
        });

        if (!match) {
            this.logger.debug(`Promotion ${promotionId}: required products not in order`);
            return {
                valid: false,
                reason: 'محصولات مورد نیاز برای استفاده از این کد تخفیف در سبد خرید شما وجود ندارد.',
                reasonCode: 'REQUIRED_PRODUCTS_NOT_IN_CART',
            };
        }

        return { valid: true };
    }

    private validateCategoryCondition(
        order: OrderPreview,
        condition: any,
        promotionId: string,
    ): PromotionValidationResult {
        if (!condition.categoryIds?.length) return { valid: true };

        const hasCategory = order.items.some((item) =>
            item.categoryId ? condition.categoryIds.includes(item.categoryId) : false,
        );

        if (!hasCategory) {
            this.logger.debug(`Promotion ${promotionId}: required categories not in order`);
            return {
                valid: false,
                reason: 'این کد تخفیف فقط برای دسته‌بندی‌های خاصی معتبر است که در سبد خرید شما وجود ندارد.',
                reasonCode: 'REQUIRED_CATEGORIES_NOT_IN_CART',
            };
        }

        return { valid: true };
    }

    private validateMinAmountCondition(
        order: OrderPreview,
        condition: any,
        promotionId: string,
    ): PromotionValidationResult {
        if (typeof condition.minAmount !== 'number') return { valid: true };

        if (order.subtotal < condition.minAmount) {
            this.logger.debug(
                `Promotion ${promotionId}: subtotal ${order.subtotal} < minAmount ${condition.minAmount}`,
            );
            return {
                valid: false,
                reason: `حداقل مبلغ خرید برای استفاده از این کد تخفیف ${condition.minAmount.toLocaleString('fa-IR')} تومان است.`,
                reasonCode: 'MIN_AMOUNT_NOT_MET',
                meta: {
                    minAmount: condition.minAmount,
                    currentSubtotal: order.subtotal,
                    remaining: condition.minAmount - order.subtotal,
                },
            };
        }

        return { valid: true };
    }

    private validateFirstOrderCondition(
        order: OrderPreview,
        condition: any,
        promotionId: string,
    ): PromotionValidationResult {
        if (!order.isFirstOrder) {
            this.logger.debug(`Promotion ${promotionId}: not user's first order`);
            return {
                valid: false,
                reason: 'این کد تخفیف فقط برای اولین خرید معتبر است.',
                reasonCode: 'NOT_FIRST_ORDER',
            };
        }

        return { valid: true };
    }
}
