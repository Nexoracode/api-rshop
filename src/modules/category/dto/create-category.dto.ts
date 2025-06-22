import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateCategoryDto {

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    slug: string;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    mediaId: number;

    @ApiProperty()
    @IsString()
    @IsOptional()
    discount: string;

    @ApiProperty()
    parentId: number;
}