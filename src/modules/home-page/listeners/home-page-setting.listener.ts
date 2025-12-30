import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SettingUpdatedEvent } from '../../setting/events/setting-updated.event';
import { HomePageCacheService } from '../cache/home-page-cache.service';
import { SettingCategory } from 'src/modules/setting/enums/setting-category.enum';

/**
 * Listener برای handle کردن تغییرات HomePage Settings
 */
@Injectable()
export class HomePageSettingListener {
    private readonly logger = new Logger(HomePageSettingListener.name);

    constructor(
        private readonly cacheService: HomePageCacheService,
    ) { }

    /**
     * وقتی homepage_layout_type تغییر کرد، cache رو پاک کن
     */
    @OnEvent('setting.updated')
    async handleSettingUpdated(event: SettingUpdatedEvent) {
        // فقط برای homepage_layout_type
        console.log(event);
        if (event.settingKey === SettingCategory.HOMEPAGE) {
            this.logger.log(
                `🔄 Layout type تغییر کرد: ${event.oldValue} → ${event.newValue}`
            );

            // پاک کردن کامل cache صفحه اصلی
            await this.cacheService.clearAllHomePageCache();

            this.logger.log('✅ Cache صفحه اصلی با موفقیت پاک شد');
        }
    }
}
