import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class UploadFilesDto {
    @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
    files: any[]
}

export class CreateMediaDto {
    @IsNotEmpty()
    @IsString()
    url: string;

    @IsIn(['image', 'video'])
    type: 'image' | 'video';

    @IsOptional()
    @IsString()
    altText?: string;

    @IsOptional()
    @IsNumber()
    productId?: number;

    @IsOptional()
    @IsNumber()
    userId?: number;

    @IsOptional()
    @IsNumber()
    categoryId?: number;
}
