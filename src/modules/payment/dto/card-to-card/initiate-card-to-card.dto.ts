import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class InitiateCardToCardDto {
    @ApiProperty({
        name: 'order_id',
        example: 1,
        description: 'شناسه سفارش برای پرداخت',
    })
    @IsInt()
    @IsNotEmpty()
    orderId: number;
}
