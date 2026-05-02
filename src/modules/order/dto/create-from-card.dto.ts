import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateOrderFromCardDto {
    @ApiProperty({
        name: 'address_id',
        example: 12,
        description: 'شناسه آدرس انتخاب شده برای سفارش',
    })
    @IsInt()
    addressId!: number;

    @ApiPropertyOptional({
        example: 'سفارش برای هدیه پیچیده شود',
        description: 'توضیحات اختیاری سفارش',
    })
    @IsOptional()
    @IsString()
    note?: string;

    @ApiPropertyOptional({
        name: 'code',
        description: 'کد تخفیف مربوط به پروموشن (اختیاری)',
    })
    @IsOptional()
    @IsString()
    code?: string;

    // 🎁 Gift Wrapping Fields
    @ApiPropertyOptional({
        name: 'is_gift',
        example: false,
        default: false,
        description: 'آیا این سفارش یک هدیه است؟',
    })
    @IsOptional()
    @IsBoolean()
    isGift?: boolean;

    @ApiPropertyOptional({
        name: 'gift_wrapping_id',
        example: 1,
        description: 'شناسه بسته‌بندی کادو (در صورت انتخاب)',
    })
    @IsOptional()
    @IsInt()
    giftWrappingId?: number;

    @ApiPropertyOptional({
        name: 'gift_message',
        example: 'تولدت مبارک! امیدوارم این هدیه رو دوست داشته باشی',
        description: 'پیام هدیه (حداکثر 500 کاراکتر)',
    })
    @IsOptional()
    @IsString()
    giftMessage?: string;
}
