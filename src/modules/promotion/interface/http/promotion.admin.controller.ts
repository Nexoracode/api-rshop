// promotion/interface/http/promotion.admin.controller.ts

import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { CreatePromotionUseCase } from '../../application/usecases/create-promotion.usecase';
import { UpdatePromotionUseCase } from '../../application/usecases/update-promotion.usecase';
import { DeletePromotionUseCase } from '../../application/usecases/delete-promotion.usecase';
import { ListPromotionsUseCase } from '../../application/usecases/list-promotion.usecase';
import { CreatePromotionDto } from '../../application/dtos/create-promotion.dto';
import { UpdatePromotionDto } from '../../application/dtos/update-promotion.dto';
import { ListPromotionDto } from '../../application/dtos/list-promotion.dto';
import { ApiPaginationQuery, FilterOperator, PaginateQuery } from 'nestjs-paginate';
import { GetPromotionByIdUseCase } from '../../application/usecases/get-promotion-by-id.usecase';
import { PromotionDetailResponseDto } from '../../application/dtos/promotion-response.dto';

@ApiTags('Admin / Promotions')
@Controller('admin/promotions')
export class PromotionAdminController {
    constructor(
        private readonly createUseCase: CreatePromotionUseCase,
        private readonly updateUseCase: UpdatePromotionUseCase,
        private readonly deleteUseCase: DeletePromotionUseCase,
        private readonly listUseCase: ListPromotionsUseCase,
        private readonly getByIdUseCase: GetPromotionByIdUseCase,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create promotion' })
    @ApiBody({ type: CreatePromotionDto })
    create(@Body() dto: CreatePromotionDto) {
        return this.createUseCase.execute(dto);
    }

    @Get()
    @ApiPaginationQuery({
        sortableColumns: ['id', 'startsAt', 'type'],
        searchableColumns: ['code', 'name'],
        filterableColumns: {
            type: [FilterOperator.EQ, FilterOperator.IN],
            isActive: [FilterOperator.EQ],
            startsAt: [FilterOperator.LTE, FilterOperator.GTE],
            endsAt: [FilterOperator.LTE, FilterOperator.GTE],
        },
        defaultSortBy: [['id', 'DESC']],
        maxLimit: 100,
    }) list(@Query() query: PaginateQuery) {
        return this.listUseCase.execute(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get promotion by id (with conditions & actions)' })
    @ApiOkResponse({ type: PromotionDetailResponseDto })
    getById(@Param('id') id: string) {
        return this.getByIdUseCase.execute(+id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update promotion' })
    @ApiBody({ type: UpdatePromotionDto })
    update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
        return this.updateUseCase.execute(+id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete promotion' })
    delete(@Param('id') id: string) {
        return this.deleteUseCase.execute(+id);
    }
}
