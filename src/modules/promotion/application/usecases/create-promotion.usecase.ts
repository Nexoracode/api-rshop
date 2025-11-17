import { Injectable } from '@nestjs/common';
import { CreatePromotionDto } from '../dtos/create-promotion.dto';
import { PromotionMapper } from '../mappers/promotion.mapper';
import { PromotionResponseDto } from '../dtos/promotion-response.dto';
import { PromotionRepository } from '../../domain/interfaces/promotion-repository.interface';

@Injectable()
export class CreatePromotionUseCase {
    constructor(private readonly repo: PromotionRepository) { }

    async execute(dto: CreatePromotionDto): Promise<PromotionResponseDto> {
        const domain = PromotionMapper.fromCreateDtoToDomain(dto);
        const created = await this.repo.create(domain);
        return PromotionMapper.toResponseDto(created);
    }
}