import { Controller, Get, Param, Post, Body, UseGuards, ParseIntPipe, Patch, Delete } from '@nestjs/common';
import { OrderService } from './order.service';
import { AccessGuard } from '../../common/guard/access.guard';
import { CreateOrderFromCardDto } from './dto/create-from-card.dto';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { RequestUser } from 'src/common/interfaces/request-user.interface';
import { ApiTags } from '@nestjs/swagger';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ApiPaginationQuery, FilterOperator, Paginate, PaginateQuery, PaginationType } from 'nestjs-paginate';
import { CreateManualOrderDto } from './dto/create-order.dto';

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


  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.getOrderById(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) {
    return this.orderService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.remove(id);
  }
}