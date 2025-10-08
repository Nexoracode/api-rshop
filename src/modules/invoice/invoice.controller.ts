import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { AccessGuard } from '../../common/guard/access.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { RequestUser } from 'src/common/interfaces/request-user.interface';

@ApiTags('16 - 🔖 Invoices')
@UseGuards(AccessGuard)
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) { }


  @Post('create-from-order/:orderId')
  @ApiOperation({
    summary: "ایجاد فاکتور از سفارش (کاربر)",
    description: "از شناسه سفارش برای ساخت فاکتور استفاده می‌کند.",
  })
  @ApiResponse({
    status: 201,
    description: "فاکتور با موفقیت ایجاد شد.",
    schema: {
      example: {
        id: 15,
        subtotal: 250000,
        discountTotal: 20000,
        couponCode: "WELCOME10",
        couponDiscountAmount: 15000,
        totalPayable: 215000,
        status: "unpaid",
        createdAt: "2025-10-05T10:00:00Z",
      },
    },
  })
  create(@CurrentUser() user: RequestUser, @Param() dto: CreateInvoiceDto) {
    return this.invoiceService.createFromOrder(dto.orderId, user as any);
  }

  @Get()
  @ApiOperation({
    summary: "دریافت لیست فاکتورهای کاربر",
    description: "تمام فاکتورهای مرتبط با کاربر جاری را برمی‌گرداند.",
  })
  @ApiResponse({
    status: 200,
    description: "لیست فاکتورها برگردانده شد.",
  })
  getAll(@CurrentUser() user: RequestUser) {
    return this.invoiceService.getUserInvoices(user as any);
  }

  @Get(":id")
  @ApiOperation({
    summary: "جزئیات یک فاکتور خاص",
    description: "نمایش جزئیات کامل یک فاکتور بر اساس شناسه.",
  })
  @ApiResponse({
    status: 200,
    description: "فاکتور با موفقیت دریافت شد.",
    schema: {
      example: {
        id: 15,
        subtotal: 250000,
        discountTotal: 20000,
        couponCode: "WELCOME10",
        couponDiscountAmount: 15000,
        totalPayable: 215000,
        status: "unpaid",
        createdAt: "2025-10-05T10:00:00Z",
      },
    },
  })
  getOne(@CurrentUser() user: RequestUser, @Param('id', ParseIntPipe) orderId: number) {
    return this.invoiceService.getInvoice(user as any, orderId);
  }
}