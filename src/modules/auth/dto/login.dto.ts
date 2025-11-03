import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Validate } from "class-validator";
import { IsEmailOrMobileConstraint } from "./validator";

export class LoginDto {

    @ApiProperty({ description: 'email or phone', default: '09150553208' })
    @IsNotEmpty()
    @Validate(IsEmailOrMobileConstraint)
    identifier: string;

    @ApiProperty()
    @IsNotEmpty()
    password: string;
}