import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateFaqCategoryDto {
  @ApiProperty({ description: 'نام دسته‌بندی', example: 'پرداخت' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'شناسه آیکون', example: 1 })
  @IsNumber()
  @IsOptional()
  iconId?: number;

  @ApiPropertyOptional({ description: 'ترتیب نمایش', default: 0 })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'وضعیت فعال/غیرفعال', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateFaqCategoryDto extends PartialType(CreateFaqCategoryDto) {}
