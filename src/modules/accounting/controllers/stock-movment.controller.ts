import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Request,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StockMovementService } from '../services/stock-movement.service';
import {
    CreateStockMovementDto,
    UpdateStockMovementDto,
    ApproveStockMovementDto,
    RejectStockMovementDto,
    StockAdjustmentDto,
} from '../dto/stock-movement.dto';
import { StockMovementType } from '../enums/warehouse.enum';
import { AccessGuard } from 'src/common/guard/access.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';
import { RoleGuard } from 'src/common/guard/role.guard';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { User } from 'src/modules/user/entities/user.entity';


@ApiTags('Accounting - Stock Movements')
@UseGuards(AccessGuard, RoleGuard)
@Controller('accounting/stock-movements')
export class StockMovementController {
    constructor(private readonly stockMovementService: StockMovementService) { }

    @Post()
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.WERHOUSE_MANAGER, Role.STAFF)
    @ApiOperation({ summary: 'ثبت حرکت انبار' })
    async create(
        @Body() createDto: CreateStockMovementDto,
        @CurrentUser() user: User
    ) {
        return this.stockMovementService.create(createDto, user.id);
    }

    @Post('adjust')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.WERHOUSE_MANAGER)
    @ApiOperation({ summary: 'تنظیم موجودی' })
    async adjustStock(
        @Body() dto: StockAdjustmentDto,
        @CurrentUser() user: User
    ) {
        return this.stockMovementService.adjustStock(dto, user.id);
    }

    @Get()
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.WERHOUSE_MANAGER, Role.STAFF)
    @ApiOperation({ summary: 'لیست حرکت‌های انبار' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'type', required: false, enum: StockMovementType })
    @ApiQuery({ name: 'productId', required: false })
    @ApiQuery({ name: 'warehouseId', required: false })
    async findAll(
        @Query('page') page = 1,
        @Query('limit') limit = 20,
        @Query('type') type?: StockMovementType,
        @Query('productId') productId?: number,
        @Query('warehouseId') warehouseId?: number,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
    ) {
        const filter: any = {
            type,
            productId: productId ? Number(productId) : undefined,
            warehouseId: warehouseId ? Number(warehouseId) : undefined,
            fromDate: fromDate ? new Date(fromDate) : undefined,
            toDate: toDate ? new Date(toDate) : undefined,
        };

        return this.stockMovementService.findAll(filter, Number(page), Number(limit));
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.WERHOUSE_MANAGER, Role.STAFF)
    @ApiOperation({ summary: 'دریافت حرکت انبار' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.stockMovementService.findOne(id);
    }

    @Patch(':id')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.WERHOUSE_MANAGER)
    @ApiOperation({ summary: 'بروزرسانی حرکت' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateStockMovementDto,
        @CurrentUser() user: User
    ) {
        return this.stockMovementService.update(id, updateDto, user.id);
    }

    @Post(':id/approve')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.WERHOUSE_MANAGER)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'تایید حرکت انبار' })
    async approve(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ApproveStockMovementDto,
        @CurrentUser() user: User
    ) {
        return this.stockMovementService.approve(id, dto, user.id);
    }

    @Post(':id/reject')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.WERHOUSE_MANAGER)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'رد حرکت انبار' })
    async reject(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: RejectStockMovementDto,
        @CurrentUser() user: User
    ) {
        return this.stockMovementService.reject(id, dto, user.id);
    }
}