import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
    @ApiProperty({ name: 'product_id', example: 1 })
    @IsInt()
    productId: number;

    @ApiProperty({ example: 5 })
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiProperty({ example: 'محصول خیلی خوبی بود!' })
    @IsString()
    @IsOptional()
    comment?: string;
}