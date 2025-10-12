import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsDate, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { CouponType } from "../entities/coupon.entity";

export class CreateCouponDto {
    @ApiProperty({ example: "WELCOME10", description: "کد تخفیف یکتا" })
    @IsString()
    code: string;

    @ApiProperty({ enum: CouponType, example: CouponType.PERCENT })
    @IsEnum(CouponType)
    type: CouponType;

    @ApiProperty({ example: 10, description: "مقدار تخفیف (درصد یا مبلغ ثابت)" })
    @IsNumber()
    @Min(0)
    amount: number;

    @ApiProperty({ name: 'mid_order_amount', example: 100000, required: false, description: "حداقل مبلغ سفارش برای فعال شدن کد" })
    @IsOptional()
    @IsNumber()
    minOrderAmount?: number;

    @ApiProperty({ name: 'max_discount_amount', example: 50000, required: false, description: "حداکثر مبلغ تخفیف (در درصدی‌ها)" })
    @IsOptional()
    @IsNumber()
    maxDiscountAmount?: number;

    @ApiProperty({ name: 'start_date', example: '2024-06-01T00:00:00.000Z', required: false, description: "زمان شروع اعتبار کد" })
    @IsOptional()
    @IsDate()
    startDate?: Date;

    @ApiProperty({ name: 'end_date', example: '2024-06-01T00:00:00.000Z', required: false, description: "زمان پایان اعتبار کد" })
    @IsOptional()
    @IsDate()
    endDate?: Date;

    @ApiProperty({ name: 'usage_limit', example: 50, required: false, description: "حداکثر تعداد استفاده از کد" })
    @IsOptional()
    @IsNumber()
    usageLimit?: number;

    @ApiProperty({ name: 'is_active', example: true, required: false, description: "فعال بودن کد تخفیف" })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ name: 'for_first_order', example: true, required: false, description: "آیا مخصوص اولین سفارش است؟" })
    @IsOptional()
    @IsBoolean()
    forFirstOrder?: boolean;

    @ApiProperty({ name: 'allowed_user_ids', example: [1, 2, 3], required: false, description: "شناسه کاربران مجاز" })
    @IsOptional()
    allowedUserIds?: number[];

    @ApiProperty({ name: 'allowed_product_ids', example: [4, 5], required: false, description: "شناسه محصولات مجاز" })
    @IsOptional()
    allowedProductIds?: number[];

    @ApiProperty({ name: 'allowed_category_ids', example: [10, 12], required: false, description: "شناسه دسته‌های مجاز" })
    @IsOptional()
    allowedCategoryIds?: number[];
}
