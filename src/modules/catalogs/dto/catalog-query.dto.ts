import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginateQuery } from 'nestjs-paginate';
import { IsOptional, IsString } from 'class-validator';

export class CatalogQueryDto implements PaginateQuery {
    @ApiPropertyOptional({
        description:
            'فیلتر ویژگی‌ها به صورت رشته‌ای، مثال: "12:4,5|13:2"',
        example: '12:4,5|13:2',
    })
    @IsOptional()
    @IsString()
    'filter[attributes]'?: string;

    // بقیه فیلدهای استاندارد paginate
    @ApiPropertyOptional({ description: 'شماره صفحه', example: 1 })
    page?: number;

    @ApiPropertyOptional({ description: 'تعداد آیتم در هر صفحه', example: 10 })
    limit?: number;

    @ApiPropertyOptional({ description: 'مرتب‌سازی بر اساس', example: 'createdAt:DESC' })
    sortBy?: [string, string][]

    @ApiPropertyOptional({ description: 'path url', example: '' })
    path: string;
}