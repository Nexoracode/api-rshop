# 🎮 Controller Templates

این فایل شامل Template های کامل برای بقیه Controller هاست.

## 📁 فهرست Controller ها:

1. ✅ **transaction.controller.ts** - کامل شده
2. ⏳ **account.controller.ts** - Template زیر
3. ⏳ **warehouse.controller.ts** - Template زیر
4. ⏳ **stock-movement.controller.ts** - Template زیر
5. ⏳ **report.controller.ts** - Template زیر

---

## 2. Account Controller Template

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountService } from '../services/account.service';
import { CreateAccountDto, UpdateAccountDto } from '../dto/account.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Accounting - Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounting/accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'ایجاد حساب جدید' })
  async create(@Body() createDto: CreateAccountDto, @Request() req) {
    return this.accountService.create(createDto, req.user.id);
  }

  @Get()
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'لیست حساب‌ها' })
  async findAll(@Query('isActive') isActive?: boolean) {
    return this.accountService.findAll(isActive);
  }

  @Get('default')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'دریافت حساب پیش‌فرض' })
  async getDefault() {
    return this.accountService.getDefaultAccount();
  }

  @Get(':id')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'دریافت حساب' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.accountService.findOne(id);
  }

  @Get(':id/balance')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'دریافت موجودی حساب' })
  async getBalance(@Param('id', ParseIntPipe) id: number) {
    return this.accountService.getBalance(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'بروزرسانی حساب' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAccountDto,
  ) {
    return this.accountService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'حذف حساب' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.accountService.remove(id);
  }
}
```

---

## 3. Warehouse Controller Template

```typescript
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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Accounting - Warehouses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounting/warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'ایجاد انبار جدید' })
  async create(@Body() createDto: CreateWarehouseDto) {
    return this.warehouseService.create(createDto);
  }

  @Get()
  @Roles('admin', 'warehouse_manager', 'staff')
  @ApiOperation({ summary: 'لیست انبارها' })
  async findAll(@Query('status') status?: WarehouseStatus) {
    return this.warehouseService.findAll(status);
  }

  @Get('options')
  @Roles('admin', 'warehouse_manager', 'staff')
  @ApiOperation({ summary: 'لیست انبارها برای dropdown' })
  async getOptions() {
    return this.warehouseService.getWarehouseOptions();
  }

  @Get('default')
  @Roles('admin', 'warehouse_manager')
  @ApiOperation({ summary: 'دریافت انبار پیش‌فرض' })
  async getDefault() {
    return this.warehouseService.getDefaultWarehouse();
  }

  @Get(':id')
  @Roles('admin', 'warehouse_manager', 'staff')
  @ApiOperation({ summary: 'دریافت انبار' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.warehouseService.findOne(id);
  }

  @Get(':id/stock-summary')
  @Roles('admin', 'warehouse_manager')
  @ApiOperation({ summary: 'خلاصه موجودی انبار' })
  async getStockSummary(@Param('id', ParseIntPipe) id: number) {
    return this.warehouseService.getStockSummary(id);
  }

  @Get(':id/products')
  @Roles('admin', 'warehouse_manager', 'staff')
  @ApiOperation({ summary: 'موجودی محصولات انبار' })
  async getProductStocks(@Param('id', ParseIntPipe) id: number) {
    return this.warehouseService.getProductStocks(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'بروزرسانی انبار' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateWarehouseDto,
  ) {
    return this.warehouseService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'حذف انبار' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.warehouseService.remove(id);
  }
}
```

---

## 4. Stock Movement Controller Template

```typescript
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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Accounting - Stock Movements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounting/stock-movements')
export class StockMovementController {
  constructor(private readonly stockMovementService: StockMovementService) {}

  @Post()
  @Roles('admin', 'warehouse_manager', 'staff')
  @ApiOperation({ summary: 'ثبت حرکت انبار' })
  async create(
    @Body() createDto: CreateStockMovementDto,
    @Request() req,
  ) {
    return this.stockMovementService.create(createDto, req.user.id);
  }

  @Post('adjust')
  @Roles('admin', 'warehouse_manager')
  @ApiOperation({ summary: 'تنظیم موجودی' })
  async adjustStock(
    @Body() dto: StockAdjustmentDto,
    @Request() req,
  ) {
    return this.stockMovementService.adjustStock(dto, req.user.id);
  }

  @Get()
  @Roles('admin', 'warehouse_manager', 'staff')
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
  @Roles('admin', 'warehouse_manager', 'staff')
  @ApiOperation({ summary: 'دریافت حرکت انبار' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stockMovementService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'warehouse_manager')
  @ApiOperation({ summary: 'بروزرسانی حرکت' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateStockMovementDto,
    @Request() req,
  ) {
    return this.stockMovementService.update(id, updateDto, req.user.id);
  }

  @Post(':id/approve')
  @Roles('admin', 'warehouse_manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تایید حرکت انبار' })
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveStockMovementDto,
    @Request() req,
  ) {
    return this.stockMovementService.approve(id, dto, req.user.id);
  }

  @Post(':id/reject')
  @Roles('admin', 'warehouse_manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'رد حرکت انبار' })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectStockMovementDto,
    @Request() req,
  ) {
    return this.stockMovementService.reject(id, dto, req.user.id);
  }
}
```

---

## 5. Report Controller Template

```typescript
import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportService } from '../services/report.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Accounting - Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounting/reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('transactions')
  @Roles('admin', 'accountant', 'manager')
  @ApiOperation({ summary: 'گزارش کامل تراکنش‌ها' })
  @ApiQuery({ name: 'fromDate', required: true })
  @ApiQuery({ name: 'toDate', required: true })
  async getTransactionReport(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.reportService.getTransactionReport(
      new Date(fromDate),
      new Date(toDate),
    );
  }

  @Get('profit-loss')
  @Roles('admin', 'accountant', 'manager')
  @ApiOperation({ summary: 'گزارش سود و زیان' })
  @ApiQuery({ name: 'fromDate', required: true })
  @ApiQuery({ name: 'toDate', required: true })
  async getProfitLoss(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.reportService.getProfitLossReport(
      new Date(fromDate),
      new Date(toDate),
    );
  }

  @Get('cash-flow')
  @Roles('admin', 'accountant', 'manager')
  @ApiOperation({ summary: 'گزارش جریان نقدی' })
  @ApiQuery({ name: 'fromDate', required: true })
  @ApiQuery({ name: 'toDate', required: true })
  async getCashFlow(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.reportService.getCashFlowReport(
      new Date(fromDate),
      new Date(toDate),
    );
  }

  @Get('inventory')
  @Roles('admin', 'warehouse_manager', 'manager')
  @ApiOperation({ summary: 'گزارش موجودی کالا' })
  async getInventory() {
    return this.reportService.getInventoryReport();
  }

  @Get('stock-movements')
  @Roles('admin', 'warehouse_manager', 'manager')
  @ApiOperation({ summary: 'گزارش حرکت‌های انبار' })
  @ApiQuery({ name: 'fromDate', required: true })
  @ApiQuery({ name: 'toDate', required: true })
  async getStockMovements(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.reportService.getStockMovementReport(
      new Date(fromDate),
      new Date(toDate),
    );
  }

  @Get('top-selling')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'محصولات پرفروش' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  async getTopSelling(
    @Query('limit') limit = 10,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.reportService.getTopSellingProducts(
      Number(limit),
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
  }

  @Get('slow-moving')
  @Roles('admin', 'warehouse_manager', 'manager')
  @ApiOperation({ summary: 'محصولات کم فروش' })
  @ApiQuery({ name: 'daysThreshold', required: false, example: 90 })
  async getSlowMoving(@Query('daysThreshold') daysThreshold = 90) {
    return this.reportService.getSlowMovingProducts(Number(daysThreshold));
  }
}
```

---

## 📝 نکات مهم:

1. همه Controller ها از **Guards** استفاده می‌کنند
2. دسترسی‌ها با **@Roles** مشخص شده
3. همه API ها **Swagger Documentation** دارند
4. استفاده از **ParseIntPipe** برای Validation
5. **@Request()** برای دسترسی به کاربر لاگین شده

---

**این Template ها آماده برای Copy/Paste هستند!** ✨
