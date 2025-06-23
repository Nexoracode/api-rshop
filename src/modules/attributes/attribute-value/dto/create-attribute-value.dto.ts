import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf } from "class-validator";

export class CreateAttributeValueDto {

    @ApiProperty()
    @IsNotEmpty()
    value: string;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    attributeId: number;

    @ApiProperty({ required: false })
    @ValidateIf((o) => o.isColor === true)
    @IsString()
    displayColor?: string;

    @ApiProperty({ required: false, default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean | true;
}