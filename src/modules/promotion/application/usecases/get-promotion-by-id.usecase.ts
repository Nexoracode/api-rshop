import { Injectable, Logger } from '@nestjs/common';
import { PromotionRepository } from '../../domain/interfaces/promotion-repository.interface';
import { PromotionNotFoundException } from '../../domain/exceptions/promotion.exceptions';
import { PromotionDetailResponseDto } from '../dtos/promotion-response.dto';
import { PromotionMapper } from '../mappers/promotion.mapper';

@Injectable()
export class GetPromotionByIdUseCase {
    private readonly logger = new Logger(GetPromotionByIdUseCase.name);

    constructor(private readonly repo: PromotionRepository) {}

    async execute(id: number): Promise<PromotionDetailResponseDto> {
        this.logger.log(`Fetching promotion by ID: ${id}`);

        const promotion = await this.repo.findById(id);

        if (!promotion) {
            throw new PromotionNotFoundException(id);
        }

        this.logger.debug(`Found promotion: ${promotion.name} (${promotion.code || 'no code'})`);

        return PromotionMapper.toDetailResponseDto(promotion);
    }
}
