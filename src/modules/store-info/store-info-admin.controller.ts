import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreInfoService } from './store-info.service';
import { CreateStoreInfoDto } from './dto/create-store-info.dto';
import { UpdateStoreInfoDto } from './dto/update-store-info.dto';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { CreateFaqCategoryDto, UpdateFaqCategoryDto } from './dto/faq-category.dto';
import { StoreInfoType } from './enums/store-info.enum';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('12 - 🏪 Store Info (Admin)')
@Controller('admin/store-info')
@Roles(Role.ADMIN)
export class StoreInfoAdminController {
  constructor(private readonly storeInfoService: StoreInfoService) { }

  // ─── مدیریت صفحات اطلاعاتی ─────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'دریافت تمام صفحات اطلاعاتی (ادمین)' })
  getAll() {
    return this.storeInfoService.getAllStoreInfo();
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد صفحه اطلاعاتی جدید' })
  create(@Body() dto: CreateStoreInfoDto) {
    return this.storeInfoService.createStoreInfo(dto);
  }

  @Post('upsert')
  @ApiOperation({ summary: 'ایجاد یا به‌روزرسانی صفحه اطلاعاتی (Upsert)' })
  upsert(@Body() dto: CreateStoreInfoDto) {
    return this.storeInfoService.upsertStoreInfo(dto);
  }

  @Patch(':type')
  @ApiOperation({ summary: 'به‌روزرسانی صفحه اطلاعاتی (about_us / purchase_guide / return_policy / faq)' })
  update(
    @Param('type') type: StoreInfoType,
    @Body() dto: UpdateStoreInfoDto,
  ) {
    return this.storeInfoService.updateStoreInfo(type, dto);
  }

  // ─── مدیریت دسته‌بندی‌های FAQ ──────────────────────────────────────────────

  @Get('faq-categories')
  @ApiOperation({ summary: 'لیست تمام دسته‌بندی‌های FAQ (ادمین)' })
  getAllFaqCategories() {
    return this.storeInfoService.getAllFaqCategories(false);
  }

  @Post('faq-categories')
  @ApiOperation({ summary: 'ایجاد دسته‌بندی FAQ جدید' })
  createFaqCategory(@Body() dto: CreateFaqCategoryDto) {
    return this.storeInfoService.createFaqCategory(dto);
  }

  @Patch('faq-categories/:id')
  @ApiOperation({ summary: 'ویرایش دسته‌بندی FAQ' })
  updateFaqCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFaqCategoryDto,
  ) {
    return this.storeInfoService.updateFaqCategory(id, dto);
  }

  @Delete('faq-categories/:id')
  @ApiOperation({ summary: 'حذف دسته‌بندی FAQ' })
  deleteFaqCategory(@Param('id', ParseIntPipe) id: number) {
    return this.storeInfoService.deleteFaqCategory(id);
  }

  // ─── مدیریت سوالات متداول ──────────────────────────────────────────────────

  @Get('faqs')
  @ApiOperation({ summary: 'لیست تمام سوالات متداول (ادمین)' })
  getAllFaqs() {
    return this.storeInfoService.getAllFaqs(false);
  }

  @Post('faqs')
  @ApiOperation({ summary: 'ایجاد سوال متداول جدید' })
  createFaq(@Body() dto: CreateFaqDto) {
    return this.storeInfoService.createFaq(dto);
  }

  @Patch('faqs/:id')
  @ApiOperation({ summary: 'ویرایش سوال متداول' })
  updateFaq(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFaqDto,
  ) {
    return this.storeInfoService.updateFaq(id, dto);
  }

  @Delete('faqs/:id')
  @ApiOperation({ summary: 'حذف یک سوال متداول' })
  deleteFaq(@Param('id', ParseIntPipe) id: number) {
    return this.storeInfoService.deleteFaq(id);
  }

  @Delete('faqs/bulk')
  @ApiOperation({ summary: 'حذف دسته‌جمعی سوالات متداول' })
  bulkDeleteFaqs(@Body() body: { ids: number[] }) {
    return this.storeInfoService.bulkDeleteFaqs(body.ids);
  }
}
