import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { CardItem } from './entities/card-item.entity';
import { Product } from '../product/entities/product.entity';
import { VariantProduct } from '../variant-product/entities/variant-product.entity';
import { User } from '../user/entities/user.entity';
import { CardStatusService } from './card-status.service';
import { ScheduleModule } from '@nestjs/schedule';
import { CartCleanupService } from './cart-cleanup.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Card, CardItem, Product, VariantProduct, User]),
    ScheduleModule.forRoot(), // ✅ برای Cron Jobs
  ],
  controllers: [CardController],
  providers: [
    CardService,
    CardStatusService,
    CartCleanupService, // ✅ Cron Service
  ],
  exports: [CardService, CardStatusService],
})
export class CardModule { }
