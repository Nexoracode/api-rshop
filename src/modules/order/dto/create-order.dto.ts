import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    isNotEmpty,
    IsNotEmpty,
    IsOptional,
    ValidateNested,
} from "class-validator";
import { OrderStatus } from "../enums/order-status.enum";
import { ManualDiscountType } from "src/common/enums/discount.enum";

// ============================
// 👇 سطح ۳: جزئیات واریانت‌ها
// ============================
export class ManualVariantDto {
    @ApiProperty({
        example: 3,
        description: "شناسه واریانت (Variant ID)",
    })
    @IsInt()
    id: number;

    @ApiProperty({
        example: 5,
        description: "تعداد انتخاب‌شده از این واریانت",
    })
    @IsInt()
    quantity: number;
}

// ============================
// 👇 سطح ۲: محصول با لیست واریانت‌ها
// ============================
export class ManualProductDto {
    @ApiProperty({
        example: 1,
        description: "شناسه محصول (Product ID)",
    })
    @IsInt()
    productId: number;

    @ApiProperty({
        example: 5,
        description: "تعداد محصول (فقط زمانی که variant نداریم)",
        required: false,
    })
    @IsOptional()
    @IsInt()
    quantity?: number;

    @ApiProperty({
        type: [ManualVariantDto],
        description: "لیست واریانت‌ها به‌همراه تعداد هرکدام (اختیاری)",
        example: [
            { id: 3, quantity: 10 },
            { id: 5, quantity: 2 },
        ],
        required: false,
    })
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => ManualVariantDto)
    variantIds?: ManualVariantDto[] | null;
}

// ============================
// 👇 سطح ۱: DTO نهایی ثبت سفارش دستی
// ============================
export class CreateManualOrderDto {
    @ApiProperty({
        name: 'user_id',
        example: 2,
        description: "شناسه کاربر (User ID)",
    })
    @IsInt()
    userId: number;

    @ApiProperty({
        name: 'address_id',
        example: 2,
        description: "آدرس کاربر (Address ID)",
    })
    @IsNotEmpty()
    @IsInt()
    addressId: number;

    @ApiProperty({
        name: 'manual_discount_type',
        enum: ManualDiscountType,
        required: false,
        description: "نوع تخفیف دستی: مبلغ ثابت یا درصدی",
    })
    @IsOptional()
    @IsEnum(ManualDiscountType)
    manualDiscountType?: ManualDiscountType;

    @ApiProperty({
        name: 'manual_discount_value',
        example: 20000,
        required: false,
        description: "مقدار تخفیف دستی (بسته به نوع: مبلغ یا درصد)",
    })
    @IsOptional()
    @IsInt()
    manualDiscountValue?: number;


    @ApiProperty({
        type: [ManualProductDto],
        description: "لیست محصولات انتخاب‌شده برای این سفارش",
        example: [
            {
                product_id: 1,
                quantity: 5,
                variant_ids: [
                    { id: 3, quantity: 20 },
                    { id: 5, quantity: 3 },
                ],
            },
            {
                product_id: 2,
                quantity: 10
            },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ManualProductDto)
    items: ManualProductDto[];

    @ApiProperty({
        enum: OrderStatus,
        example: OrderStatus.AWAITING_PAYMENT,
        description: "وضعیت سفارش (مثلاً pending، paid، delivered و ...)",
    })
    @IsNotEmpty()
    @IsEnum(OrderStatus)
    status: OrderStatus;
}
