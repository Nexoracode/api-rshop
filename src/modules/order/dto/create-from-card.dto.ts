import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

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
}
