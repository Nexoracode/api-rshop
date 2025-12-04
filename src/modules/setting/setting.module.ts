import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingService } from './setting.service';
import { SettingController } from './setting.controller';
import { SettingAdminController } from './setting-admin.controller';
import { Setting } from './entities/setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  controllers: [
    SettingController,
    SettingAdminController,
  ],
  providers: [SettingService],
  exports: [SettingService],
})
export class SettingModule {}
