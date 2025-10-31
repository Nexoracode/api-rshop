import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateProductSupportDto {
    @ApiProperty({ example: 23 })
    @IsInt()
    productId: number;

    @ApiProperty({ example: 'این کیف رنگ قهوه‌ای هم داره؟' })
    @IsString()
    message: string;

    @ApiProperty({ example: 'سوال درباره محصول', required: false })
    @IsOptional()
    @IsString()
    subject?: string;
}
