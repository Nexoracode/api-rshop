import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreateMessageDto {
    @ApiProperty({ example: 1 })
    @IsInt()
    supportId: number;

    @ApiProperty({ example: 'سلام، لطفاً بررسی کنید.' })
    @IsString()
    content: string;
}
