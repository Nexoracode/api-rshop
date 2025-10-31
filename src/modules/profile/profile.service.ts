import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { ReviewService } from '../review/review.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { RecentViewService } from '../recent-view/recent-view.service';
import { SupportService } from '../support/support.service';
import { OrderService } from '../order/order.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly reviewService: ReviewService,
    private readonly wishlistService: WishlistService,
    private readonly recentViewService: RecentViewService,
    private readonly supportService: SupportService,
    private readonly orderService: OrderService,
  ) { }

  async getProfileOverview(userId: number) {
    const [user, reviews, wishlist, recentViews, supports, orders] = await Promise.all([
      this.userRepo.findOne({ where: { id: userId } }),
      this.reviewService.findAllByUser(userId),
      this.wishlistService.getAll({ id: userId } as any),
      this.recentViewService.getAll({ id: userId } as any),
      this.supportService.findAllByUser({ id: userId } as any),
      this.orderService.findAllByUser(userId) as any,
    ]);

    return {
      user: {
        id: user?.id,
        name: user?.firstName !== null ? `${user?.firstName} ${user?.lastName}` : 'کاربر سایت',
        email: user?.email,
        phone: user?.phone,
      },
      stats: {
        reviews: reviews.length,
        wishlist: wishlist.length,
        recentViews: recentViews.length,
        supports: supports.length,
        orders: orders.length,
      },
      latest: {
        reviews: reviews.slice(0, 3),
        wishlist: wishlist.slice(0, 3),
        recentViews: recentViews.slice(0, 3),
        supports: supports.slice(0, 3),
        orders: orders.slice(0, 3)
      },
    };
  }
}
