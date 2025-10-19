import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateCategoryDto {

    @ApiProperty({ description: 'عنوان دسته بندی', example: 'الکترونیک' })
    @IsString()
    @IsNotEmpty({ message: 'عنوان دسته بندی الزامی است' })
    title: string;

    @ApiProperty({ description: 'نامک دسته بندی', example: 'electronic' })
    @IsString()
    @IsNotEmpty({ message: 'نامک دسته بندی الزامی است' })
    slug: string;

    @ApiProperty({ 
        name: 'media_id', 
        example: 0,
        required: false,
        description: 'شناسه تصویر دسته بندی'
    })
    @IsNumber()
    @IsOptional()
    @Min(1, { message: 'شناسه مدیا باید بزرگتر از 0 باشد' })
    mediaId?: number | null;

    @ApiProperty({ 
        required: false,
        description: 'درصد تخفیف',
        example: '10'
    })
    @IsString()
    @IsOptional()
    discount?: string;

    @ApiProperty({ 
        name: 'parent_id', 
        example: 0,
        required: false,
        description: 'شناسه دسته والد (0 برای دسته اصلی)'
    })
    @IsNumber()
    @IsOptional()
    @Min(0, { message: 'شناسه والد باید بزرگتر یا مساوی 0 باشد' })
    parentId?: number;
}
