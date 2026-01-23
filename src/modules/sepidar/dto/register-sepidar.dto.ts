import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class RegisterSepidarDto {
    @ApiProperty({ name: 'serial', default: '32424' })
    @IsString()
    serial: string;
}
