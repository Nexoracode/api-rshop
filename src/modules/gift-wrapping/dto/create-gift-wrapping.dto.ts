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
    @ApiProperty({ example: 'کاغذ کادو گل رز' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: 'کاغذ کادو با طرح گل رز، مناسب برای مناسبت‌های خاص' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 15000, description: 'قیمت بسته‌بندی به ریال' })
    @IsNumber()
    @Min(0)
    price: number;

    @ApiPropertyOptional({ 
        enum: GiftWrappingStatus, 
        default: GiftWrappingStatus.ACTIVE,
        example: GiftWrappingStatus.ACTIVE 
    })
    @IsEnum(GiftWrappingStatus)
    @IsOptional()
    status?: GiftWrappingStatus;

    @ApiPropertyOptional({ example: 1, description: 'شناسه تصویر' })
    @IsInt()
    @IsOptional()
    imageId?: number;

    @ApiPropertyOptional({ example: true, default: true })
    @IsBoolean()
    @IsOptional()
    isForGift?: boolean;

    @ApiPropertyOptional({ example: 1, description: 'ترتیب نمایش', default: 0 })
    @IsInt()
    @IsOptional()
    displayOrder?: number;
}
