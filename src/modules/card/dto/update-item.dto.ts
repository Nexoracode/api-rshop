import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';


export class UpdateItemDto {
    @ApiProperty({ type: 'number', format: 'uuid', example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
    @IsUUID()
    itemId: string;


    @ApiProperty({ type: 'number', example: 5, description: 'تعداد محصول در کارت' })
    @IsInt()
    @Min(0)
    quantity: number; // اگر 0 شود، سطر حذف می‌شود
}