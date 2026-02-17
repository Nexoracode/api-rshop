import { Controller, Get, Param, Post, Body, UseGuards, ParseIntPipe, Patch, Delete } from '@nestjs/common';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';
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
  // نکته: endpoints با @Roles مشخص شده‌اند — بدون @Roles = کاربر عادی هم دسترسی دارد
  constructor(private readonly orderService: OrderService) { }

  @Get('all')
  @UseGuards(RoleGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.STAFF)
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
  @UseGuards(RoleGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
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
  @UseGuards(RoleGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.STAFF)
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.findOneById(id);
  }

  @Patch(':id/status')
  @UseGuards(RoleGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'تغییر وضعیت سفارش (ادمین)' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) {
    return this.orderService.updateStatus(id, dto.status);
  }

  @Patch(':id/ref')
  @UseGuards(RoleGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  updatePaymentRef(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRefOrderDto) {
    return this.orderService.updatePaymentRef(id, dto);
  }

  @Post(':id/mark-delivered')
  @UseGuards(RoleGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'تحویل سفارش (ادمین)' })
  markAsDelivered(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.markAsDelivered(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'لغو سفارش (کاربر)' })
  cancelOrder(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.cancelOrder(id);
  }

  @Post(':id/awaiting')
  @ApiOperation({ summary: 'در انتظار پردات سفارش (کاربر)' })
  awaitingpaymentOrder(@CurrentUser() user: RequestUser, @Param('id', ParseIntPipe) id: number) {
    return this.orderService.awaitingPayment(user, id);
  }

  @Post(':id/refund')
  @UseGuards(RoleGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'بازپرداخت سفارش (ادمین)' })
  refundOrder(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.refundOrder(id);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'حذف سفارش (ادمین)' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.remove(id);
  }
}
