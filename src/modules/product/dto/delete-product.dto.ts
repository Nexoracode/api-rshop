import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteProductsDto {
    @ApiProperty({
        type: [Number],
        example: [1, 2, 3],
        description: 'آیدی محصولات برای حذف',
    })
    @IsArray({ message: 'آیدی محصولات باید به صورت آرایه باشد' })
    @ArrayNotEmpty()
    @IsInt({ each: true, message: 'هر آیدی باید از نوع عدد صحیح باشد' })
    @Type(() => Number)
    ids: number[];
}
