import { PromotionAction } from '../../domain/entities/promotion-action.entity';
import { PromotionCondition } from '../../domain/entities/promotion-confition.entity';
import { Promotion } from '../../domain/entities/promotion.entity';
import { PromotionActionOrmEntity } from '../../infrastructure/entities/promotion-action.orm-entity';
import { PromotionConditionOrmEntity } from '../../infrastructure/entities/promotion-condition.orm-entity';
import { PromotionOrmEntity } from '../../infrastructure/entities/promotion.orm-entity';
import { CreatePromotionActionDto, CreatePromotionConditionDto, CreatePromotionDto } from '../dtos/create-promotion.dto';
import { PromotionResponseDto } from '../dtos/promotion-response.dto';

export class PromotionMapper {
    static fromCreateDtoToDomain(dto: CreatePromotionDto): Promotion {
        const conditions = dto.conditions?.map(
            (c: CreatePromotionConditionDto) => new PromotionCondition({ ...c }),
        ) || [];

        const actions = dto.actions?.map(
            (a: CreatePromotionActionDto) => new PromotionAction({ ...a }),
        ) || [];

        return new Promotion({
            name: dto.name,
            type: dto.type,
            code: dto.code,
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
                (c) =>
                    new PromotionCondition({
                        id: c.id,
                        type: c.type,
                        userId: c.userId ?? undefined,
                        productIds: c.productIds ?? undefined,
                        categoryIds: c.categoryIds ?? undefined,
                        minAmount: c.minAmount ?? undefined,
                    }),
            ) || [];

        const actions =
            entity.actions?.map(
                (a) =>
                    new PromotionAction({
                        id: a.id,
                        type: a.type,
                        value: a.value ?? undefined,
                        meta: a.meta ?? undefined,
                    }),
            ) || [];

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
        if (domain.id !== undefined) orm.id = domain.id;
        orm.name = domain.name;
        orm.type = domain.type;
        orm.code = domain.code || null;
        orm.startsAt = domain.startsAt;
        orm.endsAt = domain.endsAt;
        orm.usageLimit = domain.usageLimit ?? null;
        orm.usedCount = domain.usedCount ?? 0;
        orm.isActive = domain.isActive;

        orm.conditions = domain.conditions?.map((c) => {
            const ce = new PromotionConditionOrmEntity();
            ce.id = c.id;
            ce.type = c.type;
            ce.userId = c.userId ?? null;
            ce.productIds = c.productIds ?? null;
            ce.categoryIds = c.categoryIds ?? null;
            ce.minAmount = c.minAmount ?? null;
            ce.promotion = orm;
            return ce;
        });

        orm.actions = domain.actions?.map((a) => {
            const ae = new PromotionActionOrmEntity();
            ae.id = a.id;
            ae.type = a.type;
            ae.value = a.value ?? null;
            ae.meta = a.meta ?? null;
            ae.promotion = orm;
            return ae;
        });

        return orm;
    }

    static toResponseDto(domain: Promotion): PromotionResponseDto {
        return {
            id: domain.id!,
            name: domain.name,
            type: domain.type,
            code: domain.code || null,
            startsAt: domain.startsAt,
            endsAt: domain.endsAt,
            isActive: domain.isActive,
        };
    }
}