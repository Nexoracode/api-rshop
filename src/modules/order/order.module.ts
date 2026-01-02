import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Card } from '../card/entities/card.entity';
import { CardItem } from '../card/entities/card-item.entity';
import { Product } from '../product/entities/product.entity';
import { VariantProduct } from '../variant-product/entities/variant-product.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from '../payment/entities/payment.entity';
import { PromotionModule } from '../promotion/promotion.module';
import { GiftWrapping } from '../gift-wrapping/entities/gift-wrapping.entity';
import { CardModule } from '../card/card.module';
import { OrderCacheService } from './cache/order-cache.service';
import { OrderStatusService } from './order.status.service';
import { OtpModule } from '../otps/otps.module';
import { ShortUrlModule } from '../short-url/short-url.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Card,
      CardItem,
      Product,
      VariantProduct,
      Payment,
      GiftWrapping,
    ]),
    PromotionModule,
    CardModule,
    OtpModule,
    ShortUrlModule,
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderCacheService,
    OrderStatusService,
  ],
  exports: [OrderService, OrderStatusService],
})
export class OrderModule { }
