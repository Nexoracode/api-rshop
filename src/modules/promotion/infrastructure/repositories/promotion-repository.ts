import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { PromotionRepository, OrderPreview } from '../../domain/interfaces/promotion-repository.interface';
import { PromotionOrmEntity } from '../entities/promotion.orm-entity';
import { PromotionMapper } from '../../application/mappers/promotion.mapper';
import { Promotion } from '../../domain/entities/promotion.entity';

@Injectable()
export class PromotionRepositoryImpl extends PromotionRepository {
    constructor(
        @InjectRepository(PromotionOrmEntity)
        private readonly repo: Repository<PromotionOrmEntity>,
    ) {
        super();
    }

    // -----------------------------------------
    // 🔥 Helper: Base Query
    // -----------------------------------------
    private baseQuery(): SelectQueryBuilder<PromotionOrmEntity> {
        return this.repo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.conditions', 'c')
            .leftJoinAndSelect('p.actions', 'a');
    }

    // -----------------------------------------
    // 🔍 Find By ID
    // -----------------------------------------
    async findById(id: number): Promise<Promotion | null> {
        const entity = await this.baseQuery()
            .where('p.id = :id', { id })
            .getOne();

        return entity ? PromotionMapper.fromOrmToDomain(entity) : null;
    }

    // -----------------------------------------
    // 🔍 Find Coupon By Code (Active)
    // -----------------------------------------
    async findActiveByCode(code: string): Promise<Promotion | null> {
        const now = new Date();

        const entity = await this.baseQuery()
            .where('p.code = :code', { code })
            .andWhere('p.isActive = :active', { active: true })
            .andWhere('p.startsAt <= :now', { now })
            .andWhere('p.endsAt >= :now', { now })
            .getOne();

        return entity ? PromotionMapper.fromOrmToDomain(entity) : null;
    }

    // -----------------------------------------
    // 🔍 Find ALL active promotions for check
    // -----------------------------------------
    async findActiveForOrder(order: OrderPreview): Promise<Promotion[]> {
        const now = new Date();

        const entities = await this.baseQuery()
            .where('p.isActive = :active', { active: true })
            .andWhere('p.startsAt <= :now', { now })
            .andWhere('p.endsAt >= :now', { now })
            .orderBy('p.id', 'DESC')
            .getMany();

        return entities.map(PromotionMapper.fromOrmToDomain);
    }

    // -----------------------------------------
    // 🔧 Create Promotion
    // -----------------------------------------
    async create(domain: Promotion): Promise<Promotion> {
        const orm = PromotionMapper.fromDomainToOrm(domain);
        const saved = await this.repo.save(orm);

        return PromotionMapper.fromOrmToDomain(saved);
    }

    // -----------------------------------------
    // 🔧 Update Promotion
    // -----------------------------------------
    async update(id: number, domain: Promotion): Promise<Promotion> {
        const orm = PromotionMapper.fromDomainToOrm(domain);
        orm.id = id;

        const saved = await this.repo.save(orm);
        return PromotionMapper.fromOrmToDomain(saved);
    }

    // -----------------------------------------
    // 🗑 Delete Promotion
    // -----------------------------------------
    async delete(id: number): Promise<void> {
        await this.repo.delete(id);
    }

    // -----------------------------------------
    // 📄 Pagination + Filtering (Admin Panel)
    // -----------------------------------------
    async paginate(params: {
        page: number;
        limit: number;
        search?: string;
        type?: string;
        isActive?: boolean;
        status?: 'active' | 'expired' | 'upcoming';
    }): Promise<{ items: Promotion[]; total: number }> {

        const { page, limit, search, type, isActive, status } = params;

        const qb = this.baseQuery();

        // 🔍 Search
        if (search) {
            qb.andWhere('p.name LIKE :search', { search: `%${search}%` });
        }

        // 🎯 Filter by Promotion Type
        if (type) {
            qb.andWhere('p.type = :type', { type });
        }

        // ⚡ Filter by Active/Inactive
        if (typeof isActive === 'boolean') {
            qb.andWhere('p.isActive = :active', { active: isActive });
        }

        // 🕒 Time-based filter
        const now = new Date();

        if (status === 'active') {
            qb.andWhere('p.startsAt <= :now', { now });
            qb.andWhere('p.endsAt >= :now', { now });
        }

        if (status === 'expired') {
            qb.andWhere('p.endsAt < :now', { now });
        }

        if (status === 'upcoming') {
            qb.andWhere('p.startsAt > :now', { now });
        }

        qb.orderBy('p.id', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [entities, total] = await qb.getManyAndCount();

        return {
            items: entities.map(PromotionMapper.fromOrmToDomain),
            total,
        };
    }
}
