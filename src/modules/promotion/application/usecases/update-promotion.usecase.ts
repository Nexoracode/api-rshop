import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UpdatePromotionDto } from '../dtos/update-promotion.dto';
import { PromotionMapper } from '../mappers/promotion.mapper';
import { PromotionResponseDto } from '../dtos/promotion-response.dto';
import { PromotionRepository } from '../../domain/interfaces/promotion-repository.interface';
import { PromotionNotFoundException } from '../../domain/exceptions/promotion.exceptions';

@Injectable()
export class UpdatePromotionUseCase {
    private readonly logger = new Logger(UpdatePromotionUseCase.name);

    constructor(private readonly repo: PromotionRepository) {}

    async execute(id: number, dto: UpdatePromotionDto): Promise<PromotionResponseDto> {
        this.logger.log(`Updating promotion: ID=${id}`);

        // بررسی وجود promotion
        const existing = await this.repo.findById(id);
        if (!existing) {
            throw new PromotionNotFoundException(id);
        }

        const domain = PromotionMapper.fromCreateDtoToDomain(dto as any);
        const updated = await this.repo.update(id, domain);

        this.logger.log(
            `Successfully updated promotion: ID=${updated.id}, Name=${updated.name}`,
        );

        return PromotionMapper.toResponseDto(updated);
    }
}
