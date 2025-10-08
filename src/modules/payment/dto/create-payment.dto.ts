import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class CreatePaymentDto {
    @ApiProperty({ example: 100000, description: "مبلغ پرداخت (تومان)" })
    @IsNumber()
    amount: number;

    @ApiProperty({ name: 'order_id', example: 123, description: "شناسه سفارش" })
    @IsNumber()
    orderId: number;

    @ApiProperty({ name: 'callback', example: "https://your-site.com/payment/verify", description: "آدرس بازگشت از درگاه" })
    @IsString()
    callback: string;
}
