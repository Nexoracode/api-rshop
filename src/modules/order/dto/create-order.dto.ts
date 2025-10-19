import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    ValidateNested,
} from "class-validator";
import { OrderStatus } from "../enums/order-status.enum";

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
        type: [ManualVariantDto],
        description: "لیست واریانت‌ها به‌همراه تعداد هرکدام",
        example: [
            { id: 3, quantity: 10 },
            { id: 5, quantity: 2 },
        ],
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
        example: 2,
        description: "شناسه کاربر (User ID)",
    })
    @IsInt()
    userId: number;

    @ApiProperty({
        type: [ManualProductDto],
        description: "لیست محصولات انتخاب‌شده برای این سفارش",
        example: [
            {
                product_id: 1,
                variant_ids: [
                    { id: 3, quantity: 20 },
                    { id: 5, quantity: 3 },
                ],
            },
            {
                product_id: 2,
                variant_ids: [{ id: 7, quantity: 2 }],
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

    @ApiProperty({
        example: true,
        description: "آیا سفارش به‌صورت دستی ثبت شده است؟",
        default: true,
    })
    @IsBoolean()
    isManual: boolean = true;
}
