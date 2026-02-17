import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({ description: 'متن سوال' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question: string;

  @ApiProperty({ description: 'متن جواب' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiPropertyOptional({ description: 'شناسه دسته‌بندی FAQ', example: 1 })
  @IsNumber()
  @IsOptional()
  faqCategoryId?: number;

  @ApiPropertyOptional({ description: 'ترتیب نمایش', default: 0 })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'وضعیت فعال/غیرفعال', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
