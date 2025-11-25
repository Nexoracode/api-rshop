import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery, FilterOperator } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { PromotionRepository as PromotionRepoInterface } from '../../domain/interfaces/promotion-repository.interface';
import { Promotion } from '../../domain/entities/promotion.entity';
import { PromotionOrmEntity } from '../entities/promotion.orm-entity';

@Injectable()
export class PromotionRepositoryImpl {
    constructor(
        @InjectRepository(PromotionOrmEntity)
        private readonly ormRepo: Repository<PromotionOrmEntity>,
    ) { }

    findById(id: number) {
        return this.ormRepo.findOne({ where: { id } });
    }

    findActiveByCode(code: string) {
        return this.ormRepo.findOne({
            where: { code, isActive: true },
        });
    }

    async findActiveForOrder(order: any) {
        return this.ormRepo.find({
            where: { isActive: true },
            relations: ['conditions', 'actions'],
        });
    }

    create(promotion: Promotion) {
        return this.ormRepo.save(promotion);
    }

    update(id: number, promotion: Promotion) {
        return this.ormRepo.save({ ...promotion, id });
    }

    async delete(id: number) {
        await this.ormRepo.delete(id);
    }

    async paginated(query: PaginateQuery) {
        const result = await paginate(query, this.ormRepo, {
            sortableColumns: ['id', 'startsAt', 'type'],
            searchableColumns: ['code', 'type', 'actions'],
            filterableColumns: {
                type: [FilterOperator.EQ, FilterOperator.IN],
                isActive: [FilterOperator.EQ],
            },
            defaultSortBy: [['id', 'DESC']],
            maxLimit: 100,
        });
        return {
            items: result.data,
            meta: result.meta,
            links: result.links,
        }
    }
}
