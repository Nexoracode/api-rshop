// promotion/application/usecases/list-promotion.usecase.ts

import { Injectable } from '@nestjs/common';
import { PromotionRepository } from '../../domain/interfaces/promotion-repository.interface';
import { PromotionMapper } from '../mappers/promotion.mapper';
import { ListPromotionDto } from '../dtos/list-promotion.dto';
import { PaginateQuery } from 'nestjs-paginate';

@Injectable()
export class ListPromotionsUseCase {
    constructor(private readonly repo: PromotionRepository) { }

    async execute(query: PaginateQuery) {
        const { items, meta, links } = await this.repo.paginated(query);

        return {
            items: items.map(PromotionMapper.toDetailResponseDto),
            meta,
            links,
        };
    }
}
