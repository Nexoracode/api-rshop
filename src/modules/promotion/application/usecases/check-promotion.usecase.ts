import { Injectable, NotFoundException } from '@nestjs/common';
import { PromotionEngine } from '../../domain/interfaces/promotion-engine.interface';
import { CheckPromotionDto } from '../dtos/check-promotion.dto';
import { OrderPreview, PromotionRepository } from '../../domain/interfaces/promotion-repository.interface';

@Injectable()
export class CheckPromotionUseCase {
    constructor(
        private readonly repo: PromotionRepository,
        private readonly engine: PromotionEngine,
    ) { }

    async execute(dto: CheckPromotionDto & { isFirstOrder: boolean }) {
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

        if (dto.code) {
            const promo = await this.repo.findActiveByCode(dto.code);
            if (!promo) {
                throw new NotFoundException('این کد تخفیف وجود ندارد یا غیر فعال است.');
            }
            promotions = [promo];
        } else {
            promotions = await this.repo.findActiveForOrder(order);
        }

        const result = await this.engine.applyPromotions(order, promotions);

        return {
            discount: result.discount,
            freeShipping: result.freeShipping,
            appliedPromotions: result.appliedPromotions,   // 🔥 ساختار کامل و صحیح
        };
    }
}
