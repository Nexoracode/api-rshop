import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, IsArray, MaxLength, Validate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SectionType, SectionDisplayStyle } from '../entities/home-section.entity';
import { SectionDataValidator } from '../validators/section-data.validator';

export class CreateHomeSectionDto {
  @ApiProperty({ example: 'محصولات ویژه' })
  @IsString()
  @MaxLength(255)
  title: string;

  @Validate(SectionDataValidator, {
    message: 'داده‌های بخش باید با نوع آن مطابقت داشته باشد'
  })

  @ApiProperty({ example: 'special-products' })
  @IsString()
  @MaxLength(100)
  slug: string;

  @ApiPropertyOptional({ example: 'جدیدترین بندها و رنگ‌ها' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: SectionType, example: SectionType.FEATURED })
  @IsEnum(SectionType)
  section_type: SectionType;

  @ApiProperty({ enum: SectionDisplayStyle, example: SectionDisplayStyle.CAROUSEL })
  @IsEnum(SectionDisplayStyle)
  display_style: SectionDisplayStyle;

  @ApiPropertyOptional({ example: [1, 2, 3, 4, 5] })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  product_ids?: number[];

  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @IsOptional()
  category_id?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsInt()
  @IsOptional()
  products_limit?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  sort_order?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  show_view_all_button?: boolean;

  @ApiPropertyOptional({ example: '/products?category=special' })
  @IsString()
  @IsOptional()
  view_all_link?: string;
}

export class UpdateHomeSectionDto {
  @ApiPropertyOptional({ example: 'محصولات ویژه' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'special-products' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  slug?: string;

  @ApiPropertyOptional({ example: 'جدیدترین بندها و رنگ‌ها' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: SectionType, example: SectionType.FEATURED })
  @IsEnum(SectionType)
  @IsOptional()
  section_type?: SectionType;

  @ApiPropertyOptional({ enum: SectionDisplayStyle, example: SectionDisplayStyle.CAROUSEL })
  @IsEnum(SectionDisplayStyle)
  @IsOptional()
  display_style?: SectionDisplayStyle;

  @ApiPropertyOptional({ example: [1, 2, 3, 4, 5] })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  product_ids?: number[];

  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @IsOptional()
  category_id?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsInt()
  @IsOptional()
  products_limit?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  sort_order?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  show_view_all_button?: boolean;

  @ApiPropertyOptional({ example: '/products?category=special' })
  @IsString()
  @IsOptional()
  view_all_link?: string;
}
