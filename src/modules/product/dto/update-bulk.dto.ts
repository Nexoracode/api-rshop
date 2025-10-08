import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional } from "class-validator";

export enum PriceUpdateMode {
    SET = "set",        // قیمت را به مقدار جدید تغییر دهد
    INCREASE = "increase", // افزایش قیمت
    DECREASE = "decrease", // کاهش قیمت
}
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

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isVisible?: boolean;

    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    // 🎯 تخفیف درصدی
    @ApiPropertyOptional({ example: 10, description: "درصد تخفیف (مثلاً 10 برای 10٪)" })
    @IsOptional()
    @IsNumber()
    discountPercent?: number;

    // 💵 تخفیف مبلغ ثابت
    @ApiPropertyOptional({ example: 20000, description: "مبلغ تخفیف ثابت (به تومان)" })
    @IsOptional()
    @IsNumber()
    discountAmount?: number;

    // ⚙️ تغییر قیمت
    @ApiPropertyOptional({
        example: "increase",
        enum: PriceUpdateMode,
        description: "نوع تغییر قیمت: set | increase | decrease",
    })
    @IsOptional()
    @IsEnum(PriceUpdateMode)
    priceMode?: PriceUpdateMode;

    @ApiPropertyOptional({ example: 50000, description: "مقدار قیمت جدید یا تغییر قیمت" })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    priceValue?: number;
}
