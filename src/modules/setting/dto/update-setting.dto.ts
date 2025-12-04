import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SettingCategory } from '../enums/setting-category.enum';

export class UpdateSettingDto {
    @ApiProperty({ 
        description: 'کلید تنظیم',
        example: 'shop_card_number'
    })
    @IsString()
    key: string;

    @ApiProperty({ 
        description: 'مقدار تنظیم',
        example: '6037-9912-1234-5678'
    })
    @IsString()
    value: string;

    @ApiPropertyOptional({ 
        description: 'توضیحات',
        example: 'شماره کارت فروشگاه برای پرداخت کارت به کارت'
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ 
        description: 'دسته‌بندی',
        enum: SettingCategory,
        example: SettingCategory.PAYMENT
    })
    @IsEnum(SettingCategory)
    @IsOptional()
    category?: SettingCategory;
}
