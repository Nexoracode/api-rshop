import { Injectable, Logger } from '@nestjs/common';
import { PromotionRepository } from '../../domain/interfaces/promotion-repository.interface';
import { PromotionNotFoundException } from '../../domain/exceptions/promotion.exceptions';

@Injectable()
export class DeletePromotionUseCase {
    private readonly logger = new Logger(DeletePromotionUseCase.name);

    constructor(private readonly repo: PromotionRepository) {}

    async execute(id: number): Promise<void> {
        this.logger.log(`Deleting promotion: ID=${id}`);

        // بررسی وجود promotion
        const existing = await this.repo.findById(id);
        if (!existing) {
            throw new PromotionNotFoundException(id);
        }

        await this.repo.delete(id);

        this.logger.log(
            `Successfully deleted promotion: ID=${id}, Name=${existing.name}`,
        );
    }
}
