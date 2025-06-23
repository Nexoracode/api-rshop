import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class CreateAttributeValueDto {

    @ApiProperty()
    @IsNotEmpty()
    value: string;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    attributeId: number;

    @ApiProperty({ required: false, default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean | true;
}