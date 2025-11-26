import { Injectable, NotFoundException } from '@nestjs/common';
import { PromotionRepository } from '../../domain/interfaces/promotion-repository.interface';
import { PromotionDetailResponseDto } from '../dtos/promotion-response.dto';
import { PromotionMapper } from '../mappers/promotion.mapper';

@Injectable()
export class GetPromotionByIdUseCase {
    constructor(private readonly repo: PromotionRepository) { }

    async execute(id: number): Promise<PromotionDetailResponseDto> {
        const promotion = await this.repo.findById(id);
        if (!promotion) {
            throw new NotFoundException('promotion not found');
        }

        return PromotionMapper.toDetailResponseDto(promotion);
    }
}
