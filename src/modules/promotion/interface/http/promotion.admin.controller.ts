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
import { CreatePromotionUseCase } from '../../application/usecases/create-promotion.usecase';
import { UpdatePromotionUseCase } from '../../application/usecases/update-promotion.usecase';
import { DeletePromotionUseCase } from '../../application/usecases/delete-promotion.usecase';
import { CreatePromotionDto } from '../../application/dtos/create-promotion.dto';
import { UpdatePromotionDto } from '../../application/dtos/update-promotion.dto';
import { ListPromotionsUseCase } from '../../application/usecases/list-promotion.usecase';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PromotionType } from '../../domain/enums/promotion-type.enum';
import { ApiPaginationQuery, FilterOperator, Paginate, PaginateQuery, PaginationType } from 'nestjs-paginate';

@ApiTags('Admin Promotions')
@Controller('admin/promotions')
export class PromotionAdminController {
    constructor(
        private readonly createUseCase: CreatePromotionUseCase,
        private readonly updateUseCase: UpdatePromotionUseCase,
        private readonly deleteUseCase: DeletePromotionUseCase,
        private readonly listUseCase: ListPromotionsUseCase,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a new promotion' })
    @ApiBody({ type: CreatePromotionDto })
    @ApiResponse({ status: 201, description: 'Promotion created successfully' })
    create(@Body() dto: CreatePromotionDto) {
        return this.createUseCase.execute(dto);
    }

    @Get()
    @ApiPaginationQuery({
        sortableColumns: ['id', 'startsAt', 'type'],
        searchableColumns: ['code', 'type', 'actions'],
        filterableColumns: {
            type: [FilterOperator.EQ, FilterOperator.IN],
            isActive: [FilterOperator.EQ],
        },
        defaultSortBy: [['id', 'DESC']],
        maxLimit: 100,
    })
    @Get()
    async list(@Paginate() query: PaginateQuery) {
        return this.listUseCase.execute(query);
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
