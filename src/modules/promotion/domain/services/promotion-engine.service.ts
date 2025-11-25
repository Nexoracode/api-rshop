import { Injectable } from '@nestjs/common';
import { PromotionEngine, PromotionApplyResult } from '../interfaces/promotion-engine.interface';
import { Promotion } from '../entities/promotion.entity';
import { PromotionValidator } from '../interfaces/promotion-validator.interface';
import { ActionType } from '../enums/action-type.enum';
import { OrderPreview } from '../interfaces/promotion-repository.interface';

@Injectable()
export class PromotionEngineService extends PromotionEngine {
    constructor(private readonly validator: PromotionValidator) {
        super();
    }

    async applyPromotions(
        order: OrderPreview,
        promotions: Promotion[],
    ): Promise<PromotionApplyResult> {
        let discount = 0;
        let freeShipping = false;
        const appliedPromotions: Promotion[] = [];

        for (const promo of promotions) {
            console.log(promo.actions);
            // const valid = await this.validator.isValid(order, promo);
            // if (!valid) continue;

            let promoApplied = false;

            for (const action of promo.actions) {
                switch (action.type) {
                    case ActionType.PERCENT_DISCOUNT:
                        if (action.value && action.value > 0) {
                            discount += (order.subtotal * action.value) / 100;
                            promoApplied = true;
                        }
                        break;

                    case ActionType.AMOUNT_DISCOUNT:
                        if (action.value && action.value > 0) {
                            discount += action.value;
                            promoApplied = true;
                        }
                        break;

                    case ActionType.FREE_SHIPPING:
                        freeShipping = true;
                        promoApplied = true;
                        break;

                    case ActionType.NEXT_ORDER_COUPON:
                        // اینجا فقط ثبت می‌کنیم که این پروموشن اعمال شده
                        promoApplied = true;
                        break;
                }
            }

            if (promoApplied) {
                appliedPromotions.push(promo);
            }
        }

        return { discount, freeShipping, appliedPromotions };
    }
}