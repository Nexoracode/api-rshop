import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateVariantProductDto {
    @ApiProperty({ name: 'product_id', default: 1 })
    @IsInt()
    productId: number;

    @ApiProperty({
        default: "DP-4e34",
        type: 'string'
    })
    @IsString()
    @IsNotEmpty()
    sku: string;

    @ApiProperty({
        type: 'integer',
        example: '200000'
    })
    @IsInt()
    @Min(0)
    price: number;

    @ApiProperty({ name: 'discount_amount', default: 0 })
    @IsOptional()
    @IsNumber()
    discountAmount?: number;

    @ApiProperty({ name: 'discount_percent', default: 0 })
    @IsOptional()
    @IsNumber()
    discountPercent?: number;

    @ApiProperty()
    @IsInt()
    @Min(0)
    stock: number;
}