import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingService } from './setting.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { BulkUpdateSettingsDto } from './dto/bulk-update-settings.dto';
import { AccessGuard } from 'src/common/guard/access.guard';
import { SettingCategory } from './enums/setting-category.enum';

@ApiTags('Admin - Settings')
@ApiBearerAuth()
@UseGuards(AccessGuard)
@Controller('admin/settings')
export class SettingAdminController {
    constructor(private readonly settingService: SettingService) {}

    @Get()
    @ApiOperation({ summary: 'دریافت همه تنظیمات (ادمین)' })
    findAll() {
        return this.settingService.findAll();
    }

    @Get('category/:category')
    @ApiOperation({ summary: 'دریافت تنظیمات یک دسته (ادمین)' })
    findByCategory(@Param('category') category: SettingCategory) {
        return this.settingService.findByCategory(category);
    }

    @Get(':key')
    @ApiOperation({ summary: 'دریافت یک تنظیم (ادمین)' })
    findOne(@Param('key') key: string) {
        return this.settingService.findByKey(key);
    }

    @Post('upsert')
    @ApiOperation({ summary: 'بروزرسانی یا ایجاد تنظیم (ادمین)' })
    upsert(@Body() dto: UpdateSettingDto) {
        return this.settingService.upsert(dto);
    }

    @Post('bulk-upsert')
    @ApiOperation({ summary: 'بروزرسانی گروهی تنظیمات (ادمین)' })
    bulkUpsert(@Body() dto: BulkUpdateSettingsDto) {
        return this.settingService.bulkUpsert(dto.settings);
    }

    @Delete(':key')
    @ApiOperation({ summary: 'حذف تنظیم (ادمین)' })
    remove(@Param('key') key: string) {
        return this.settingService.remove(key);
    }
}
