import { Injectable } from '@nestjs/common';
import { PromotionMapper } from '../mappers/promotion.mapper';
import { PromotionResponseDto } from '../dtos/promotion-response.dto';
import { PromotionRepository } from '../../domain/interfaces/promotion-repository.interface';

@Injectable()
export class ListPromotionsUseCase {
    constructor(private readonly repo: PromotionRepository) { }

    async execute(page = 1, limit = 20): Promise<{ items: PromotionResponseDto[]; total: number }> {
        const { items, total } = await this.repo.paginate({ page, limit });
        return {
            items: items.map(PromotionMapper.toResponseDto),
            total,
        };
    }
}