import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CardService } from './card.service';
import { AccessGuard } from 'src/common/guard/access.guard';
import { CustomRequest } from 'src/common/interfaces/request.interface';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { RemoveItemDto } from './dto/remove-item.dto';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { RequestUser } from 'src/common/interfaces/request-user.interface';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('13 - 🛒 Cards')
@UseGuards(AccessGuard)
@Controller('card')
export class CardController {
  constructor(private readonly cardService: CardService) { }


  @Get('me')
  getMyCard(@CurrentUser() user: RequestUser) {
    return this.cardService.getMyCard(user as any);
  }


  @Post('add')
  addItem(@CurrentUser() user: RequestUser, @Body() dto: AddItemDto) {
    return this.cardService.addItem(user as any, dto);
  }


  @Patch('update')
  updateItem(@CurrentUser() user: RequestUser, @Body() dto: UpdateItemDto) {
    return this.cardService.updateItem(user as any, dto);
  }


  @Patch('remove')
  removeItem(@CurrentUser() user: RequestUser, @Body() dto: RemoveItemDto) {
    return this.cardService.removeItem(user as any, dto);
  }


  @Delete('clear')
  clear(@CurrentUser() user: RequestUser) {
    return this.cardService.clear(user as any);
  }


  @Post('lock')
  lock(@CurrentUser() user: RequestUser) {
    return this.cardService.lock(user as any);
  }
}