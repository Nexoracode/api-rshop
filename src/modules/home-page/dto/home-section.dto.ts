import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, IsArray, MaxLength, Validate, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { SectionType, SectionDisplayStyle } from '../entities/home-section.entity';
import { SectionDataValidator } from '../validators/section-data.validator';

export class CreateHomeSectionDto {
  @ApiProperty({ example: 'محصولات ویژه' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: 'آدرس تصویر مجموعه',
    example: '/uploads/collections/fathers-day.jpg',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  image?: string;

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

  @ApiPropertyOptional({ name: 'promotion_id', example: 3, description: 'برای بخش‌های promotion_based' })
  @IsInt()
  @IsOptional()
  promotionId?: number;

  @ApiPropertyOptional({ name: 'products_limit', example: 10 })
  @IsInt()
  @IsOptional()
  productsLimit?: number;

  @ApiPropertyOptional({ name: 'is_active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ name: 'show_view_all_button', example: true })
  @IsBoolean()
  @IsOptional()
  showViewAllButton?: boolean;

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

  @ApiPropertyOptional({ name: 'view_all_link', example: '/products?category=special' })
  @IsString()
  @IsOptional()
  viewAllLink?: string;
}

export class UpdateHomeSectionDto extends PartialType(CreateHomeSectionDto) { }