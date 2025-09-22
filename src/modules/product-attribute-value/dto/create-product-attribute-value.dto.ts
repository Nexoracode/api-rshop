// dto/create-product-attribute-value.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsInt, IsOptional, IsString } from "class-validator";

export class CreateProductAttributeValueDto {
    @ApiProperty({ type: 'integer', example: 1 })
    @IsInt()
    productId: number;

    @ApiProperty({ type: 'integer', example: 1 })
    @IsInt()
    attributeId: number;

    @ApiProperty({ type: 'array', example: [1, 2, 3], required: false })
    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    valueIds?: number[];

    @ApiProperty({ type: 'array', example: ['Custom Value'], required: false })
    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    customValues?: string[];
}
