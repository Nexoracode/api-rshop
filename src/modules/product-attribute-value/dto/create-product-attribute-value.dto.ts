// dto/create-product-attribute-value.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class CreateProductAttributeValueDto {
    @ApiProperty({ type: 'integer', example: 1 })
    @IsInt()
    productId: number;

    @ApiProperty({ type: 'integer', example: 1 })
    @IsInt()
    attributeId: number;

    @ApiProperty({ type: 'array', example: [], required: false })
    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    valueIds?: number[];

    @ApiProperty({ type: 'boolean', example: false })
    @IsOptional()
    @IsBoolean()
    isImportant: boolean;

    @IsInt()
    @IsOptional()
    displayOrder: number
}
