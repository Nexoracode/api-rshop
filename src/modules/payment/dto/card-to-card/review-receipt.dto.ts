import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CardToCardStatus } from '../../enums/payment-status.enum';

export class ReviewReceiptDto {
    @ApiProperty({
        enum: CardToCardStatus,
        example: CardToCardStatus.APPROVED,
        description: 'وضعیت بررسی (approved/rejected)',
    })
    @IsEnum(CardToCardStatus)
    @IsNotEmpty()
    status: CardToCardStatus.APPROVED | CardToCardStatus.REJECTED;

    @ApiPropertyOptional({
        example: 'رسید تایید شد',
        description: 'توضیحات ادمین (در صورت رد، الزامی است)',
    })
    @IsString()
    @IsOptional()
    admin_note?: string;
}
