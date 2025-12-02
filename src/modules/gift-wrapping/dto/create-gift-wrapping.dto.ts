import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { GiftWrappingStatus } from '../enums/gift-wrapping-status.enum';

export class CreateGiftWrappingDto {
    @ApiProperty({
        example: 'کاغذ کادو گل رز',
        description: 'نام بسته‌بندی',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        example: 'کاغذ کادو با طرح گل رز، مناسب برای مناسبت‌های خاص',
        description: 'توضیحات بسته‌بندی',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        example: 150000,
        description: 'قیمت بسته‌بندی به ریال',
    })
    @IsNumber()
    @Min(0)
    price: number;

    @ApiPropertyOptional({
        enum: GiftWrappingStatus,
        default: GiftWrappingStatus.ACTIVE,
        example: GiftWrappingStatus.ACTIVE,
        description: 'وضعیت بسته‌بندی',
    })
    @IsEnum(GiftWrappingStatus)
    @IsOptional()
    status?: GiftWrappingStatus;

    @ApiPropertyOptional({
        name: 'image_id',
        example: 1,
        description: 'شناسه تصویر بسته‌بندی',
    })
    @IsInt()
    @IsOptional()
    imageId?: number;

    @ApiPropertyOptional({
        name: 'is_for_gift',
        example: true,
        default: true,
        description: 'آیا این بسته‌بندی برای هدیه است؟',
    })
    @IsBoolean()
    @IsOptional()
    isForGift?: boolean;

    @ApiPropertyOptional({
        name: 'display_order',
        example: 1,
        description: 'ترتیب نمایش در لیست',
        default: 0,
    })
    @IsInt()
    @IsOptional()
    displayOrder?: number;
}
