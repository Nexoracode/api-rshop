import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CardService } from './card.service';
import { AccessGuard } from 'src/common/guard/access.guard';
import { CustomRequest } from 'src/common/interfaces/request.interface';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { RemoveItemDto } from './dto/remove-item.dto';

@UseGuards(AccessGuard)
@Controller('card')
export class CardController {
  constructor(private readonly cardService: CardService) { }


  @Get('me')
  getMyCard(@Req() req: CustomRequest) {
    console.log('User:', req.user.sub);
    return this.cardService.getMyCard(req.user.sub as any);
  }


  @Post('add')
  addItem(@Req() req: CustomRequest, @Body() dto: AddItemDto) {
    return this.cardService.addItem(req.user.sub as any, dto);
  }


  @Patch('update')
  updateItem(@Req() req: CustomRequest, @Body() dto: UpdateItemDto) {
    return this.cardService.updateItem(req.user.sub as any, dto);
  }


  @Post('remove')
  removeItem(@Req() req: CustomRequest, @Body() dto: RemoveItemDto) {
    return this.cardService.removeItem(req.user.sub as any, dto);
  }


  @Post('clear')
  clear(@Req() req: CustomRequest) {
    return this.cardService.clear(req.user.sub as any);
  }


  @Post('lock')
  lock(@Req() req: CustomRequest) {
    return this.cardService.lock(req.user.sub as any);
  }
}