import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreInfoEntity } from './entities/store-info.entity';
import { FaqEntity } from './entities/faq.entity';
import { StoreInfoService } from './store-info.service';
import { StoreInfoController } from './store-info.controller';
import { StoreInfoAdminController } from './store-info-admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoreInfoEntity, FaqEntity]),
  ],
  controllers: [StoreInfoController, StoreInfoAdminController],
  providers: [StoreInfoService],
  exports: [StoreInfoService],
})
export class StoreInfoModule {}
