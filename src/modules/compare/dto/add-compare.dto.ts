import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class AddCompareDto {
    @ApiProperty({ name: 'product_id', example: 20 })
    @IsInt()
    productId: number;
}
