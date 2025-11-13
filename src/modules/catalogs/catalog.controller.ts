import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ApiPaginationQuery, FilterOperator, PaginateQuery, PaginationType } from 'nestjs-paginate';
import { CatalogService } from './catalog.service';
import { Public } from 'src/common/decorator/public.decorator';
import { CatalogSearchService } from './services/catalog-search.service';
import { CatalogQueryDto } from './dto/catalog-query.dto';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
    constructor(
        private readonly catalogService: CatalogService,
        private readonly searchService: CatalogSearchService,
    ) { }

    @Public()
    @Get('suggest')
    @ApiOperation({ summary: 'پیشنهاد سریع برای autocomplete', description: 'نمایش چند عنوان مرتبط هنگام تایپ در هدر' })
    @ApiQuery({ name: 'term', required: true, example: 'تسبیح' })
    async suggest(@Query('term') term: string) {
        return this.searchService.getSuggestions(term);
    }

    // 🔹 جستجوی کامل
    @Public()
    @Get()
    @ApiOperation({
        summary: 'جستجوی کامل محصولات، برندها و دسته‌ها',
        description:
            'این endpoint نتایج کامل شامل محصولات، برندها و دسته‌های مرتبط با عبارت جستجو را برمی‌گرداند.',
    })
    @ApiQuery({ name: 'term', required: true, example: 'تسبیح شاه مقصود' })
    @ApiQuery({ name: 'limit', required: false, example: 20 })
    async search(
        @Query('term') term: string,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.searchService.search(term, limit);
    }

    @Public()
    @Get(':slug') // مثل /catalog/books
    @ApiOperation({ summary: 'لیست محصولات بر اساس اسلاگ کتگوری با فیلترها' })
    @ApiParam({ name: 'slug', description: 'اسلاگ کتگوری', example: 'mohr-tasbih' })
    async getProductsByCategory(
        @Param('slug') slug: string,
        @Query() query: CatalogQueryDto,
    ) {
        return this.catalogService.getProductsByCategoryWithPaginate(slug, query);
    }

    // 🔹 پیشنهاد سریع (autocomplete)

}
