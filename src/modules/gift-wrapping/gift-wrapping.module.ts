import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftWrappingService } from './gift-wrapping.service';
import { GiftWrappingController } from './gift-wrapping.controller';
import { GiftWrapping } from './entities/gift-wrapping.entity';

@Module({
    imports: [TypeOrmModule.forFeature([GiftWrapping])],
    controllers: [GiftWrappingController],
    providers: [GiftWrappingService],
    exports: [GiftWrappingService],
})
export class GiftWrappingModule {}
