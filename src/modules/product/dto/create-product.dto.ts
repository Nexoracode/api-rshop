import { ApiProperty } from "@nestjs/swagger";
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateIf } from "class-validator";
import { WeightUnit } from "src/common/enums/product.enum";
import { Media } from "src/modules/media/entities/image.entity";

export class CreateProductDto {

    @ApiProperty()
    @IsString()
    name!: string;

    @ApiProperty()
    @IsNumber()
    price!: number;

    @ApiProperty()
    @IsInt()
    stock!: number;

    @ApiProperty()
    @IsString()
    sku!: string;

    @ApiProperty({ name: 'is_limited_stock', default: false })
    @IsOptional()
    @IsBoolean()
    isLimitedStock?: boolean;

    @ApiProperty({ name: 'category_id', default: 0 })
    @IsInt()
    categoryId!: number;

    @ApiProperty({ name: 'discount_amount', default: 0 })
    @IsOptional()
    @IsNumber()
    discountAmount?: number;

    @ApiProperty({ name: 'discount_percent', default: 0 })
    @IsOptional()
    @IsNumber()
    discountPercent?: number;

    @ApiProperty({ name: 'is_featured', default: false })
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @ApiProperty({ name: 'is_active', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    weight?: number;

    @ApiProperty({ name: 'weight_unit', enum: WeightUnit, default: WeightUnit.KG })
    @IsEnum(WeightUnit)
    weightUnit!: WeightUnit;

    @ApiProperty({ name: 'is_same_day_shipping', default: false })
    @IsOptional()
    @IsBoolean()
    isSameDayShipping!: boolean;

    @ApiProperty({ name: 'requires_preparation', default: false })
    @IsOptional()
    @IsBoolean()
    requiresPreparation!: boolean;

    @ApiProperty({ name: 'preparation_days', default: 0 })
    @IsOptional()
    @ValidateIf(o => o.requiresPreparation === true)
    @IsInt()
    @Min(1)
    preparationDays!: number;

    @ApiProperty()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ name: 'order_limit', default: 0 })
    @IsOptional()
    @IsInt()
    orderLimit?: number;

    @ApiProperty({ name: 'is_visible', default: false })
    @IsOptional()
    @IsBoolean()
    isVisible?: boolean;

    @ApiProperty({ name: 'media_ids', default: [], example: [] })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @IsInt({ each: true })
    mediaIds?: number[];

    @ApiProperty({ name: 'media_pinned_id', default: 0 })
    @IsOptional()
    @IsInt()
    mediaPinnedId?: number;

    @ApiProperty({ name: 'helper_id' })
    @IsOptional()
    @IsInt()
    helperId?: number;

    @ApiProperty({ name: 'brand_id' })
    @IsOptional()
    @IsInt()
    brandId?: number;
}