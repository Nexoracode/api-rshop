import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateBrandDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    slug: string;

    @ApiProperty()
    @IsString()
    logo: string;
}
