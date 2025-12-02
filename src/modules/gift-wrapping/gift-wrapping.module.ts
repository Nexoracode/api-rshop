import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftWrappingService } from './gift-wrapping.service';
import { GiftWrappingController } from './gift-wrapping.controller';
import { GiftWrappingAdminController } from './gift-wrapping-admin.controller';
import { GiftWrapping } from './entities/gift-wrapping.entity';
import { MediaModule } from '../media/media.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([GiftWrapping]),
        MediaModule, // برای آپلود تصویر
    ],
    controllers: [
        GiftWrappingController,      // Public endpoints
        GiftWrappingAdminController, // Admin endpoints
    ],
    providers: [GiftWrappingService],
    exports: [GiftWrappingService],
})
export class GiftWrappingModule {}
