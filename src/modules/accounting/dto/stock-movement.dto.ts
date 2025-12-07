import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import {
  StockMovementType,
  StockMovementStatus,
  StockInReason,
  StockOutReason,
} from '../enums/warehouse.enum';

export class CreateStockMovementDto {
  @ApiProperty({
    description: 'نوع حرکت انبار',
    enum: StockMovementType,
    example: StockMovementType.IN,
  })
  @IsEnum(StockMovementType)
  type: StockMovementType;

  @ApiProperty({
    description: 'شناسه محصول',
    example: 1,
  })
  @IsInt()
  productId: number;

  @ApiProperty({
    description: 'شناسه انبار',
    example: 1,
  })
  @IsInt()
  warehouseId: number;

  @ApiPropertyOptional({
    description: 'شناسه انبار مقصد (برای انتقالات)',
    example: 2,
  })
  @IsInt()
  @IsOptional()
  destinationWarehouseId?: number;

  @ApiProperty({
    description: 'تعداد',
    example: 10,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: 'قیمت واحد',
    example: 50000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitCost?: number;

  @ApiPropertyOptional({
    description: 'دلیل ورود',
    enum: StockInReason,
  })
  @IsEnum(StockInReason)
  @IsOptional()
  reasonIn?: StockInReason;

  @ApiPropertyOptional({
    description: 'دلیل خروج',
    enum: StockOutReason,
  })
  @IsEnum(StockOutReason)
  @IsOptional()
  reasonOut?: StockOutReason;

  @ApiPropertyOptional({
    description: 'شناسه سفارش مرتبط',
    example: 123,
  })
  @IsInt()
  @IsOptional()
  orderId?: number;

  @ApiPropertyOptional({
    description: 'شماره رسید/فاکتور',
    example: 'INV-2024-001',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({
    description: 'توضیحات',
    example: 'ورود کالا از تامین‌کننده A',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'یادداشت',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'شماره Batch/Lot',
    example: 'BATCH-001',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional({
    description: 'تاریخ انقضا',
    example: '2025-12-31',
  })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({
    description: 'فایل‌های پیوست',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];

  @ApiProperty({
    description: 'تاریخ حرکت',
    example: '2024-12-07T10:30:00Z',
  })
  @IsDateString()
  movementDate: string;

  @ApiPropertyOptional({
    description: 'اطلاعات اضافی',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateStockMovementDto {
  @ApiPropertyOptional({
    description: 'وضعیت حرکت',
    enum: StockMovementStatus,
  })
  @IsEnum(StockMovementStatus)
  @IsOptional()
  status?: StockMovementStatus;

  @ApiPropertyOptional({
    description: 'تعداد',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'قیمت واحد',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitCost?: number;

  @ApiPropertyOptional({
    description: 'توضیحات',
  })
  @IsString()
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
    description: 'اطلاعات اضافی',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ApproveStockMovementDto {
  @ApiPropertyOptional({
    description: 'یادداشت تایید',
    example: 'بررسی و تایید شد',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RejectStockMovementDto {
  @ApiProperty({
    description: 'دلیل رد',
    example: 'تعداد با فاکتور مطابقت ندارد',
  })
  @IsString()
  reason: string;
}

export class StockAdjustmentDto {
  @ApiProperty({
    description: 'شناسه محصول',
    example: 1,
  })
  @IsInt()
  productId: number;

  @ApiProperty({
    description: 'شناسه انبار',
    example: 1,
  })
  @IsInt()
  warehouseId: number;

  @ApiProperty({
    description: 'موجودی جدید',
    example: 50,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  newQuantity: number;

  @ApiProperty({
    description: 'دلیل تنظیم',
    example: 'تطبیق موجودی فیزیکی',
  })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'یادداشت اضافی',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class BulkStockMovementDto {
  @ApiProperty({
    description: 'لیست حرکت‌های انبار',
    type: [CreateStockMovementDto],
  })
  @IsArray()
  movements: CreateStockMovementDto[];
}
