import { Injectable, Logger } from '@nestjs/common';
import { PromotionRepository } from '../../domain/interfaces/promotion-repository.interface';

@Injectable()
export class IncrementPromotionUsageUseCase {
    private readonly logger = new Logger(IncrementPromotionUsageUseCase.name);

    constructor(private readonly repo: PromotionRepository) {}

    /**
     * افزایش شمارنده استفاده از پروموشن
     * این متد باید بعد از تایید پرداخت فراخوانی شود
     */
    async execute(promotionId: number): Promise<void> {
        this.logger.log(`Incrementing usage count for promotion: ${promotionId}`);

        await this.repo.incrementUsageCount(promotionId);

        this.logger.log(`Successfully incremented usage count for promotion: ${promotionId}`);
    }

    /**
     * افزایش شمارنده برای چند پروموشن
     */
    async executeMultiple(promotionIds: number[]): Promise<void> {
        if (!promotionIds || promotionIds.length === 0) {
            this.logger.debug('No promotions to increment');
            return;
        }

        this.logger.log(`Incrementing usage count for ${promotionIds.length} promotion(s)`);

        await Promise.all(
            promotionIds.map((id) => this.repo.incrementUsageCount(id))
        );

        this.logger.log(
            `Successfully incremented usage count for ${promotionIds.length} promotion(s)`,
        );
    }
}
