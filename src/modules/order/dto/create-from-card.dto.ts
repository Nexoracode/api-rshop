import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';


export class CreateOrderFromCardDto {

    @ApiProperty({ example: "لطفا بسته رو بین ساعات 6-8 ارسال کنین. ممنون", required: false })
    @IsOptional()
    @IsString()
    note?: string;

    @ApiProperty({ example: "WELCOME10", required: false })
    @IsOptional()
    @IsString()
    couponCode?: string;

}