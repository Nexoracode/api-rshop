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

    async execute(dto: CheckPromotionDto) {
        const order: OrderPreview = {
            userId: dto.userId,
            isFirstOrder: dto.isFirstOrder ?? false,
            subtotal: dto.subtotal,
            shippingCost: dto.shippingCost,
            items: dto.items.map((i) => ({
                productId: i.productId,
                categoryId: i.categoryId,
                variantId: i.variantId,
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
        console.log(result);

        const finalShipping = result.freeShipping ? 0 : dto.shippingCost;
        const finalTotal = dto.subtotal - result.discount + finalShipping;

        return {
            discount: result.discount,
            freeShipping: result.freeShipping,
            finalShipping,
            finalTotal,
            appliedPromotionIds: result.appliedPromotions.map((p) => p.id),
        };
    }
}