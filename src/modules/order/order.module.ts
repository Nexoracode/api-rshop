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
import { CouponService } from '../coupon/coupon.service';
import { CouponModule } from '../coupon/coupon.module';
import { Payment } from '../payment/entities/payment.entity';
import { CheckPromotionUseCase } from '../promotion/application/usecases/check-promotion.usecase';
import { PromotionModule } from '../promotion/promotion.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Card, CardItem, Product, VariantProduct, Payment]), CouponModule, PromotionModule],
  controllers: [OrderController],
  providers: [OrderService, CouponService, CheckPromotionUseCase],
  exports: [OrderService],
})
export class OrderModule { }
