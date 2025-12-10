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

  @ApiProperty({ name: 'section_type', enum: SectionType, example: SectionType.FEATURED })
  @IsEnum(SectionType)
  sectionType: SectionType;

  @ApiProperty({ name: 'display_style', enum: SectionDisplayStyle, example: SectionDisplayStyle.CAROUSEL })
  @IsEnum(SectionDisplayStyle)
  displayStyle: SectionDisplayStyle;

  @ApiPropertyOptional({ name: 'products_ids', example: [1, 2, 3, 4, 5] })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  productIds?: number[];

  @ApiPropertyOptional({ name: 'category_id', example: 5 })
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ name: 'products_limit', example: 10 })
  @IsInt()
  @IsOptional()
  productsLimit?: number;

  @ApiPropertyOptional({ name: 'sort_order', example: 1 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ name: 'is_active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ name: 'show_view_all_button', example: true })
  @IsBoolean()
  @IsOptional()
  showViewAllButton?: boolean;

  @ApiPropertyOptional({ name: 'view_all_link', example: '/products?category=special' })
  @IsString()
  @IsOptional()
  viewAllLink?: string;
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

  @ApiPropertyOptional({ name: 'section_type', enum: SectionType, example: SectionType.FEATURED })
  @IsEnum(SectionType)
  @IsOptional()
  sectionType?: SectionType;

  @ApiPropertyOptional({ name: 'display_style', enum: SectionDisplayStyle, example: SectionDisplayStyle.CAROUSEL })
  @IsEnum(SectionDisplayStyle)
  @IsOptional()
  displayStyle?: SectionDisplayStyle;

  @ApiPropertyOptional({ name: 'product_ids', example: [1, 2, 3, 4, 5] })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  productIds?: number[];

  @ApiPropertyOptional({ name: 'category_id', example: 5 })
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ name: 'products_limit', example: 10 })
  @IsInt()
  @IsOptional()
  productsLimit?: number;

  @ApiPropertyOptional({ name: 'sort_order', example: 1 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ name: 'is_active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ name: 'show_view_all_button', example: true })
  @IsBoolean()
  @IsOptional()
  showViewAllButton?: boolean;

  @ApiPropertyOptional({ name: 'view_all_link', example: '/products?category=special' })
  @IsString()
  @IsOptional()
  viewAllLink?: string;
}
