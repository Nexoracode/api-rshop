// promotion/application/mappers/promotion.mapper.ts

import { PromotionAction } from '../../domain/entities/promotion-action.entity';
import { PromotionCondition } from '../../domain/entities/promotion-confition.entity';
import { Promotion } from '../../domain/entities/promotion.entity';
import { PromotionActionOrmEntity } from '../../infrastructure/entities/promotion-action.orm-entity';
import { PromotionConditionOrmEntity } from '../../infrastructure/entities/promotion-condition.orm-entity';
import { PromotionOrmEntity } from '../../infrastructure/entities/promotion.orm-entity';
import {
    CreatePromotionActionDto,
    CreatePromotionConditionDto,
    CreatePromotionDto,
} from '../dtos/create-promotion.dto';
import { PromotionActionDetailDto, PromotionConditionDetailDto, PromotionDetailResponseDto, PromotionResponseDto } from '../dtos/promotion-response.dto';

export class PromotionMapper {
    static fromCreateDtoToDomain(dto: CreatePromotionDto): Promotion {
        const conditions =
            dto.conditions?.map(
                (c: CreatePromotionConditionDto) =>
                    new PromotionCondition({
                        type: c.type,
                        userId: c.userId ?? undefined,
                        products: c.products ?? undefined,
                        categoryIds: c.categoryIds ?? undefined,
                        minAmount: c.minAmount ?? undefined,
                    }),
            ) ?? [];

        const actions =
            dto.actions?.map(
                (a: CreatePromotionActionDto) =>
                    new PromotionAction({
                        type: a.type,
                        value: a.value ?? undefined,
                        meta: a.meta ?? undefined,
                    }),
            ) ?? [];

        return new Promotion({
            name: dto.name,
            type: dto.type,
            code: dto.code ?? null,
            startsAt: new Date(dto.startsAt),
            endsAt: new Date(dto.endsAt),
            usageLimit: dto.usageLimit ?? null,
            usedCount: 0,
            isActive: dto.isActive ?? true,
            conditions,
            actions,
        });
    }

    static fromOrmToDomain(entity: PromotionOrmEntity): Promotion {
        const conditions =
            entity.conditions?.map(
                (c: PromotionConditionOrmEntity) =>
                    new PromotionCondition({
                        id: c.id,
                        type: c.type,
                        userId: c.userId ?? undefined,
                        products: c.products ?? undefined,
                        categoryIds: c.categoryIds ?? undefined,
                        minAmount: c.minAmount
                            ? Number(c.minAmount)
                            : undefined,
                    }),
            ) ?? [];

        const actions =
            entity.actions?.map(
                (a: PromotionActionOrmEntity) =>
                    new PromotionAction({
                        id: a.id,
                        type: a.type,
                        value: a.value ? Number(a.value) : undefined,
                        meta: a.meta ?? undefined,
                    }),
            ) ?? [];

        return new Promotion({
            id: entity.id,
            name: entity.name,
            type: entity.type,
            code: entity.code,
            startsAt: entity.startsAt,
            endsAt: entity.endsAt,
            usageLimit: entity.usageLimit,
            usedCount: entity.usedCount,
            isActive: entity.isActive,
            conditions,
            actions,
        });
    }

    static fromDomainToOrm(domain: Promotion): PromotionOrmEntity {
        const orm = new PromotionOrmEntity();
        orm.id = domain.id!;
        orm.name = domain.name;
        orm.type = domain.type;
        orm.code = domain.code ?? null;
        orm.startsAt = domain.startsAt;
        orm.endsAt = domain.endsAt;
        orm.usageLimit = domain.usageLimit ?? null;
        orm.usedCount = domain.usedCount ?? 0;
        orm.isActive = domain.isActive;

        orm.conditions =
            domain.conditions?.map((c) => {
                const ce = new PromotionConditionOrmEntity();
                ce.id = c.id!;
                ce.type = c.type;
                ce.userId = c.userId ?? null;
                ce.products = c.products ?? null;               // ✅
                ce.categoryIds = c.categoryIds ?? null;
                ce.minAmount =
                    typeof c.minAmount === 'number'
                        ? c.minAmount.toString()
                        : null;
                ce.promotion = orm;
                return ce;
            }) ?? [];

        orm.actions =
            domain.actions?.map((a) => {
                const ae = new PromotionActionOrmEntity();
                ae.id = a.id;
                ae.type = a.type;
                ae.value = (
                    typeof a.value === 'number'
                        ? a.value.toString()
                        : null
                ) as any;
                ae.meta = a.meta ?? null;
                ae.promotion = orm;
                return ae;
            }) ?? [];

        return orm;
    }

    static toResponseDto(domain: Promotion): PromotionResponseDto {
        return {
            id: domain.id!,
            name: domain.name,
            type: domain.type,
            code: domain.code ?? null,
            startsAt: domain.startsAt,
            endsAt: domain.endsAt,
            isActive: domain.isActive,
        };
    }

    static toDetailResponseDto(domain: Promotion): PromotionDetailResponseDto {
        const conditions: PromotionConditionDetailDto[] =
            domain.conditions?.map((c) => ({
                type: c.type,
                userId: c.userId ?? null,
                products: c.products ?? null,
                categoryIds: c.categoryIds ?? null,
                minAmount:
                    typeof c.minAmount === 'number' ? c.minAmount : c.minAmount ?? null,
            })) ?? [];

        const actions: PromotionActionDetailDto[] =
            domain.actions?.map((a) => ({
                type: a.type,
                value:
                    typeof a.value === 'number'
                        ? a.value
                        : a.value ?? null,
                meta: a.meta ?? null,
            })) ?? [];

        return {
            id: domain.id!,
            name: domain.name,
            type: domain.type,
            code: domain.code ?? null,
            startsAt: domain.startsAt,
            endsAt: domain.endsAt,
            isActive: domain.isActive,
            usageLimit: domain.usageLimit ?? null,
            usedCount: domain.usedCount ?? 0,
            conditions,
            actions,
        };
    }
}
