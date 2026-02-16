import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreInfoService } from './store-info.service';
import { StoreInfoType } from './enums/store-info.enum';
import { Public } from 'src/common/decorator/public.decorator';

@ApiTags('12 - 🏪 Store Info (Public)')
@Controller('store-info')
export class StoreInfoController {
  constructor(private readonly storeInfoService: StoreInfoService) { }

  // ─── درباره ما ─────────────────────────────────────────────────────────────
  @Public()
  @Get('about-us')
  @ApiOperation({ summary: 'دریافت صفحه درباره ما' })
  getAboutUs() {
    return this.storeInfoService.getAboutUs();
  }

  // ─── راهنمای خرید ──────────────────────────────────────────────────────────

  @Public()
  @Get('purchase-guide')
  @ApiOperation({ summary: 'دریافت راهنمای خرید' })
  getPurchaseGuide() {
    return this.storeInfoService.getPurchaseGuide();
  }

  // ─── شرایط بازگشت کالا ─────────────────────────────────────────────────────
  @Public()
  @Get('return-policy')
  @ApiOperation({ summary: 'دریافت شرایط بازگشت کالا' })
  getReturnPolicy() {
    return this.storeInfoService.getReturnPolicy();
  }

  // ─── سوالات متداول ─────────────────────────────────────────────────────────

  @Public()
  @Get('faqs')
  @ApiOperation({ summary: 'دریافت تمام سوالات متداول (دسته‌بندی شده)' })
  getFaqsGrouped() {
    return this.storeInfoService.getFaqsGroupedByCategory();
  }

  @Public()
  @Get('faqs/list')
  @ApiOperation({ summary: 'لیست ساده سوالات متداول فعال' })
  getAllActiveFaqs() {
    return this.storeInfoService.getAllFaqs(true);
  }

  @Public()
  @Get('faqs/:id')
  @ApiOperation({ summary: 'دریافت یک سوال متداول با شمارش بازدید' })
  getFaqById(@Param('id', ParseIntPipe) id: number) {
    return this.storeInfoService.getFaqById(id);
  }

  // ─── عمومی ─────────────────────────────────────────────────────────────────

  @Public()
  @Get('all')
  @ApiOperation({ summary: 'دریافت تمام صفحات اطلاعاتی فعال' })
  getAllActive() {
    return this.storeInfoService.getActiveStoreInfo();
  }

  @Public()
  @Get(':type')
  @ApiOperation({ summary: 'دریافت یک صفحه اطلاعاتی بر اساس نوع (about_us / purchase_guide / return_policy / faq)' })
  getByType(@Param('type') type: StoreInfoType) {
    return this.storeInfoService.getStoreInfoByType(type);
  }
}
