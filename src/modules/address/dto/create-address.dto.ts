import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Length } from "class-validator";

export class CreateAddressDto {

    @ApiProperty({ name: 'city', default: 'مشهد' })
    @IsNotEmpty()
    @IsString()
    city: string;

    @ApiProperty({ name: 'province', default: 'خراسان رضوی' })
    @IsNotEmpty()
    @IsString()
    province: string;

    @ApiProperty({ name: 'address_line', default: 'بلوار الهیه، الهیه 22' })
    @IsNotEmpty()
    @IsString()
    addressLine: string;

    @ApiProperty({ name: 'plaque', default: '20' })
    @IsNotEmpty()
    @IsString()
    plaque?: string;

    @ApiProperty({ name: 'unit', default: '32' })
    @IsNotEmpty()
    @IsString()
    unit?: string;

    @ApiProperty({ name: 'address_name', default: null })
    @IsOptional()
    @IsString()
    addressName?: string;

    @ApiProperty({ name: 'recipient_name', default: null })
    @IsOptional()
    @IsString()
    recipientName?: string;

    @ApiProperty({ name: 'recipient_phone', default: null })
    @IsOptional()
    @IsString()
    recipientPhone?: string;

    @ApiProperty({ name: 'postal_code', default: '9952365214' })
    @IsOptional()
    @IsString()
    @Length(10, 10)
    postalCode: string;

    @ApiProperty({ name: 'is_self', default: true })
    @IsOptional()
    @IsBoolean()
    isSelf: boolean;

    @ApiProperty({ name: 'is_primary', default: true })
    @IsOptional()
    @IsBoolean()
    isPrimary: boolean;
}