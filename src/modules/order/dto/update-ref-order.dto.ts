import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateRefOrderDto {
    @ApiProperty({ description: 'کدرهگیری جدید' })
    @IsNotEmpty()
    @IsString()
    paymentRef: string;
}