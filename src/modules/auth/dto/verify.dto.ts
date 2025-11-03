import { IsNotEmpty, IsPhoneNumber, Validate } from "class-validator";
import { IsEmailOrMobileConstraint } from "./validator";
import { ApiProperty } from "@nestjs/swagger";

export class VerifyOtpDto {

    @ApiProperty({ description: 'email or phone', default: '09150553208' })
    @IsNotEmpty()
    @Validate(IsEmailOrMobileConstraint)
    identifier: string;

    @ApiProperty({ default: '123456' })
    @IsNotEmpty()
    code: string;
}