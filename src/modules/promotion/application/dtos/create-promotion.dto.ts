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
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

import { PromotionType } from '../../domain/enums/promotion-type.enum';
import { ConditionType } from '../../domain/enums/confition-type.enum';
import { ActionType } from '../../domain/enums/action-type.enum';

export class CreatePromotionConditionDto {
    @ApiProperty({ enum: ConditionType })
    @IsEnum(ConditionType)
    type: ConditionType;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    userId?: number;

    @ApiProperty({ type: [Number], required: false })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    productIds?: number[];

    @ApiProperty({ type: [Number], required: false })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    categoryIds?: number[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    minAmount?: number;
}

export class CreatePromotionActionDto {
    @ApiProperty({ enum: ActionType })
    @IsEnum(ActionType)
    type: ActionType;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    value?: number;

    @ApiProperty({ required: false, type: Object })
    @IsOptional()
    meta?: Record<string, any>;
}

export class CreatePromotionDto {
    @ApiProperty({ example: '20% OFF for perfumes' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ enum: PromotionType })
    @IsEnum(PromotionType)
    type: PromotionType;

    @ApiProperty({ required: false, example: 'OFF20' })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiProperty({ example: '2025-01-01 00:00:00' })
    @IsDateString()
    startsAt: string;

    @ApiProperty({ example: '2025-12-31 23:59:59' })
    @IsDateString()
    endsAt: string;

    @ApiProperty({ required: false, example: 100 })
    @IsOptional()
    @IsInt()
    @Min(0)
    usageLimit?: number;

    @ApiProperty({ required: false, default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ type: [CreatePromotionConditionDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePromotionConditionDto)
    conditions: CreatePromotionConditionDto[];

    @ApiProperty({ type: [CreatePromotionActionDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePromotionActionDto)
    actions: CreatePromotionActionDto[];
}
