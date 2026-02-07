import { Controller, Get, Param, Post, Body, UseGuards, ParseIntPipe, Patch, Delete } from '@nestjs/common';
import { OrderService } from './order.service';
import { AccessGuard } from '../../common/guard/access.guard';
import { CreateOrderFromCardDto } from './dto/create-from-card.dto';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { RequestUser } from 'src/common/interfaces/request-user.interface';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ApiPaginationQuery, FilterOperator, Paginate, PaginateQuery, PaginationType } from 'nestjs-paginate';
import { CreateManualOrderDto } from './dto/create-order.dto';
import { Public } from 'src/common/decorator/public.decorator';
import { UpdateRefOrderDto } from './dto/update-ref-order.dto';

@ApiTags('15 - 📑 Orders')
@UseGuards(AccessGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Get('all')
  @ApiPaginationQuery({
    paginationType: PaginationType.CURSOR,
    sortableColumns: ['id', 'createdAt', 'total'],
    searchableColumns: ['id', 'user.id', 'user.firstName', 'user.lastName', 'items.product.name'],
    filterableColumns: {
      status: [FilterOperator.EQ],
      'user.addresses.city': [FilterOperator.EQ],
      createdAt: [FilterOperator.GTE, FilterOperator.LTE]
    },
  })
  getAll(@Paginate() query: PaginateQuery) {
    return this.orderService.getAllOrders(query);
  }

  @Post("manual")
  @UseGuards(AccessGuard)
  async createManualOrder(@Body() dto: CreateManualOrderDto) {
    return this.orderService.createManualOrder(dto);
  }

  @Post('from-card')
  createFromCard(@CurrentUser() user: RequestUser, @Body() dto: CreateOrderFromCardDto) {
    return this.orderService.createFromCard(user as any, dto);
  }

  @Post('all/me')
  getMeOrder(@CurrentUser() user: RequestUser) {
    return this.orderService.findAllByUser(user.id);
  }

  @Get(':id/me')
  @ApiOperation({ summary: 'دریافت جزئیات سفارش' })
  findOne(@CurrentUser() user: RequestUser, @Param('id', ParseIntPipe) id: number) {
    return this.orderService.findOneByUser(user, id);
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.findOneById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'تغییر وضعیت سفارش (ادمین)' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) {
    return this.orderService.updateStatus(id, dto.status);
  }

  @Patch(':id/ref')
  updatePaymentRef(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRefOrderDto) {
    return this.orderService.updatePaymentRef(id, dto);
  }

  // ✅ تحویل سفارش
  @Post(':id/mark-delivered')
  @ApiOperation({ summary: 'تحویل سفارش (ادمین)' })
  markAsDelivered(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.markAsDelivered(id);
  }

  // ✅ لغو سفارش
  @Public()
  @Post(':id/cancel')
  @ApiOperation({ summary: 'لغو سفارش (ادمین یا کاربر)' })
  cancelOrder(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.cancelOrder(id);
  }

  // ✅ در انتظار پرداخت سفارش
  @Public()
  @Post(':id/awaiting')
  @ApiOperation({ summary: 'در انتظار پرداخت سفارش (ادمین یا کاربر)' })
  awaitingpaymentOrder(@CurrentUser() user: RequestUser, @Param('id', ParseIntPipe) id: number) {
    return this.orderService.awaitingPayment(user, id);
  }

  // ✅ بازپرداخت سفارش
  @Post(':id/refund')
  @ApiOperation({ summary: 'بازپرداخت سفارش (ادمین)' })
  refundOrder(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.refundOrder(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف سفارش (ادمین)' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.remove(id);
  }
}
