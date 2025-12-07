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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TransactionService } from '../services/transaction.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  ApproveTransactionDto,
  RejectTransactionDto,
} from '../dto/transaction.dto';
import {
  TransactionType,
  TransactionStatus,
  PaymentMethod,
} from '../enums/transaction.enum';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';

@ApiTags('Accounting - Transactions')
@ApiBearerAuth()
@UseGuards(AccessGuard, RoleGuard)
@Controller('accounting/transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) { }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'ایجاد تراکنش جدید' })
  @ApiResponse({ status: 201, description: 'تراکنش با موفقیت ایجاد شد' })
  @ApiResponse({ status: 400, description: 'داده‌های ورودی نامعتبر' })
  @ApiResponse({ status: 404, description: 'حساب یافت نشد' })
  async create(
    @Body() createDto: CreateTransactionDto,
    @Request() req,
  ) {
    return this.transactionService.create(createDto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ACCOUNTANT, Role.MANAGER)
  @ApiOperation({ summary: 'دریافت لیست تراکنش‌ها با فیلتر' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType })
  @ApiQuery({ name: 'status', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'paymentMethod', required: false, enum: PaymentMethod })
  @ApiQuery({ name: 'accountId', required: false })
  @ApiQuery({ name: 'fromDate', required: false, example: '2024-01-01' })
  @ApiQuery({ name: 'toDate', required: false, example: '2024-12-31' })
  @ApiResponse({ status: 200, description: 'لیست تراکنش‌ها' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('type') type?: TransactionType,
    @Query('status') status?: TransactionStatus,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
    @Query('accountId') accountId?: number,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const filter: any = {
      type,
      status,
      paymentMethod,
      accountId: accountId ? Number(accountId) : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    };

    return this.transactionService.findAll(filter, Number(page), Number(limit));
  }

  @Get('summary')
  @Roles(Role.ADMIN, Role.ACCOUNTANT, Role.MANAGER)
  @ApiOperation({ summary: 'دریافت خلاصه تراکنش‌ها' })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'accountId', required: false })
  @ApiResponse({ status: 200, description: 'خلاصه تراکنش‌ها' })
  async getSummary(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('accountId') accountId?: number,
  ) {
    const filter: any = {
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      accountId: accountId ? Number(accountId) : undefined,
    };

    return this.transactionService.getSummary(filter);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTANT, Role.MANAGER)
  @ApiOperation({ summary: 'دریافت جزئیات تراکنش' })
  @ApiResponse({ status: 200, description: 'جزئیات تراکنش' })
  @ApiResponse({ status: 404, description: 'تراکنش یافت نشد' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'بروزرسانی تراکنش' })
  @ApiResponse({ status: 200, description: 'تراکنش بروزرسانی شد' })
  @ApiResponse({ status: 404, description: 'تراکنش یافت نشد' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTransactionDto,
    @Request() req,
  ) {
    return this.transactionService.update(id, updateDto, req.user.id);
  }

  @Post(':id/approve')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تایید تراکنش' })
  @ApiResponse({ status: 200, description: 'تراکنش تایید شد' })
  @ApiResponse({ status: 400, description: 'تراکنش قابل تایید نیست' })
  @ApiResponse({ status: 404, description: 'تراکنش یافت نشد' })
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveTransactionDto,
    @Request() req,
  ) {
    return this.transactionService.approve(id, dto, req.user.id);
  }

  @Post(':id/reject')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'رد تراکنش' })
  @ApiResponse({ status: 200, description: 'تراکنش رد شد' })
  @ApiResponse({ status: 400, description: 'تراکنش قابل رد نیست' })
  @ApiResponse({ status: 404, description: 'تراکنش یافت نشد' })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectTransactionDto,
    @Request() req,
  ) {
    return this.transactionService.reject(id, dto, req.user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'حذف (کنسل) تراکنش' })
  @ApiResponse({ status: 200, description: 'تراکنش حذف شد' })
  @ApiResponse({ status: 400, description: 'تراکنش قابل حذف نیست' })
  @ApiResponse({ status: 404, description: 'تراکنش یافت نشد' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.transactionService.remove(id, req.user.id);
  }
}
