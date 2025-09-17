import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { AccessGuard } from '../../common/guard/access.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('15 - 🔖 Invoices')
@UseGuards(AccessGuard)
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) { }


  @Post()
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoiceService.create(dto);
  }


  @Post(':id/paid')
  paid(@Param('id') id: string) {
    return this.invoiceService.markPaid(id);
  }


  @Get('by-order/:orderId')
  getByOrder(@Param('orderId') orderId: string) {
    return this.invoiceService.getByOrder(orderId);
  }
}