import { Injectable } from '@nestjs/common';
import { PromotionEngine, PromotionApplyResult } from '../interfaces/promotion-engine.interface';
import { PromotionValidator } from '../interfaces/promotion-validator.interface';
import { OrderPreview } from '../interfaces/promotion-repository.interface';
import { Promotion } from '../entities/promotion.entity';
import { ActionType } from '../enums/action-type.enum';

@Injectable()
export class PromotionEngineService extends PromotionEngine {
    constructor(private readonly validator: PromotionValidator) {
        super();
    }

    async applyPromotions(
        order: OrderPreview,
        promotions: Promotion[],
    ): Promise<PromotionApplyResult> {

        let totalDiscount = 0;
        let freeShipping = false;

        const appliedPromotions: {
            promotion: Promotion;
            discountAmount: number;
        }[] = [];

        for (const promo of promotions) {
            const isValid = await this.validator.isValid(order, promo);
            if (!isValid) continue;

            let discountForThisPromo = 0;

            for (const action of promo.actions) {
                switch (action.type) {
                    case ActionType.PERCENT_DISCOUNT:
                        discountForThisPromo += (order.subtotal * (action.value ?? 0)) / 100;
                        break;

                    case ActionType.AMOUNT_DISCOUNT:
                        discountForThisPromo += action.value ?? 0;
                        break;

                    case ActionType.FREE_SHIPPING:
                        freeShipping = true;
                        break;
                }
            }

            if (discountForThisPromo > 0 || freeShipping) {
                appliedPromotions.push({
                    promotion: promo,
                    discountAmount: discountForThisPromo,
                });
            }

            totalDiscount += discountForThisPromo;
        }

        return {
            discount: totalDiscount,
            freeShipping,
            appliedPromotions,
        };
    }
}
