import { Injectable } from '@nestjs/common';
import { PromotionRepository } from '../../domain/interfaces/promotion-repository.interface';

@Injectable()
export class DeletePromotionUseCase {
    constructor(private readonly repo: PromotionRepository) { }

    async execute(id: number): Promise<void> {
        await this.repo.delete(id);
    }
}