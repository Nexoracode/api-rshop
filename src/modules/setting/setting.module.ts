import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingService } from './setting.service';
import { SettingController } from './setting.controller';
import { SettingAdminController } from './setting-admin.controller';
import { Setting } from './entities/setting.entity';
import { HomePageCacheService } from '../home-page/cache';

@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  controllers: [
    SettingController,
    SettingAdminController,
  ],
  providers: [SettingService, HomePageCacheService],
  exports: [SettingService],
})
export class SettingModule { }
