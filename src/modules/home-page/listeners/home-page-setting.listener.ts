import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SettingUpdatedEvent } from '../../setting/events/setting-updated.event';
import { HomePageCacheService } from '../cache/home-page-cache.service';

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
     * وقتی homepage_layout_type تغییر کرد، فقط cache layoutType رو پاک کن
     */
    @OnEvent('setting.updated')
    async handleSettingUpdated(event: SettingUpdatedEvent) {
        // فقط برای homepage_layout_type
        if (event.settingKey === 'homepage_layout_type') {
            this.logger.log(
                `🔄 Layout type تغییر کرد: ${event.oldValue} → ${event.newValue}`
            );

            // ✅ فقط cache layoutType پاک میشه، بقیه HomePage cache دست نخورده میمونه!
            await this.cacheService.clearLayoutTypeCache();

            this.logger.log('✅ فقط Cache layout type پاک شد (بقیه HomePage دست نخورده)');
        }
    }

    /**
     * وقتی bulk update برای homepage_layout_type انجام شد، cache layoutType رو پاک کن
     */
    @OnEvent('setting.bulk-updated')
    async handleSettingBulkUpdated(event: { settingKeys: string[] }) {
        if (event.settingKeys.includes('homepage_layout_type')) {
            this.logger.log(
                '🔄 Layout type در bulk update تغییر کرد'
            );

            await this.cacheService.clearLayoutTypeCache();

            this.logger.log('✅ Cache layout type پاک شد (bulk update)');
        }
    }
}
