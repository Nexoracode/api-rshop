import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, IsHexColor, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BannerPosition } from '../entities/side-banner.entity';

export class CreateSideBannerDto {
  @ApiProperty({ example: 'مصحف همراه (طلاکوب)' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'لورم صنعت چاپ و از طراحان گرافیک است' })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiProperty({ name: 'image_url', example: '/uploads/banners/banner1.jpg' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ example: '/category/religious-books' })
  @IsString()
  @IsOptional()
  link?: string;

  @ApiProperty({ enum: BannerPosition, example: BannerPosition.TOP_RIGHT })
  @IsEnum(BannerPosition)
  position: BannerPosition;

  @ApiPropertyOptional({ name: 'background_color', example: '#FF6B6B' })
  @IsHexColor()
  @IsOptional()
  backgroundColor?: string;

  @ApiPropertyOptional({ name: 'bage_text', example: '14%' })
  @IsString()
  @IsOptional()
  badgeText?: string;

  @ApiPropertyOptional({ name: 'badge_color', example: '#FF0000' })
  @IsHexColor()
  @IsOptional()
  badgeColor?: string;

  @ApiPropertyOptional({ name: 'sort_order', example: 1 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ name: 'is_active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateSideBannerDto {
  @ApiPropertyOptional({ example: 'مصحف همراه (طلاکوب)' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'لورم صنعت چاپ و از طراحان گرافیک است' })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiPropertyOptional({ name: 'image_url', example: '/uploads/banners/banner1.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: '/category/religious-books' })
  @IsString()
  @IsOptional()
  link?: string;

  @ApiPropertyOptional({ enum: BannerPosition, example: BannerPosition.TOP_LEFT })
  @IsEnum(BannerPosition)
  @IsOptional()
  position?: BannerPosition;

  @ApiPropertyOptional({ name: 'background_color', example: '#FF6B6B' })
  @IsHexColor()
  @IsOptional()
  backgroundColor?: string;

  @ApiPropertyOptional({ name: 'badge_text', example: '14%' })
  @IsString()
  @IsOptional()
  badgeText?: string;

  @ApiPropertyOptional({ name: 'badge_color', example: '#FF0000' })
  @IsHexColor()
  @IsOptional()
  badgeColor?: string;

  @ApiPropertyOptional({ name: 'sort_order', example: 1 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ name: 'is_active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
