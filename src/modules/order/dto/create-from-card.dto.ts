import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateOrderFromCardDto {
    @ApiProperty({
        example: 12,
        description: 'شناسه آدرس انتخاب شده برای سفارش',
    })
    @IsInt()
    addressId: number;

    @ApiPropertyOptional({
        example: 'سفارش برای هدیه پیچیده شود',
        description: 'توضیحات اختیاری سفارش',
    })
    @IsOptional()
    @IsString()
    note?: string;

    @ApiPropertyOptional({
        example: 'WINTER15',
        description: 'کد تخفیف مربوط به پروموشن (اختیاری)',
    })
    @IsOptional()
    @IsString()
    promotionCode?: string;

    // 🎁 Gift Wrapping Fields
    @ApiPropertyOptional({
        example: false,
        default: false,
        description: 'آیا این سفارش یک هدیه است؟',
    })
    @IsOptional()
    @IsBoolean()
    isGift?: boolean;

    @ApiPropertyOptional({
        example: 1,
        description: 'شناسه بسته‌بندی کادو (در صورت انتخاب)',
    })
    @IsOptional()
    @IsInt()
    giftWrappingId?: number;

    @ApiPropertyOptional({
        example: 'تولدت مبارک! امیدوارم این هدیه رو دوست داشته باشی',
        description: 'پیام هدیه (حداکثر 500 کاراکتر)',
    })
    @IsOptional()
    @IsString()
    giftMessage?: string;
}
