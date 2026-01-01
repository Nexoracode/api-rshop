import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginateQuery } from 'nestjs-paginate';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CatalogQueryDto implements PaginateQuery {
    @ApiPropertyOptional({
        description:
            'فیلتر ویژگی‌ها به صورت رشته‌ای، مثال: "12:4,5|13:2"',
        example: '12:4,5|13:2',
    })
    @IsOptional()
    @IsString()
    'filter[attributes]'?: string;

    @ApiPropertyOptional({ description: 'لیست محصول بر اساس شناسه برند', example: '1,2,3' })
    @IsOptional()
    @IsString()
    'filter[brand]'?: string;

    @ApiPropertyOptional({ description: 'لیست محصول بر اساس شناسه دسته‌بندی', example: '1,2,3' })
    @IsOptional()
    @IsString()
    'filter[category]'?: string;

    @ApiPropertyOptional({ description: 'لیست محصول بر اساس حداقل قیمت', example: 1 })
    @IsOptional()
    @IsString()
    'filter[price_min]'?: string;

    @ApiPropertyOptional({ description: 'لیست محصول بر اساس حداکثر قیمت', example: 1 })
    @IsOptional()
    @IsString()
    'filter[price_max]'?: string;

    @ApiPropertyOptional({ description: 'فقط محصولات پیشنهاد ویژه', example: 1 })
    @IsOptional()
    @IsString()
    'filter[special_offer]'?: string;

    @ApiPropertyOptional({ description: 'فقط محصولات دارای تخفیف', example: 1 })
    @IsOptional()
    @IsString()
    'filter[discounted]'?: string;

    @ApiPropertyOptional({ description: 'ارسال امروز', example: 1 })
    @IsOptional()
    @IsString()
    'filter[same_day_shipping]'?: string;

    @ApiPropertyOptional({ description: 'فقط محصولات موجود در انبار', example: 1 })
    @IsOptional()
    @IsString()
    'filter[in_stock]'?: string;

    // بقیه فیلدهای استاندارد paginate
    @ApiPropertyOptional({ description: 'شماره صفحه', example: 1 })
    @IsOptional()
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({ description: 'تعداد آیتم در هر صفحه', example: 10 })
    @IsOptional()
    @IsNumber()
    limit?: number;

    @ApiPropertyOptional({ description: 'مرتب‌سازی بر اساس', example: 'createdAt:DESC' })
    @IsOptional()
    @IsString()
    sortBy?: [string, string][];

    path: string;
}