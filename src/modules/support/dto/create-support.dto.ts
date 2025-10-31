import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateSupportDto {
    @ApiProperty({ example: 'مشکل در پرداخت' })
    @IsString()
    @Length(3, 255)
    subject: string;

    @ApiProperty({ example: 'سلام، من پرداخت کردم ولی سفارش ثبت نشد.' })
    @IsString()
    content: string;
}
