// catalog.controller.ts
import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiPaginationQuery, FilterOperator, Paginate, PaginateQuery, Paginated, PaginationType } from "nestjs-paginate";
import { CatalogService } from "./catalog.service";
import { Public } from "src/common/decorator/public.decorator";
import { ApiQuery, ApiResponse } from "@nestjs/swagger";

@Controller("catalog")
export class CatalogController {
    constructor(private readonly catalog: CatalogService) { }

    @Public()
    @Get(':category')
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 12 })
    @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'price:ASC' })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'filter[special_offer]', required: false, type: Boolean, example: true })
    @ApiQuery({ name: 'filter[min_price]', required: false, type: Number, example: 1000000 })
    @ApiQuery({ name: 'filter[max_price]', required: false, type: Number, example: 5000000 })
    @ApiQuery({ name: 'filter[brand]', required: false, type: String, example: '3,7' })
    @ApiQuery({ name: 'filter[color]', required: false, type: String, example: '55,56' })
    @ApiResponse({ status: 200, description: 'لیست محصولات و فیلترهای مرتبط' })
    async list(
        @Param("category") categorySlug: string,
        @Paginate() query: PaginateQuery,
    ) {
        return this.catalog.listWithFilters(query, categorySlug);
    }
}
