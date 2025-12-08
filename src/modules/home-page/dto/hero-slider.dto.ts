import { IsString, IsOptional, IsBoolean, IsInt, IsHexColor, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHeroSliderDto {
  @ApiProperty({ example: 'تسبیح تایگر چشم بین' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'لورم صنعت چاپ و از طراحان گرافیک است' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '/uploads/sliders/slider1.jpg' })
  @IsString()
  image_url: string;

  @ApiPropertyOptional({ example: '#FF6B6B' })
  @IsHexColor()
  @IsOptional()
  background_color?: string;

  @ApiPropertyOptional({ example: 'مشاهده محصول' })
  @IsString()
  @IsOptional()
  button_text?: string;

  @ApiPropertyOptional({ example: '/products/123' })
  @IsString()
  @IsOptional()
  button_link?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  sort_order?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateHeroSliderDto {
  @ApiPropertyOptional({ example: 'تسبیح تایگر چشم بین' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'لورم صنعت چاپ و از طراحان گرافیک است' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '/uploads/sliders/slider1.jpg' })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional({ example: '#FF6B6B' })
  @IsHexColor()
  @IsOptional()
  background_color?: string;

  @ApiPropertyOptional({ example: 'مشاهده محصول' })
  @IsString()
  @IsOptional()
  button_text?: string;

  @ApiPropertyOptional({ example: '/products/123' })
  @IsString()
  @IsOptional()
  button_link?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  sort_order?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
