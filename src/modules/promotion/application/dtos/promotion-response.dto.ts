import { ApiProperty } from '@nestjs/swagger';
import { PromotionType } from '../../domain/enums/promotion-type.enum';
import { ActionType } from '../../domain/enums/action-type.enum';
import { ConditionType } from '../../domain/enums/condition-type.enum';

export class PromotionResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: '15% off on selected variants' })
    name: string;

    @ApiProperty({ enum: PromotionType })
    type: PromotionType;

    @ApiProperty({ example: 'WINTER15', nullable: true })
    code?: string | null;

    @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
    startsAt: Date;

    @ApiProperty({ example: '2025-12-31T23:59:59.000Z' })
    endsAt: Date;

    @ApiProperty({ example: true })
    isActive: boolean;
}

export class PromotionConditionDetailDto {
    @ApiProperty({ enum: ConditionType })
    type: ConditionType;

    @ApiProperty({ example: 5, required: false, nullable: true })
    userId?: number | null;

    @ApiProperty({
        required: false,
        nullable: true,
        example: [
            { productId: 10, variantIds: [101, 102] },
            { productId: 20 },
        ],
    })
    products?:
        | {
            productId: number;
            variantIds?: number[];
        }[]
        | null;

    @ApiProperty({
        required: false,
        nullable: true,
        example: [1, 2, 3],
    })
    categoryIds?: number[] | null;

    @ApiProperty({ required: false, nullable: true, example: 200000 })
    minAmount?: number | null;
}

export class PromotionActionDetailDto {
    @ApiProperty({ enum: ActionType })
    type: ActionType;

    @ApiProperty({ required: false, nullable: true, example: 15 })
    value?: number | null;

    @ApiProperty({
        required: false,
        nullable: true,
        example: { maxUsagePerUser: 1 },
    })
    meta?: Record<string, any> | null;
}

export class PromotionDetailResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: '15% off on selected variants' })
    name: string;

    @ApiProperty({ enum: PromotionType })
    type: PromotionType;

    @ApiProperty({ example: 'WINTER15', nullable: true })
    code?: string | null;

    @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
    startsAt: Date;

    @ApiProperty({ example: '2025-12-31T23:59:59.000Z' })
    endsAt: Date;

    @ApiProperty({ example: true })
    isActive: boolean;

    @ApiProperty({ example: 100, nullable: true })
    usageLimit?: number | null;

    @ApiProperty({ example: 5 })
    usedCount: number;

    @ApiProperty({ type: [PromotionConditionDetailDto] })
    conditions: PromotionConditionDetailDto[];

    @ApiProperty({ type: [PromotionActionDetailDto] })
    actions: PromotionActionDetailDto[];
}
