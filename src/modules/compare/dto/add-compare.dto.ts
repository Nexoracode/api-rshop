import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class AddCompareDto {
    @ApiProperty({ example: 20 })
    @IsInt()
    productId: number;
}
