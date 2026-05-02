import { Injectable, Logger } from '@nestjs/common';
import { PromotionEngine, PromotionApplyResult } from '../interfaces/promotion-engine.interface';
import { PromotionValidator } from '../interfaces/promotion-validator.interface';
import { OrderPreview } from '../interfaces/promotion-repository.interface';
import { Promotion } from '../entities/promotion.entity';
import { ActionType } from '../enums/action-type.enum';

@Injectable()
export class PromotionEngineService extends PromotionEngine {
    private readonly logger = new Logger(PromotionEngineService.name);

    constructor(private readonly validator: PromotionValidator) {
        super();
    }

    async applyPromotions(
        order: OrderPreview,
        promotions: Promotion[],
    ): Promise<PromotionApplyResult> {
        this.logger.log(
            `Applying ${promotions.length} promotion(s) for user ${order.userId}, subtotal: ${order.subtotal}`,
        );

        let totalDiscount = 0;
        let freeShipping = false;

        const appliedPromotions: PromotionApplyResult['appliedPromotions'] = [];
        const rejectedPromotions: PromotionApplyResult['rejectedPromotions'] = [];

        for (const promo of promotions) {
            const promotionId = `${promo.id} (${promo.code || promo.name})`;

            // بررسی اعتبار با دریافت دلیل رد شدن
            const validationResult = await this.validator.validate(order, promo);

            if (!validationResult.valid) {
                this.logger.debug(
                    `Promotion ${promotionId} rejected: [${validationResult.reasonCode}] ${validationResult.reason}`,
                );
                rejectedPromotions.push({
                    promotion: promo,
                    reason: validationResult.reason!,
                    reasonCode: validationResult.reasonCode!,
                    meta: validationResult.meta,
                });
                continue;
            }

            let discountForThisPromo = 0;

            for (const action of promo.actions) {
                switch (action.type) {
                    case ActionType.PERCENT_DISCOUNT:
                        const percentDiscount = (order.subtotal * (action.value ?? 0)) / 100;
                        discountForThisPromo += percentDiscount;
                        this.logger.debug(
                            `Applied ${action.value}% → ${percentDiscount} Rials from promotion ${promotionId}`,
                        );
                        break;

                    case ActionType.AMOUNT_DISCOUNT:
                        const amountDiscount = action.value ?? 0;
                        discountForThisPromo += amountDiscount;
                        this.logger.debug(
                            `Applied ${amountDiscount} Rials from promotion ${promotionId}`,
                        );
                        break;

                    case ActionType.FREE_SHIPPING:
                        freeShipping = true;
                        this.logger.debug(`Free shipping from promotion ${promotionId}`);
                        break;

                    case ActionType.NEXT_ORDER_COUPON:
                        this.logger.debug(`Next order coupon from promotion ${promotionId}`);
                        break;

                    default:
                        this.logger.warn(`Unknown action type: ${action.type} in promotion ${promotionId}`);
                }
            }

            // اعمال سقف تخفیف
            if (promo.maxDiscountAmount && promo.maxDiscountAmount > 0) {
                if (discountForThisPromo > promo.maxDiscountAmount) {
                    this.logger.log(
                        `Discount capped for ${promotionId}: ${discountForThisPromo} → ${promo.maxDiscountAmount}`,
                    );
                    discountForThisPromo = promo.maxDiscountAmount;
                }
            }

            if (discountForThisPromo > 0 || freeShipping) {
                appliedPromotions.push({ promotion: promo, discountAmount: discountForThisPromo });
                this.logger.log(`Applied promotion ${promotionId}: discount=${discountForThisPromo}`);
            }

            totalDiscount += discountForThisPromo;
        }

        if (totalDiscount > order.subtotal) {
            this.logger.warn(`Total discount capped at subtotal: ${totalDiscount} → ${order.subtotal}`);
            totalDiscount = order.subtotal;
        }

        this.logger.log(
            `Result for user ${order.userId}: discount=${totalDiscount}, freeShipping=${freeShipping}, applied=${appliedPromotions.length}, rejected=${rejectedPromotions.length}`,
        );

        return { discount: totalDiscount, freeShipping, appliedPromotions, rejectedPromotions };
    }
}
