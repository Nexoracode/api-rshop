import { Injectable, Logger } from '@nestjs/common';
import { CreatePromotionDto } from '../dtos/create-promotion.dto';
import { PromotionMapper } from '../mappers/promotion.mapper';
import { PromotionResponseDto } from '../dtos/promotion-response.dto';
import { PromotionRepository } from '../../domain/interfaces/promotion-repository.interface';

@Injectable()
export class CreatePromotionUseCase {
    private readonly logger = new Logger(CreatePromotionUseCase.name);

    constructor(private readonly repo: PromotionRepository) {}

    async execute(dto: CreatePromotionDto): Promise<PromotionResponseDto> {
        this.logger.log(`Creating new promotion: ${dto.name} (${dto.type})`);

        const domain = PromotionMapper.fromCreateDtoToDomain(dto);
        const created = await this.repo.create(domain);

        this.logger.log(
            `Successfully created promotion: ID=${created.id}, Name=${created.name}, Code=${created.code || 'N/A'}`,
        );

        return PromotionMapper.toResponseDto(created);
    }
}
