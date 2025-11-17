import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdatePromotionDto } from '../dtos/update-promotion.dto';
import { PromotionMapper } from '../mappers/promotion.mapper';
import { PromotionResponseDto } from '../dtos/promotion-response.dto';
import { PromotionRepository } from '../../domain/interfaces/promotion-repository.interface';

@Injectable()
export class UpdatePromotionUseCase {
    constructor(private readonly repo: PromotionRepository) { }

    async execute(id: number, dto: UpdatePromotionDto): Promise<PromotionResponseDto> {
        const existing = await this.repo.findById(id);
        if (!existing) {
            throw new NotFoundException('promotion not found');
        }

        const merged = new (existing.constructor as any)({
            ...existing,
            ...dto,
            startsAt: dto.startsAt ? new Date(dto.startsAt) : existing.startsAt,
            endsAt: dto.endsAt ? new Date(dto.endsAt) : existing.endsAt,
        });

        const updated = await this.repo.update(id, merged);
        return PromotionMapper.toResponseDto(updated);
    }
}