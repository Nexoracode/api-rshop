import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { CreateProductSupportDto } from './dto/create-product-support.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { AccessGuard } from 'src/common/guard/access.guard';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { RequestUser } from 'src/common/interfaces/request-user.interface';

@ApiTags('Profile - Support')
@ApiBearerAuth()
@UseGuards(AccessGuard)
@Controller('profile/support')
export class SupportController {
  constructor(private readonly supportService: SupportService) { }

  // 🟢 ایجاد گفتگو عمومی (از بخش پشتیبانی)
  @Post()
  @ApiOperation({ summary: 'ایجاد گفتگو عمومی با پشتیبانی' })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateSupportDto) {
    return this.supportService.create(user, dto);
  }

  // 🟢 ایجاد گفتگو مرتبط با محصول (در صفحه محصول)
  @Post('product')
  @ApiOperation({ summary: 'ایجاد گفتگو در مورد محصول' })
  createForProduct(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateProductSupportDto,
  ) {
    return this.supportService.createForProduct(user, dto);
  }

  // 🟢 لیست گفتگوهای کاربر
  @Get()
  @ApiOperation({ summary: 'دریافت لیست گفتگوهای کاربر' })
  findAll(@CurrentUser() user: RequestUser) {
    return this.supportService.findAllByUser(user);
  }

  // 🟢 مشاهده جزئیات گفتگو
  @Get(':id')
  @ApiOperation({ summary: 'دریافت جزئیات گفتگو' })
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: number) {
    return this.supportService.findOneByUser(user, id);
  }

  // 🟢 ارسال پیام جدید توسط کاربر در گفت‌وگو
  @Post('message')
  @ApiOperation({ summary: 'ارسال پیام جدید در گفت‌وگو موجود' })
  addMessage(@CurrentUser() user: RequestUser, @Body() dto: CreateMessageDto) {
    return this.supportService.addMessageByUser(user, dto);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'بستن گفت‌وگو توسط کاربر' })
  closeSupport(@CurrentUser() user: RequestUser, @Param('id') id: number) {
    return this.supportService.closeSupport(user, id);
  }

}