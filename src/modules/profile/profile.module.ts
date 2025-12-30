import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

// وابستگی‌ها از ماژول‌های دیگر
import { User } from '../user/entities/user.entity';
import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order-item.entity';
import { ReviewModule } from '../review/review.module';
import { WishlistModule } from '../wishlist/wishlist.module';
import { RecentViewModule } from '../recent-view/recent-view.module';
import { SupportModule } from '../support/support.module';
import { OrderModule } from '../order/order.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([User, Order, OrderItem]),
    ReviewModule,
    WishlistModule,
    RecentViewModule,
    SupportModule,
    OrderModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule { }
