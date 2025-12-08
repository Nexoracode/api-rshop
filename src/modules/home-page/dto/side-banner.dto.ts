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

  @ApiProperty({ example: '/uploads/banners/banner1.jpg' })
  @IsString()
  image_url: string;

  @ApiPropertyOptional({ example: '/category/religious-books' })
  @IsString()
  @IsOptional()
  link?: string;

  @ApiProperty({ enum: BannerPosition, example: BannerPosition.TOP_RIGHT })
  @IsEnum(BannerPosition)
  position: BannerPosition;

  @ApiPropertyOptional({ example: '14%' })
  @IsString()
  @IsOptional()
  badge_text?: string;

  @ApiPropertyOptional({ example: '#FF0000' })
  @IsHexColor()
  @IsOptional()
  badge_color?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  sort_order?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
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

  @ApiPropertyOptional({ example: '/uploads/banners/banner1.jpg' })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional({ example: '/category/religious-books' })
  @IsString()
  @IsOptional()
  link?: string;

  @ApiPropertyOptional({ enum: BannerPosition, example: BannerPosition.TOP_RIGHT })
  @IsEnum(BannerPosition)
  @IsOptional()
  position?: BannerPosition;

  @ApiPropertyOptional({ example: '14%' })
  @IsString()
  @IsOptional()
  badge_text?: string;

  @ApiPropertyOptional({ example: '#FF0000' })
  @IsHexColor()
  @IsOptional()
  badge_color?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  sort_order?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
