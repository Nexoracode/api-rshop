import {
    IsArray,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckPromotionItemDto {
    @ApiProperty({ example: 12 })
    @IsInt()
    productId: number;

    @ApiProperty({ required: false, example: 5 })
    @IsOptional()
    @IsInt()
    categoryId?: number;

    @ApiProperty({ example: 2 })
    @IsInt()
    quantity: number;

    @ApiProperty({ example: 180000 })
    @IsNumber()
    unitPrice: number;
}

export class CheckPromotionDto {
    @ApiProperty({ example: 42 })
    @IsInt()
    userId: number;

    @ApiProperty({ required: false, example: 'OFF20' })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiProperty({ type: [CheckPromotionItemDto] })
    @IsArray()
    items: CheckPromotionItemDto[];

    @ApiProperty({ example: 350000 })
    @IsNumber()
    subtotal: number;

    @ApiProperty({ example: 30000 })
    @IsNumber()
    shippingCost: number;

    @ApiProperty({ required: false, example: true })
    @IsOptional()
    isFirstOrder?: boolean;
}
