import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    Min,
    MaxLength,
    IsArray,
    IsDateString,
    IsUrl,
} from 'class-validator';

export class CreateCollectionDto {
    @ApiProperty({
        description: 'عنوان مجموعه',
        example: 'هدایای ویژه روز پدر',
    })
    @IsString()
    @MaxLength(191)
    title: string;

    @ApiProperty({
        description: 'نامک (slug) برای URL',
        example: 'fathers-day-gifts',
    })
    @IsString()
    @MaxLength(191)
    slug: string;

    @ApiPropertyOptional({
        description: 'توضیحات مجموعه',
        example: 'بهترین هدایا برای پدر عزیز شما',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'آدرس تصویر مجموعه',
        example: '/uploads/collections/fathers-day.jpg',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    image?: string;

    @ApiPropertyOptional({
        description: 'وضعیت فعال بودن',
        example: true,
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        description: 'ترتیب نمایش',
        example: 0,
        default: 0,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;

    @ApiPropertyOptional({
        description: 'تاریخ شروع نمایش مجموعه (ISO format)',
        example: '2024-06-01T00:00:00.000Z',
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({
        description: 'تاریخ پایان نمایش مجموعه (ISO format)',
        example: '2024-06-30T23:59:59.000Z',
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({
        description: 'آرایه شناسه محصولات',
        example: [1, 5, 10, 15],
        type: [Number],
    })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    productIds?: number[];
}