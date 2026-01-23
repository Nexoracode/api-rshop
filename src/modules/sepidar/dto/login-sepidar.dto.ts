import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class LoginSepidarDto {
    @ApiProperty({ name: 'cypher', default: 'w24234234' })
    @IsString()
    cypher: string;

    @ApiProperty({ name: 'iv', default: 'jalksdfjsad=' })
    @IsString()
    iv: string;
}