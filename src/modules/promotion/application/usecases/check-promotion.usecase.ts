import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { PromotionEngine } from '../../domain/interfaces/promotion-engine.interface';
import { CheckPromotionDto } from '../dtos/check-promotion.dto';
import {
    OrderPreview,
    PromotionRepository,
} from '../../domain/interfaces/promotion-repository.interface';
import {
    PromotionNotFoundException,
    PromotionInactiveException,
    PromotionExpiredException,
    PromotionLimitReachedException,
    PromotionNotStartedException,
} from '../../domain/exceptions/promotion.exceptions';
import { PromotionType } from '../../domain/enums/promotion-type.enum';

@Injectable()
export class CheckPromotionUseCase {
    private readonly logger = new Logger(CheckPromotionUseCase.name);

    constructor(
        private readonly repo: PromotionRepository,
        private readonly engine: PromotionEngine,
    ) { }

    async execute(dto: CheckPromotionDto & { isFirstOrder: boolean }) {
        this.logger.log(
            `Checking promotions for user ${dto.userId}, code: ${dto.code || 'auto'}, isFirstOrder: ${dto.isFirstOrder}`,
        );

        const order: OrderPreview = {
            userId: dto.userId,
            subtotal: dto.subtotal,
            isFirstOrder: dto.isFirstOrder,
            items: dto.items.map((i) => ({
                productId: i.productId,
                categoryId: i.categoryId,
                variantId: i.variantId ?? undefined,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
            })),
        };

        let promotions;
        const hasCode = !!dto.code;

        if (hasCode) {
            // ── پیدا کردن پروموشن با کد ──────────────────────────────────────────
            const promo = await this.repo.findActiveByCode(dto.code!);

            if (!promo) {
                this.logger.warn(`Promotion code not found or inactive: ${dto.code}`);
                throw new PromotionNotFoundException(dto.code!);
            }

            const now = new Date();

            if (!promo.isActive) throw new PromotionInactiveException(dto.code!);
            if (promo.startsAt && promo.startsAt > now) throw new PromotionNotStartedException(dto.code!, promo.startsAt);
            if (promo.endsAt && promo.endsAt < now) throw new PromotionExpiredException(dto.code!);
            if (
                typeof promo.usageLimit === 'number' &&
                promo.usageLimit > 0 &&
                promo.usedCount >= promo.usageLimit
            ) throw new PromotionLimitReachedException(dto.code!);

            promotions = [promo];
            this.logger.log(`Found promotion by code: ${dto.code} (ID: ${promo.id})`);
        } else {
            // ── پروموشن‌های خودکار (بدون کد) ────────────────────────────────────
            const allActive = await this.repo.findActiveForOrder(order);
            promotions = allActive.filter(p => p.type !== PromotionType.COUPON);

            if (allActive.length !== promotions.length) {
                this.logger.warn(
                    `Filtered out ${allActive.length - promotions.length} COUPON(s) from auto-apply for user ${dto.userId}`,
                );
            }
        }

        // ── اعمال پروموشن‌ها ──────────────────────────────────────────────────
        const result = await this.engine.applyPromotions(order, promotions);

        // ── اگر کد داده شده ولی اعمال نشد → error با دلیل دقیق ───────────────
        if (hasCode && result.appliedPromotions.length === 0) {
            const rejected = result.rejectedPromotions[0];

            // دلیل reject از validator آمده — آن رو به عنوان خطا برمی‌گردونیم
            if (rejected) {
                this.logger.warn(
                    `Promotion code "${dto.code}" rejected: [${rejected.reasonCode}] ${rejected.reason}`,
                );
                throw new UnprocessableEntityException({
                    message: rejected.reason,
                    reasonCode: rejected.reasonCode,
                    meta: rejected.meta ?? null,
                });
            }

            // اگه حتی rejected هم نبود (مثلاً actions خروجی صفر داشتند)
            throw new UnprocessableEntityException({
                message: 'این کد تخفیف در حال حاضر قابل اعمال نیست.',
                reasonCode: 'PROMOTION_NO_EFFECT',
                meta: null,
            });
        }

        this.logger.log(
            `Applied ${result.appliedPromotions.length} promotion(s), discount: ${result.discount}`,
        );

        return {
            discount: result.discount,
            freeShipping: result.freeShipping,
            appliedPromotions: result.appliedPromotions.map(ap => ({
                id: ap.promotion.id,
                name: ap.promotion.name,
                type: ap.promotion.type,
                discountAmount: ap.discountAmount,
            })),
            // برای حالت auto-apply، rejected هم برمی‌گرده (فرانت‌اند نیاز نداره ولی مفیده)
            ...(hasCode ? {} : {
                rejectedPromotions: result.rejectedPromotions.map(rp => ({
                    id: rp.promotion.id,
                    name: rp.promotion.name,
                    reason: rp.reason,
                    reasonCode: rp.reasonCode,
                    meta: rp.meta ?? null,
                })),
            }),
        };
    }
}
