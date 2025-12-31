import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiPropertyOptional } from '@nestjs/swagger';
import { SettingService } from './setting.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { BulkUpdateSettingsDto } from './dto/bulk-update-settings.dto';
import { AccessGuard } from 'src/common/guard/access.guard';
import { SettingCategory } from './enums/setting-category.enum';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorator/role.decorator';

@ApiTags('Admin - Settings')
@UseGuards(AccessGuard, RoleGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@Controller('admin/settings')
export class SettingAdminController {
    constructor(private readonly settingService: SettingService) { }

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
    @ApiPropertyOptional({
        description: 'تنظیمات جدید یا بروزرسانی شده',
        type: UpdateSettingDto,
        required: true,
        enum: SettingCategory,
        default: SettingCategory.GENERAL,
        example: {
            key: 'siteTitle',
            value: 'My Awesome Site',
            category: SettingCategory.GENERAL,
        },
    })
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

    @Patch('homepage-layout/:type')
    @ApiOperation({
        summary: 'ویرایش چیدمان صفحه اصلی', description: `
        این نقطه پایانی برای به‌روزرسانی چیدمان صفحه اصلی استفاده می‌شود. نوع چیدمان باید یکی از مقادیر معتبر باشد.
        side_by_side: چیدمان کنار هم
        stacked: چیدمان روی هم
        ` })
    async updateHomePageLayout(@Param('type') type: string) {
        // منطق به‌روزرسانی چیدمان صفحه اصلی
        return await this.settingService.upsert({
            key: `homepage_layout_type`,
            value: type,
            category: SettingCategory.HOMEPAGE,
        });
    }

}
