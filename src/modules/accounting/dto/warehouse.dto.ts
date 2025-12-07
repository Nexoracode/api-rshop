import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  MaxLength,
  Min,
} from 'class-validator';
import { WarehouseType, WarehouseStatus } from '../enums/warehouse.enum';

export class CreateWarehouseDto {
  @ApiProperty({
    description: 'نام انبار',
    example: 'انبار مرکزی تهران',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'کد انبار',
    example: 'WH-001',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({
    description: 'نوع انبار',
    enum: WarehouseType,
    default: WarehouseType.MAIN,
  })
  @IsEnum(WarehouseType)
  @IsOptional()
  type?: WarehouseType;

  @ApiPropertyOptional({
    description: 'توضیحات انبار',
    example: 'انبار اصلی محصولات الکترونیک',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'آدرس فیزیکی',
    example: 'تهران، خیابان آزادی، پلاک 123',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'شهر',
    example: 'تهران',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'استان',
    example: 'تهران',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  province?: string;

  @ApiPropertyOptional({
    description: 'کد پستی',
    example: '1234567890',
    maxLength: 20,
  })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'شماره تماس',
    example: '021-12345678',
    maxLength: 20,
  })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'نام مدیر انبار',
    example: 'علی احمدی',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  managerName?: string;

  @ApiPropertyOptional({
    description: 'ظرفیت انبار',
    example: 1000,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({
    description: 'عرض جغرافیایی',
    example: 35.6892,
  })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'طول جغرافیایی',
    example: 51.3890,
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'انبار پیش‌فرض',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'اولویت نمایش',
    example: 1,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({
    description: 'تنظیمات اضافی',
  })
  @IsOptional()
  settings?: Record<string, any>;
}

export class UpdateWarehouseDto {
  @ApiPropertyOptional({
    description: 'نام انبار',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'نوع انبار',
    enum: WarehouseType,
  })
  @IsEnum(WarehouseType)
  @IsOptional()
  type?: WarehouseType;

  @ApiPropertyOptional({
    description: 'وضعیت انبار',
    enum: WarehouseStatus,
  })
  @IsEnum(WarehouseStatus)
  @IsOptional()
  status?: WarehouseStatus;

  @ApiPropertyOptional({
    description: 'توضیحات',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'آدرس',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'شهر',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'استان',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  province?: string;

  @ApiPropertyOptional({
    description: 'کد پستی',
    maxLength: 20,
  })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'شماره تماس',
    maxLength: 20,
  })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'نام مدیر',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  managerName?: string;

  @ApiPropertyOptional({
    description: 'ظرفیت',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({
    description: 'عرض جغرافیایی',
  })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'طول جغرافیایی',
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'انبار پیش‌فرض',
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'اولویت',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({
    description: 'تنظیمات اضافی',
  })
  @IsOptional()
  settings?: Record<string, any>;
}
