import {
    IsArray,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// -----------------------------
// CheckPromotionItemDto
// -----------------------------
export class CheckPromotionItemDto {
    @ApiProperty({ example: 12 })
    @IsInt()
    productId: number;

    @ApiPropertyOptional({ example: 101 })
    @IsOptional()
    @IsInt()
    variantId?: number;

    @ApiPropertyOptional({ example: 3 })
    @IsOptional()
    @IsInt()
    categoryId?: number;

    @ApiProperty({ example: 2 })
    @IsInt()
    quantity: number;

    @ApiProperty({ example: 150000 })
    @IsNumber()
    unitPrice: number;
}

// -----------------------------
// CheckPromotionDto
// -----------------------------
export class CheckPromotionDto {
    @ApiProperty({ example: 1 })
    @IsInt()
    userId: number;

    @ApiPropertyOptional({
        example: 'WINTER15',
        description: 'If provided, only this code will be validated',
    })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiProperty({
        type: [CheckPromotionItemDto],
        description: 'Items inside the order',
    })
    @IsArray()
    items: CheckPromotionItemDto[];

    @ApiProperty({ example: 450000 })
    @IsNumber()
    subtotal: number;

    @IsOptional()
    isFirstOrder?: boolean;
}
