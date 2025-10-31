import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateAdminReplyDto {
    @ApiProperty({ example: 'بله موجوده، رنگ قهوه‌ای هم داریم.' })
    @IsString()
    content: string;
}
