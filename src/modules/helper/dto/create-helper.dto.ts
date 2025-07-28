import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateHelperDto {

    @ApiProperty({ example: 'Helper Name', })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({ example: 'Helper description', })
    @IsNotEmpty()
    @IsString()
    description: string;

    @ApiProperty({ example: 'Helper url image', })
    @IsNotEmpty()
    @IsString()
    image: string;
}