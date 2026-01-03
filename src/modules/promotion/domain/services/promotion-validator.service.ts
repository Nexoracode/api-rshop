import { Injectable, Logger } from '@nestjs/common';
import { PromotionValidator } from '../interfaces/promotion-validator.interface';
import { Promotion } from '../entities/promotion.entity';
import { ConditionType } from '../enums/condition-type.enum';
import { OrderPreview } from '../interfaces/promotion-repository.interface';

@Injectable()
export class PromotionValidatorService extends PromotionValidator {
    private readonly logger = new Logger(PromotionValidatorService.name);

    async isValid(order: OrderPreview, promotion: Promotion): Promise<boolean> {
        const now = new Date();
        const promotionId = `${promotion.id} (${promotion.code || promotion.name})`;

        if (!promotion.isActive) {
            this.logger.debug(`Promotion ${promotionId} is inactive`);
            return false;
        }

        if (promotion.startsAt && promotion.startsAt > now) {
            this.logger.debug(
                `Promotion ${promotionId} has not started yet. Starts at: ${promotion.startsAt.toISOString()}`,
            );
            return false;
        }

        if (promotion.endsAt && promotion.endsAt < now) {
            this.logger.debug(
                `Promotion ${promotionId} has expired. Ended at: ${promotion.endsAt.toISOString()}`,
            );
            return false;
        }

        if (
            typeof promotion.usageLimit === 'number' &&
            promotion.usageLimit > 0 &&
            promotion.usedCount >= promotion.usageLimit
        ) {
            this.logger.debug(
                `Promotion ${promotionId} has reached usage limit: ${promotion.usedCount}/${promotion.usageLimit}`,
            );
            return false;
        }

        for (const condition of promotion.conditions) {
            const isConditionValid = await this.validateCondition(
                order,
                condition,
                promotionId,
            );

            if (!isConditionValid) {
                return false;
            }
        }

        this.logger.debug(`Promotion ${promotionId} is valid for user ${order.userId}`);
        return true;
    }

    private async validateCondition(
        order: OrderPreview,
        condition: any,
        promotionId: string,
    ): Promise<boolean> {
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
                this.logger.warn(
                    `Unknown condition type: ${condition.type} for promotion ${promotionId}`,
                );
                return true;
        }
    }

    private validateUserCondition(
        order: OrderPreview,
        condition: any,
        promotionId: string,
    ): boolean {
        // ✅ چک کردن userId (deprecated ولی هنوز پشتیبانی می‌شه)
        if (condition.userId && condition.userId !== order.userId) {
            this.logger.debug(
                `Promotion ${promotionId} condition failed: User mismatch (expected: ${condition.userId}, actual: ${order.userId})`,
            );
            return false;
        }

        // ✅ چک کردن userIds (جدید)
        if (condition.userIds && Array.isArray(condition.userIds) && condition.userIds.length > 0) {
            if (!condition.userIds.includes(order.userId)) {
                this.logger.debug(
                    `Promotion ${promotionId} condition failed: User ${order.userId} not in allowed users list`,
                );
                return false;
            }
        }

        return true;
    }

    private validateProductCondition(
        order: OrderPreview,
        condition: any,
        promotionId: string,
    ): boolean {
        if (!condition.products?.length) return true;

        const match = condition.products.some((rule: any) => {
            return order.items.some((item) => {
                if (item.productId !== rule.productId) return false;

                if (!rule.variantIds?.length) {
                    return true;
                }

                if (!item.variantId) return false;
                return rule.variantIds.includes(item.variantId);
            });
        });

        if (!match) {
            this.logger.debug(
                `Promotion ${promotionId} condition failed: Required products/variants not found in order`,
            );
        }

        return match;
    }

    private validateCategoryCondition(
        order: OrderPreview,
        condition: any,
        promotionId: string,
    ): boolean {
        if (!condition.categoryIds?.length) return true;

        const hasCategory = order.items.some((item) =>
            item.categoryId ? condition.categoryIds.includes(item.categoryId) : false,
        );

        if (!hasCategory) {
            this.logger.debug(
                `Promotion ${promotionId} condition failed: Required categories not found in order`,
            );
        }

        return hasCategory;
    }

    private validateMinAmountCondition(
        order: OrderPreview,
        condition: any,
        promotionId: string,
    ): boolean {
        if (typeof condition.minAmount !== 'number') return true;

        const isValid = order.subtotal >= condition.minAmount;

        if (!isValid) {
            this.logger.debug(
                `Promotion ${promotionId} condition failed: Order subtotal (${order.subtotal}) is less than min amount (${condition.minAmount})`,
            );
        }

        return isValid;
    }

    private validateFirstOrderCondition(
        order: OrderPreview,
        condition: any,
        promotionId: string,
    ): boolean {
        const isValid = order.isFirstOrder === true;

        if (!isValid) {
            this.logger.debug(
                `Promotion ${promotionId} condition failed: Not user's first order`,
            );
        }

        return isValid;
    }
}
