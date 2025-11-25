import { Injectable } from '@nestjs/common';
import { PromotionRepository } from '../../domain/interfaces/promotion-repository.interface';
import { PromotionMapper } from '../mappers/promotion.mapper';
import { ListPromotionDto } from '../dtos/list-promotion.dto';

@Injectable()
export class ListPromotionsUseCase {
    constructor(private readonly repo: PromotionRepository) { }

    async execute(query: ListPromotionDto) {
        const { items, meta, links } = await this.repo.paginated(query);

        return {
            items: items.map(PromotionMapper.toResponseDto),
            meta,
            links
        };
    }
}
