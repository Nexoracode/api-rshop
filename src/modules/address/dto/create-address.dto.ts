import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Length } from "class-validator";

export class CreateAddressDto {

    @ApiProperty({ name: 'city', default: 'tehran' })
    @IsNotEmpty()
    @IsString()
    city: string;

    @ApiProperty({ name: 'province', default: 'خراسان رضوی' })
    @IsNotEmpty()
    @IsString()
    province: string;

    @ApiProperty({ name: 'address_line', default: 'آدرس کامل' })
    @IsNotEmpty()
    @IsString()
    addressLine: string;

    @ApiProperty({ name: 'postal_code', default: '9952365214' })
    @IsOptional()
    @IsString()
    @Length(10, 10)
    postalCode: string;

    @ApiProperty({ name: 'is_primary', default: false })
    @IsOptional()
    @IsBoolean()
    isPrimary: boolean | false;
}