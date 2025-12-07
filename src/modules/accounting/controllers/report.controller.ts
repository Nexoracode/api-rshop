import {
    Controller,
    Get,
    Query,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportService } from '../services/report.service';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('Accounting - Reports')
@UseGuards(AccessGuard, RoleGuard)
@Controller('accounting/reports')
export class ReportController {
    constructor(private readonly reportService: ReportService) { }

    @Get('transactions')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.ACCOUNTANT, Role.MANAGER)
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
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.ACCOUNTANT, Role.MANAGER)
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
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.ACCOUNTANT, Role.MANAGER)
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
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.WERHOUSE_MANAGER, Role.MANAGER)
    @ApiOperation({ summary: 'گزارش موجودی کالا' })
    async getInventory() {
        return this.reportService.getInventoryReport();
    }

    @Get('stock-movements')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.WERHOUSE_MANAGER, Role.MANAGER)
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
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
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
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.WERHOUSE_MANAGER, Role.MANAGER)
    @ApiOperation({ summary: 'محصولات کم فروش' })
    @ApiQuery({ name: 'daysThreshold', required: false, example: 90 })
    async getSlowMoving(@Query('daysThreshold') daysThreshold = 90) {
        return this.reportService.getSlowMovingProducts(Number(daysThreshold));
    }
}