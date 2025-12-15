import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Length, Matches, ValidateIf } from 'class-validator';

export class UploadReceiptDto {

    @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
    files: any[];

    @ApiPropertyOptional({
        name: 'sender_card_number',
        example: '6037997123456789',
        description: 'شماره کارت مبدا (16 رقم) - اگر اطلاعات دستی وارد می‌شود، الزامی است',
    })
    @ValidateIf((o) => !o.has_receipt_image || o.sender_card_number)
    @IsString()
    @Length(16, 16, { message: 'شماره کارت باید 16 رقم باشد' })
    @Matches(/^[0-9]{16}$/, { message: 'شماره کارت باید فقط شامل اعداد باشد' })
    @IsOptional()
    senderCardNumber?: string;

    @ApiPropertyOptional({
        name: 'tracking_code',
        example: '123456789',
        description: 'شماره پیگیری واریز (از رسید) - اگر اطلاعات دستی وارد می‌شود، الزامی است',
    })
    @ValidateIf((o) => !o.has_receipt_image || o.tracking_code)
    @IsString()
    @IsOptional()
    trackingCode?: string;

    @ApiPropertyOptional({
        name: 'deposit_date',
        example: '2024-12-02T10:30:00Z',
        description: 'تاریخ و زمان واریز',
    })
    @IsDateString()
    @IsOptional()
    depositDate?: string;

    @ApiPropertyOptional({
        name: 'has_receipt_image',
        example: true,
        description: 'آیا تصویر رسید آپلود شده است؟',
    })
    @IsOptional()
    hasReceiptImage?: boolean;
}
