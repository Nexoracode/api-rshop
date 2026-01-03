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

        const appliedPromotions: {
            promotion: Promotion;
            discountAmount: number;
        }[] = [];

        // مرتب‌سازی پروموشن‌ها بر اساس priority (اگر در آینده اضافه شد)
        // در حال حاضر، به ترتیب دریافت شده اعمال می‌شوند
        const sortedPromotions = [...promotions];

        for (const promo of sortedPromotions) {
            const promotionId = `${promo.id} (${promo.code || promo.name})`;

            // بررسی اعتبار
            const isValid = await this.validator.isValid(order, promo);
            if (!isValid) {
                this.logger.debug(`Promotion ${promotionId} is not valid, skipping`);
                continue;
            }

            let discountForThisPromo = 0;

            // اعمال تمام Action های این پروموشن
            for (const action of promo.actions) {
                switch (action.type) {
                    case ActionType.PERCENT_DISCOUNT:
                        const percentDiscount = (order.subtotal * (action.value ?? 0)) / 100;
                        discountForThisPromo += percentDiscount;
                        this.logger.debug(
                            `Applied ${action.value}% discount (${percentDiscount} Rials) from promotion ${promotionId}`,
                        );
                        break;

                    case ActionType.AMOUNT_DISCOUNT:
                        const amountDiscount = action.value ?? 0;
                        discountForThisPromo += amountDiscount;
                        this.logger.debug(
                            `Applied ${amountDiscount} Rials discount from promotion ${promotionId}`,
                        );
                        break;

                    case ActionType.FREE_SHIPPING:
                        freeShipping = true;
                        this.logger.debug(
                            `Applied free shipping from promotion ${promotionId}`,
                        );
                        break;

                    case ActionType.NEXT_ORDER_COUPON:
                        // این action فقط برای خرید بعدی است
                        // در اینجا فقط لاگ می‌کنیم
                        this.logger.debug(
                            `Next order coupon will be issued from promotion ${promotionId}`,
                        );
                        break;

                    default:
                        this.logger.warn(
                            `Unknown action type: ${action.type} in promotion ${promotionId}`,
                        );
                }
            }

            // ✅ اعمال سقف تخفیف (maxDiscountAmount)
            if (promo.maxDiscountAmount && promo.maxDiscountAmount > 0) {
                if (discountForThisPromo > promo.maxDiscountAmount) {
                    this.logger.log(
                        `Discount capped for promotion ${promotionId}: ${discountForThisPromo} -> ${promo.maxDiscountAmount}`
                    );
                    discountForThisPromo = promo.maxDiscountAmount;
                }
            }

            // اگر تخفیف یا free shipping اعمال شد
            if (discountForThisPromo > 0 || freeShipping) {
                appliedPromotions.push({
                    promotion: promo,
                    discountAmount: discountForThisPromo,
                });

                this.logger.log(
                    `Successfully applied promotion ${promotionId} with discount: ${discountForThisPromo}`,
                );
            }

            totalDiscount += discountForThisPromo;
        }

        // اطمینان از اینکه تخفیف کل از مبلغ سفارش بیشتر نباشد
        if (totalDiscount > order.subtotal) {
            this.logger.warn(
                `Total discount (${totalDiscount}) exceeds subtotal (${order.subtotal}), capping at subtotal`,
            );
            totalDiscount = order.subtotal;
        }

        this.logger.log(
            `Final result for user ${order.userId}: discount=${totalDiscount}, freeShipping=${freeShipping}, appliedCount=${appliedPromotions.length}`,
        );

        return {
            discount: totalDiscount,
            freeShipping,
            appliedPromotions,
        };
    }
}
