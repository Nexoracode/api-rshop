import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsBoolean, IsInt, IsOptional } from "class-validator";

export class UpdateBulkDto {
    @ApiProperty({
        type: [Number],
        example: [1, 2, 3],
        description: 'آیدی محصولات برای حذف',
    })
    @IsArray({ message: 'آیدی محصولات باید به صورت آرایه باشد' })
    @ArrayNotEmpty()
    @IsInt({ each: true, message: 'هر آیدی باید از نوع عدد صحیح باشد' })
    @Type(() => Number)
    ids: number[];

    @ApiProperty({ name: 'is_visible', default: false })
    @IsOptional()
    @IsBoolean()
    isVisible?: boolean;

    @ApiProperty({ name: 'is_featured', default: false })
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @ApiProperty({ name: 'is_same_day_shipping', default: false })
    @IsOptional()
    @IsBoolean()
    isSameDayShipping?: boolean;

    @ApiProperty({ name: 'is_limited_stock', default: false })
    @IsOptional()
    @IsBoolean()
    isLimitedStock?: boolean;
}
