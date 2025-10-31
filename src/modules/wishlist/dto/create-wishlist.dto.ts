import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateWishlistDto {
    @ApiProperty({ name: 'product_id', example: 42 })
    @IsInt()
    productId: number;
}
