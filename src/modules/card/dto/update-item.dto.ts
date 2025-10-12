import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';


export class UpdateItemDto {
    @ApiProperty({ type: 'number', })
    @IsInt()
    itemId: number;


    @ApiProperty({ type: 'number', example: 5, description: 'تعداد محصول در کارت' })
    @IsInt()
    @Min(0)
    quantity: number; // اگر 0 شود، سطر حذف می‌شود
}