import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsNumber } from "class-validator";

export class CreateVariantAttributeValueDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsInt()
    variantId: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsInt()
    attributeId: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsInt()
    valueId: number;
}
