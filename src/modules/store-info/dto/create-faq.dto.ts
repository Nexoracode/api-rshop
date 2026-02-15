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

  @ApiPropertyOptional({ description: 'دسته‌بندی سوال (مثلاً: پرداخت، ارسال، بازگشت)' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ name: 'display_order', description: 'ترتیب نمایش', default: 0 })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({ name: 'is_active', description: 'وضعیت فعال/غیرفعال', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
