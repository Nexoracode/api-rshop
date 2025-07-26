import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class CreateAttributeGroupDto {

    @ApiProperty()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsOptional()
    slug: string;

    @ApiProperty({ name: 'display_order', default: null })
    @IsInt()
    @IsOptional()
    displayOrder?: number;
}
