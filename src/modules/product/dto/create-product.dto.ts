import { ApiProperty } from "@nestjs/swagger";
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateIf } from "class-validator";
import { WeightUnit } from "src/common/enums/product.enum";

export class CreateProductDto {

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNumber()
    price: number;

    @ApiProperty()
    @IsInt()
    stock: number;

    @ApiProperty()
    @IsOptional()
    @IsBoolean()
    isLimitedStock?: boolean;

    @ApiProperty()
    @IsInt()
    categoryId: number;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    discountAmount?: number;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    discountPercent?: number;

    @ApiProperty()
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    weight?: number;

    @ApiProperty({ enum: WeightUnit })
    @IsEnum(WeightUnit)
    weightUnit: WeightUnit

    @IsOptional()
    @IsBoolean()
    isSameDayShipping?: boolean;

    @IsOptional()
    @IsBoolean()
    requiresPreparation?: boolean;

    @IsOptional()
    @ValidateIf(o => o.requiresPreparation === true)
    @IsInt()
    @Min(1)
    preparationDays?: number;

    @ApiProperty()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty()
    @IsOptional()
    @IsBoolean()
    isVisible?: boolean;

    @ApiProperty()
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @IsInt({ each: true })
    mediaIds?: number[];
}