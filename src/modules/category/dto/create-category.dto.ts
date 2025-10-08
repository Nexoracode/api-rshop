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

    @ApiProperty({ name: 'media_id', example: 0 })
    @IsNumber()
    @IsOptional()
    mediaId?: number | null;

    @ApiProperty()
    @IsString()
    @IsOptional()
    discount: string;

    @ApiProperty({ name: 'parent_id', example: 0 })
    @IsNumber()
    @IsOptional()
    parentId?: number;
}