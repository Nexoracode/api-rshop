import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

// وابستگی‌ها از ماژول‌های دیگر
import { User } from '../user/entities/user.entity';
import { ReviewModule } from '../review/review.module';
import { WishlistModule } from '../wishlist/wishlist.module';
import { RecentViewModule } from '../recent-view/recent-view.module';
import { SupportModule } from '../support/support.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ReviewModule,
    WishlistModule,
    RecentViewModule,
    SupportModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule { }
