import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf } from "class-validator";

export class CreateAttributeValueDto {

    @ApiProperty()
    @IsNotEmpty()
    value: string;

    @ApiProperty({ name: 'attribute_id', default: 1 })
    @IsOptional()
    @IsNumber()
    attributeId: number;

    @ApiProperty({ name: 'display_color', required: false })
    @ValidateIf((o) => o.isColor === true)
    @IsString()
    displayColor?: string;

    @IsInt()
    @IsOptional()
    displayOrder: number;

    @ApiProperty({ name: 'is_active', required: false, default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}