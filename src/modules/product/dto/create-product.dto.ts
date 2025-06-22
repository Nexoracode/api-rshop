import { ApiProperty } from "@nestjs/swagger";
import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateIf } from "class-validator";

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

    @ApiProperty()
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    attributeValueIds?: number[];

    @ApiProperty()
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    variantIds?: number[];

}