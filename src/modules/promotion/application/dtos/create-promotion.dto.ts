import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionType } from '../../domain/enums/promotion-type.enum';
import { ActionType } from '../../domain/enums/action-type.enum';
import { ConditionType } from '../../domain/enums/condition-type.enum';

export class ProductConditionDto {
    @ApiProperty({ name: 'product_id', example: 12 })
    @IsInt()
    productId: number;

    @ApiPropertyOptional({
        name: 'variant_ids',
        example: [101, 102, 103],
        description: 'Optional variant IDs for this product',
    })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    variantIds?: number[];
}

export class CreatePromotionConditionDto {
    @ApiProperty({ enum: ConditionType })
    @IsEnum(ConditionType)
    type: ConditionType;

    @ApiPropertyOptional({ name: 'user_ids', example: [5, 10, 15], description: 'شناسه چند کاربر خاص' })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    userIds?: number[];

    @ApiPropertyOptional({
        type: [ProductConditionDto],
        description: 'List of products and optional variant IDs',
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductConditionDto)
    products?: ProductConditionDto[];

    @ApiPropertyOptional({
        name: 'category_ids',
        example: [1, 2, 3],
        description: 'Filter by category IDs',
    })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    categoryIds?: number[];

    @ApiPropertyOptional({ name: 'min_amount', example: 200000 })
    @IsOptional()
    @IsNumber()
    minAmount?: number;
}

export class CreatePromotionActionDto {
    @ApiProperty({ enum: ActionType })
    @IsEnum(ActionType)
    type: ActionType;

    @ApiPropertyOptional({ example: 15 })
    @IsOptional()
    @IsNumber()
    value?: number;

    @ApiPropertyOptional({
        example: { maxUsagePerUser: 1 },
    })
    @IsOptional()
    meta?: Record<string, any>;
}

export class CreatePromotionDto {
    @ApiProperty({ example: '15% off on selected variants' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ enum: PromotionType })
    @IsEnum(PromotionType)
    type: PromotionType;

    @ApiPropertyOptional({ example: 'WINTER15' })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiProperty({ name: 'starts_at', example: '2025-01-01T00:00:00.000Z' })
    @IsDateString()
    startsAt: string;

    @ApiProperty({ name: 'ends_at', example: '2025-12-31T23:59:59.000Z' })
    @IsDateString()
    endsAt: string;

    @ApiPropertyOptional({ name: 'usage_limit', example: 100 })
    @IsOptional()
    @IsInt()
    usageLimit?: number;

    @ApiPropertyOptional({ name: 'max_discount_amount', example: 500000, description: 'حداکثر مبلغ تخفیف قابل اعمال (سقف تخفیف)' })
    @IsOptional()
    @IsNumber()
    maxDiscountAmount?: number;

    @ApiPropertyOptional({ name: 'is_active', example: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({
        type: [CreatePromotionConditionDto],
        description: 'Conditions for applying this promotion',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePromotionConditionDto)
    conditions: CreatePromotionConditionDto[];

    @ApiProperty({
        type: [CreatePromotionActionDto],
        description: 'Actions this promotion performs (discount, free shipping, etc)',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePromotionActionDto)
    actions: CreatePromotionActionDto[];
}
