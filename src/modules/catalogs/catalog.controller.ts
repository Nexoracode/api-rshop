import {
    Controller,
    Get,
    Param,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ApiPaginationQuery, FilterOperator, Paginate, PaginateQuery } from 'nestjs-paginate';
import { CatalogService } from './catalog.service';
import { Public } from 'src/common/decorator/public.decorator';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
    constructor(private readonly catalogService: CatalogService) { }

    @Public()
    @Get(':category')
    @ApiResponse({ status: 200, description: 'لیست محصولات و فیلترها' })
    @ApiQuery({
        name: 'filter[attributes]',
        required: false,
        type: String,
        example: '47:55,56|48:60',
        description:
            'فیلتر ویژگی‌ها بر اساس attributeId:valueIds. هر بخش با "|" جدا میشه.',
    })
    @ApiPaginationQuery({
        sortableColumns: ['id', 'name', 'price', 'stock'],
        filterableColumns: {
            price: [FilterOperator.GTE, FilterOperator.LTE],
            discountAmount: [FilterOperator.GT, FilterOperator.EQ],
            discountPercent: [FilterOperator.GT, FilterOperator.EQ],
            brandId: [FilterOperator.IN, FilterOperator.EQ],
            categoryId: [FilterOperator.IN, FilterOperator.EQ],
        }
    })
    async list(
        @Param('category') categorySlug: string,
        @Paginate() query: PaginateQuery,
    ) {
        return this.catalogService.listWithFilters(query, categorySlug);
    }
}
