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

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Card, CardItem, Product, VariantProduct, Payment]), CouponModule],
  controllers: [OrderController],
  providers: [OrderService, CouponService],
  exports: [OrderService],
})
export class OrderModule { }
