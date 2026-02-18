import { Role } from "src/common/enums/role.enum";
import { IsArray, IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {

    @ApiProperty({ name: 'first_name', default: 'john' })
    @IsString()
    @IsOptional()
    firstName: string;

    @ApiProperty({ name: 'last_name', default: 'doe' })
    @IsString()
    @IsOptional()
    lastName: string;

    @ApiProperty({ name: 'phone', default: '09150553208' })
    @IsString()
    @Length(11, 11)
    @Matches(/^09\d{9}$/, { message: 'Phone number must be a valid Iranian mobile number' })
    @IsOptional()
    phone: string;

    @ApiProperty({ name: 'is_phone_verified', default: false })
    @IsBoolean()
    @IsOptional()
    isPhoneVerified: boolean;

    @ApiProperty({ name: 'email', nullable: true })
    @IsEmail()
    @IsOptional()
    email: string;

    @ApiProperty({ name: 'password', nullable: true })
    @IsNotEmpty()
    @IsString()
    @Length(6, 100)
    @IsOptional()
    password: string;

    @ApiProperty({ enum: Role, default: Role.USER })
    @IsOptional()
    role: Role;

    @ApiProperty({ name: 'is_active', default: true })
    @IsBoolean()
    @IsOptional()
    isActive: boolean;

    @ApiProperty({ name: 'avatar_url', default: '' })
    @IsString()
    @IsOptional()
    avatarUrl: string;

    @ApiProperty({ name: 'addresses', type: [Number], default: [] })
    @IsArray()
    @IsOptional()
    addresses: number[];
}