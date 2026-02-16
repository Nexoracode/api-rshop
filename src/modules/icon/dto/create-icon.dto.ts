import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateIconDto {
    @ApiProperty({ type: 'string', description: 'نام آیکون' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ type: 'string', description: 'کد آیکون' })
    @IsString()
    @IsNotEmpty()
    svg: string;
}
