import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';

export class AddProductsToCollectionDto {
    @ApiProperty({
        description: 'آرایه شناسه محصولات برای اضافه کردن',
        example: [1, 5, 10, 15],
        type: [Number],
    })
    @IsArray()
    @ArrayMinSize(1, { message: 'حداقل یک محصول باید انتخاب شود' })
    @IsInt({ each: true })
    productIds: number[];
}