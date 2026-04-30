import { Injectable, Logger } from '@nestjs/common';
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

        // اگر کد تخفیف مشخص شده
        console.log(dto.code);
        if (dto.code) {
            console.log('checking promotion code => ', dto.code);
            const promo = await this.repo.findActiveByCode(dto.code);

            if (!promo) {
                this.logger.warn(`Promotion code not found or inactive: ${dto.code}`);
                throw new PromotionNotFoundException(dto.code);
            }

            // بررسی‌های اضافی برای error handling بهتر
            const now = new Date();

            if (!promo.isActive) {
                throw new PromotionInactiveException(dto.code);
            }

            if (promo.startsAt && promo.startsAt > now) {
                throw new PromotionNotStartedException(dto.code, promo.startsAt);
            }

            if (promo.endsAt && promo.endsAt < now) {
                throw new PromotionExpiredException(dto.code);
            }

            if (
                typeof promo.usageLimit === 'number' &&
                promo.usageLimit > 0 &&
                promo.usedCount >= promo.usageLimit
            ) {
                throw new PromotionLimitReachedException(dto.code);
            }

            promotions = [promo];
            this.logger.log(`Found promotion by code: ${dto.code} (ID: ${promo.id})`);
        } else {
            // پیدا کردن پروموشن‌های فعال غیر کوپن (COUPON نیاز به code دارد)
            const allActive = await this.repo.findActiveForOrder(order);

            // ✅ لایه دفاعی: اطمینان از حذف کامل COUPON ها در صورت عدم ارسال code
            promotions = allActive.filter(p => p.type !== PromotionType.COUPON);

            if (allActive.length !== promotions.length) {
                this.logger.warn(
                    `Filtered out ${allActive.length - promotions.length} COUPON promotion(s) from auto-apply list for user ${dto.userId}`
                );
            }

            this.logger.log(`Found ${promotions.length} active non-coupon promotions for user`);
        }

        // اعمال پروموشن‌ها
        const result = await this.engine.applyPromotions(order, promotions);

        this.logger.log(
            `Applied ${result.appliedPromotions.length} promotion(s), total discount: ${result.discount}`,
        );

        return {
            discount: result.discount,
            freeShipping: result.freeShipping,
            appliedPromotions: result.appliedPromotions,
        };
    }
}
