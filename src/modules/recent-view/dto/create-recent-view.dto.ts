import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateRecentViewDto {
    @ApiProperty({ name: 'product_id', example: 12 })
    @IsInt()
    productId: number;
}
