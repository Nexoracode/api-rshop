import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { AccessGuard } from '../../common/guard/access.guard';
import { CreateOrderFromCardDto } from './dto/create-from-card.dto';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { RequestUser } from 'src/common/interfaces/request-user.interface';


@UseGuards(AccessGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }


  @Post('from-card')
  createFromCard(@CurrentUser() user: RequestUser, @Body() dto: CreateOrderFromCardDto) {
    return this.orderService.createFromCard(user as any, dto);
  }


  @Get('me')
  myOrders(@CurrentUser() user: RequestUser) {
    return this.orderService.getMyOrders(user as any);
  }


  @Get(':id')
  getOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.orderService.getOne(user as any, id);
  }
}