import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { StoreInfoType } from '../enums/store-info.enum';

export class CreateStoreInfoDto {
  @ApiProperty({ enum: StoreInfoType, description: 'نوع صفحه اطلاعاتی' })
  @IsEnum(StoreInfoType)
  @IsNotEmpty()
  type: StoreInfoType;

  @ApiProperty({ description: 'عنوان صفحه' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'محتوای HTML صفحه' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ name: 'meta_title', description: 'عنوان متا برای SEO' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  metaTitle?: string;

  @ApiPropertyOptional({ name: 'meta_description', description: 'توضیحات متا برای SEO' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  metaDescription?: string;

  @ApiPropertyOptional({ name: 'is_active', default: true })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ name: 'display_order', description: 'ترتیب نمایش', default: 0 })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;
}
