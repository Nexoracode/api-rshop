import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class ApplyCouponDto {
    @ApiProperty({ example: "WELCOME10", description: "کد تخفیف واردشده توسط کاربر" })
    @IsString()
    code: string;

    @ApiProperty({ name: 'user_id', example: 1, description: "شناسه کاربر" })
    @IsNumber()
    userId: number;

    @ApiProperty({ name: 'total_amount', example: 250000, description: "مجموع مبلغ سبد خرید" })
    @IsNumber()
    totalAmount: number;
}
