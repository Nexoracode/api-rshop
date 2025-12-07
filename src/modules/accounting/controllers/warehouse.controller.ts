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
    ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WarehouseService } from '../services/warehouse.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from '../dto/warehouse.dto';
import { WarehouseStatus } from '../enums/warehouse.enum';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('Accounting - Warehouses')
@UseGuards(AccessGuard, RoleGuard)
@Controller('accounting/warehouses')
export class WarehouseController {
    constructor(private readonly warehouseService: WarehouseService) { }

    @Post()
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'ایجاد انبار جدید' })
    async create(@Body() createDto: CreateWarehouseDto) {
        return this.warehouseService.create(createDto);
    }

    @Get()
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.WERHOUSE_MANAGER, Role.STAFF)
    @ApiOperation({ summary: 'لیست انبارها' })
    async findAll(@Query('status') status?: WarehouseStatus) {
        return this.warehouseService.findAll(status);
    }

    @Get('options')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.WERHOUSE_MANAGER, Role.STAFF)
    @ApiOperation({ summary: 'لیست انبارها برای dropdown' })
    async getOptions() {
        return this.warehouseService.getWarehouseOptions();
    }

    @Get('default')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.WERHOUSE_MANAGER)
    @ApiOperation({ summary: 'دریافت انبار پیش‌فرض' })
    async getDefault() {
        return this.warehouseService.getDefaultWarehouse();
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.WERHOUSE_MANAGER, Role.STAFF)
    @ApiOperation({ summary: 'دریافت انبار' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.warehouseService.findOne(id);
    }

    @Get(':id/stock-summary')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.WERHOUSE_MANAGER)
    @ApiOperation({ summary: 'خلاصه موجودی انبار' })
    async getStockSummary(@Param('id', ParseIntPipe) id: number) {
        return this.warehouseService.getStockSummary(id);
    }

    @Get(':id/products')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.WERHOUSE_MANAGER, Role.STAFF)
    @ApiOperation({ summary: 'موجودی محصولات انبار' })
    async getProductStocks(@Param('id', ParseIntPipe) id: number) {
        return this.warehouseService.getProductStocks(id);
    }

    @Patch(':id')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'بروزرسانی انبار' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateWarehouseDto,
    ) {
        return this.warehouseService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'حذف انبار' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.warehouseService.remove(id);
    }
}