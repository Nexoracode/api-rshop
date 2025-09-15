import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { AttributeUnit } from "src/common/enums/attribute.enum";

export class CreateAttributeDto {
    @ApiProperty({ required: true })
    @IsNotEmpty()
    name: string;

    @ApiProperty({ name: 'group_id', required: false, default: 0, example: 0 })
    @IsOptional()
    @IsNumber()
    groupId?: number | null;

    @ApiProperty({ name: 'is_public', required: false, default: false })
    @IsOptional()
    @IsBoolean()
    isPublic: boolean | false;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    slug?: string;

    @ApiProperty({ enum: AttributeUnit, default: AttributeUnit.TEXT })
    @IsEnum(AttributeUnit)
    @IsOptional()
    type: AttributeUnit;

    @ApiProperty({ name: 'display_order', required: false, default: null })
    @IsInt()
    @IsOptional()
    displayOrder: number

    @ApiProperty({ name: 'is_variant', required: false, default: false })
    @IsBoolean()
    @IsOptional()
    isVariant?: boolean | false;
}