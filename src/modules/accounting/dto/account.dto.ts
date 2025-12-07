import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';
import { AccountType } from '../enums/transaction.enum';

export class CreateAccountDto {
  @ApiProperty({
    description: 'نام حساب',
    example: 'حساب بانک ملی - شعبه مرکزی',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'کد حساب',
    example: 'ACC-001',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({
    description: 'نوع حساب',
    enum: AccountType,
    example: AccountType.BANK_ACCOUNT,
  })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiPropertyOptional({
    description: 'واحد پول',
    example: 'IRR',
    default: 'IRR',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'موجودی اولیه',
    example: 10000000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  initialBalance?: number;

  @ApiPropertyOptional({
    description: 'توضیحات حساب',
    example: 'حساب اصلی برای دریافت پرداخت‌های آنلاین',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'شماره حساب بانکی',
    example: '1234567890',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  accountNumber?: string;

  @ApiPropertyOptional({
    description: 'نام بانک',
    example: 'بانک ملی ایران',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({
    description: 'شماره شبا',
    example: 'IR123456789012345678901234',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  iban?: string;

  @ApiPropertyOptional({
    description: 'شماره کارت',
    example: '6037-9976-1234-5678',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  cardNumber?: string;

  @ApiPropertyOptional({
    description: 'حساب پیش‌فرض',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'تنظیمات اضافی',
  })
  @IsOptional()
  settings?: Record<string, any>;
}

export class UpdateAccountDto {
  @ApiPropertyOptional({
    description: 'نام حساب',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'نوع حساب',
    enum: AccountType,
  })
  @IsEnum(AccountType)
  @IsOptional()
  type?: AccountType;

  @ApiPropertyOptional({
    description: 'توضیحات',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'شماره حساب',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  accountNumber?: string;

  @ApiPropertyOptional({
    description: 'نام بانک',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({
    description: 'شماره شبا',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  iban?: string;

  @ApiPropertyOptional({
    description: 'شماره کارت',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  cardNumber?: string;

  @ApiPropertyOptional({
    description: 'فعال/غیرفعال',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'حساب پیش‌فرض',
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'تنظیمات اضافی',
  })
  @IsOptional()
  settings?: Record<string, any>;
}
