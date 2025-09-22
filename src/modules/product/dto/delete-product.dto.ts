import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteProductsDto {
    @ApiProperty({
        type: [Number],
        example: [1, 2, 3],
        description: 'آیدی محصولات برای حذف',
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    @Type(() => Number)
    ids: number[];
}
