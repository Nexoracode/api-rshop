import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  Min,
  MaxLength,
  IsInt,
} from 'class-validator';
import {
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  IncomeCategory,
  ExpenseCategory,
} from '../enums/transaction.enum';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'نوع تراکنش',
    enum: TransactionType,
    example: TransactionType.INCOME,
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description: 'مبلغ تراکنش',
    example: 1000000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    description: 'دسته‌بندی تراکنش',
    example: IncomeCategory.PRODUCT_SALE,
  })
  @IsString()
  @IsOptional()
  category?: IncomeCategory | ExpenseCategory;

  @ApiProperty({
    description: 'روش پرداخت',
    enum: PaymentMethod,
    example: PaymentMethod.ONLINE_GATEWAY,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'شناسه حساب',
    example: 1,
  })
  @IsInt()
  accountId: number;

  @ApiPropertyOptional({
    description: 'شناسه حساب مقصد (برای انتقالات)',
    example: 2,
  })
  @IsInt()
  @IsOptional()
  destinationAccountId?: number;

  @ApiPropertyOptional({
    description: 'شناسه سفارش مرتبط',
    example: 123,
  })
  @IsInt()
  @IsOptional()
  orderId?: number;

  @ApiProperty({
    description: 'توضیحات تراکنش',
    example: 'دریافت مبلغ سفارش شماره 123',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({
    description: 'یادداشت‌های اضافی',
    example: 'پرداخت با موفقیت انجام شد',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'شماره رسید/مرجع',
    example: 'REC-2024-001',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  referenceNumber?: string;

  @ApiPropertyOptional({
    description: 'آدرس فایل‌های پیوست',
    example: ['receipts/2024/receipt1.pdf'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];

  @ApiProperty({
    description: 'تاریخ تراکنش',
    example: '2024-12-07T10:30:00Z',
  })
  @IsDateString()
  transactionDate: string;

  @ApiPropertyOptional({
    description: 'اطلاعات اضافی',
    example: { gateway: 'zarinpal', trackingCode: '123456' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateTransactionDto {
  @ApiPropertyOptional({
    description: 'وضعیت تراکنش',
    enum: TransactionStatus,
  })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: 'مبلغ تراکنش',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: 'دسته‌بندی',
  })
  @IsString()
  @IsOptional()
  category?: IncomeCategory | ExpenseCategory;

  @ApiPropertyOptional({
    description: 'روش پرداخت',
    enum: PaymentMethod,
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'توضیحات',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'یادداشت',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'شماره رسید',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({
    description: 'فایل‌های پیوست',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];

  @ApiPropertyOptional({
    description: 'دلیل رد',
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiPropertyOptional({
    description: 'اطلاعات اضافی',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ApproveTransactionDto {
  @ApiPropertyOptional({
    description: 'یادداشت تایید',
    example: 'تایید شد',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RejectTransactionDto {
  @ApiProperty({
    description: 'دلیل رد',
    example: 'اطلاعات رسید نامعتبر است',
  })
  @IsString()
  reason: string;
}
