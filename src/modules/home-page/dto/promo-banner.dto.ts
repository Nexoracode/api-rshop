import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    Min,
    MaxLength,
    IsUrl,
    IsDateString,
    IsHexColor,
} from 'class-validator';

export class CreatePromoBannerDto {
    @ApiProperty({
        description: 'عنوان بنر تبلیغاتی',
        example: 'تخفیف ویژه عید',
    })
    @IsString()
    @MaxLength(191)
    title: string;

    @ApiProperty({
        description: 'آدرس تصویر/GIF بنر',
        example: '/uploads/banners/eid-sale.gif',
    })
    @IsString()
    @MaxLength(500)
    imageUrl: string;

    @ApiPropertyOptional({
        description: 'لینک کلیک بنر',
        example: '/collections/eid-sale',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    link?: string;

    @ApiPropertyOptional({
        description: 'متن دکمه لینک',
        example: 'مشاهده محصولات',
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    linkText?: string;

    @ApiPropertyOptional({
        description: 'رنگ پس‌زمینه (Hex)',
        example: '#FF5722',
    })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    backgroundColor?: string;

    @ApiPropertyOptional({
        description: 'رنگ متن (Hex)',
        example: '#FFFFFF',
    })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    textColor?: string;

    @ApiPropertyOptional({
        description: 'وضعیت فعال بودن',
        example: true,
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        description: 'قابلیت بستن توسط کاربر',
        example: true,
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    isClosable?: boolean;

    @ApiPropertyOptional({
        description: 'اولویت نمایش (عدد بزرگتر = اولویت بیشتر)',
        example: 10,
        default: 0,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    priority?: number;

    @ApiPropertyOptional({
        description: 'تاریخ شروع نمایش (ISO format)',
        example: '2024-03-01T00:00:00.000Z',
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({
        description: 'تاریخ پایان نمایش (ISO format)',
        example: '2024-03-31T23:59:59.000Z',
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({
        description: 'مدت زمان نمایش به ثانیه (null = بدون محدودیت)',
        example: 10,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    displayDuration?: number;

    @ApiPropertyOptional({
        description: 'توضیحات بنر',
        example: 'بنر تبلیغاتی تخفیف ویژه عید نوروز',
    })
    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdatePromoBannerDto extends PartialType(CreatePromoBannerDto) { }