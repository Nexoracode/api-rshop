import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SettingService } from './setting.service';
import { SettingCategory } from './enums/setting-category.enum';

@ApiTags('Settings (Public)')
@Controller('settings')
export class SettingController {
    constructor(private readonly settingService: SettingService) {}

    @Get('public')
    @ApiOperation({ summary: 'دریافت تنظیمات عمومی (بدون احراز هویت)' })
    async getPublicSettings() {
        const allowedKeys = [
            'shop_name',
            'shop_phone',
            'shop_email',
            'shop_address',
            'free_shipping_threshold',
        ];

        const settings = await this.settingService.findAll();
        return settings.filter(s => allowedKeys.includes(s.key));
    }

    @Get('card-to-card-info')
    @ApiOperation({ summary: 'دریافت اطلاعات کارت فروشگاه (برای پرداخت کارت به کارت)' })
    async getCardToCardInfo() {
        return await this.settingService.getCardToCardSettings();
    }

    @Get('category/:category/public')
    @ApiOperation({ summary: 'دریافت تنظیمات عمومی یک دسته' })
    async getPublicCategory(@Param('category') category: string) {
        if (category === SettingCategory.PAYMENT) {
            return await this.settingService.getCardToCardSettings();
        }

        if (category === SettingCategory.GENERAL) {
            const settings = await this.settingService.findByCategory(SettingCategory.GENERAL);
            return settings.filter(s => 
                ['shop_name', 'shop_phone', 'shop_email', 'shop_address'].includes(s.key)
            );
        }

        return [];
    }
}
