import { Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SettingService } from './setting.service';
import { SettingCategory } from './enums/setting-category.enum';
import { Public } from 'src/common/decorator/public.decorator';

@ApiTags('Settings (Public)')
@Controller('settings')
export class SettingController {
    constructor(private readonly settingService: SettingService) { }

    @Get('public')
    @Public()
    @ApiOperation({ summary: 'دریافت تنظیمات عمومی (بدون احراز هویت)' })
    async getPublicSettings() {
        return this.settingService.findAll();
    }

    @Get('card-to-card-info')
    @ApiOperation({ summary: 'دریافت اطلاعات کارت فروشگاه (برای پرداخت کارت به کارت)' })
    async getCardToCardInfo() {
        return await this.settingService.getCardToCardSettings();
    }

    @Get('category/:category/public')
    @Public()
    @ApiOperation({ summary: 'دریافت تنظیمات عمومی یک دسته' })
    async getPublicCategory(@Param('category') category: SettingCategory) {
        return await this.settingService.getByCategory(category);
    }

    @Get('footer')
    @Public()
    @ApiOperation({ summary: 'دریافت تنظیمات عمومی یک دسته' })
    async getFooterSetting() {
        return await this.settingService.getFooterSetting();
    }
}
