import { IsString, IsOptional, IsBoolean, IsInt, IsHexColor, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateHeroSliderDto {
  @ApiProperty({ example: 'تسبیح تایگر چشم بین' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'لورم صنعت چاپ و از طراحان گرافیک است' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ name: 'image_url', example: '/uploads/sliders/slider1.jpg' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ name: 'background_color' })
  @IsHexColor()
  @IsOptional()
  backgroundColor?: string;

  @IsBoolean()
  @ApiProperty({ name: 'is_dark', default: false })
  isDark?: boolean;

  @ApiPropertyOptional({ name: 'button_text', example: 'مشاهده محصول' })
  @IsString()
  @IsOptional()
  buttonText?: string;

  @ApiPropertyOptional({ name: 'button_link', example: '/products/123' })
  @IsString()
  @IsOptional()
  buttonLink?: string;

  @ApiPropertyOptional({ name: 'sort_order', example: 1 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ name: 'is_active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateHeroSliderDto extends PartialType(CreateHeroSliderDto) { }
