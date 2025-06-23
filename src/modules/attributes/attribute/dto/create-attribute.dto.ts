import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { AttributeUnit } from "src/common/enums/attribute.enum";

export class CreateAttributeDto {
    @ApiProperty({ required: true })
    @IsNotEmpty()
    name: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    groupId?: number;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    @IsBoolean()
    isPublic: boolean;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    slug?: string;

    @ApiProperty({ enum: AttributeUnit, default: AttributeUnit.TEXT, required: false })
    @IsEnum(AttributeUnit)
    @IsOptional()
    attributeUnit: AttributeUnit;

    @ApiProperty({ required: false, default: null })
    @IsInt()
    @IsOptional()
    displayOrder?: number | null;

    @ApiProperty({ required: false, default: false })
    @IsBoolean()
    @IsOptional()
    isVariant?: boolean | false;
}