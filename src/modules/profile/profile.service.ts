import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { ReviewService } from '../review/review.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { RecentViewService } from '../recent-view/recent-view.service';
import { SupportService } from '../support/support.service';
import { OrderService } from '../order/order.service';
import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order-item.entity';
import { OrderStatus } from '../order/enums/order-status.enum';
import {
  ProfileDetailedResponseDto,
  OrderSummaryDto,
  UserStatisticsDto,
  FrequentPurchaseDto
} from './dto/profile-detailed.dto';
import { OrderMapper, OrderMapperNew } from '../order/mappers/order.mapper';
import { iAllOrderResponse } from '../order/interfaces/order.interface';
import { ProductMapper } from '../product/mappers/product.mapper';
import { Payment } from '../payment/entities/payment.entity';
import { PaymentMethod } from '../payment/enums/payment-status.enum';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly reviewService: ReviewService,
    private readonly wishlistService: WishlistService,
    private readonly recentViewService: RecentViewService,
    private readonly supportService: SupportService,
    private readonly orderService: OrderService,
  ) { }

  /**
   * دریافت اطلاعات کلی پروفایل (overview) - قبلی
   */
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

  /**
   * دریافت پروفایل کامل کاربر با تمام آمار و اطلاعات جزئی
   */
  async getDetailedProfile(userId: number): Promise<ProfileDetailedResponseDto> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['addresses', 'media'],
    });

    if (!user) {
      throw new Error('کاربر یافت نشد');
    }

    const [orderSummary, reviews, wishlist] = await Promise.all([
      this.getOrderSummary(userId),
      // this.getUserStatistics(userId),
      // this.getFrequentPurchases(userId),
      this.reviewService.findAllByUser(userId),
      this.wishlistService.getAll({ id: userId } as any),
    ]);

    return {
      // user: {
      //   id: user.id,
      //   firstName: user.firstName,
      //   lastName: user.lastName,
      //   phone: user.phone,
      //   email: user.email,
      //   avatarUrl: user.avatarUrl,
      //   isPhoneVerified: user.isPhoneVerified,
      //   createdAt: user.createdAt,
      // },
      orderSummary,
      // frequentPurchases,
      // addressCount: user.addresses?.length || 0,
      reviewCount: reviews?.length || 0,
      wishlistCount: wishlist?.length || 0,
    };
  }

  /**
   * خلاصه وضعیت سفارشات کاربر
   * 
   * ✅ اصلاح شده: فقط از Order استفاده می‌کنه
   */
  private async getOrderSummary(userId: number): Promise<OrderSummaryDto> {
    // ✅ فقط یکبار همه Order ها رو بگیر
    const orders = await this.orderRepo.find({
      where: { user: { id: userId } },
      select: ['id', 'status'],
    });

    const summary: OrderSummaryDto = {
      processing: 0,
      shipping: 0,
      completed: 0,
      returned: 0,
      cancelled: 0,
      total: orders.length,
    };

    // ✅ شمارش مستقیم از Order ها
    orders.forEach((order) => {
      switch (order.status) {
        // در حال پردازش/آماده‌سازی
        case OrderStatus.AWAITING_PAYMENT:
        case OrderStatus.PAYMENT_CONFIRMATION_PENDING:
        case OrderStatus.PENDING_APPROVAL:
        case OrderStatus.PROCESSING:
        case OrderStatus.PREPARING:
        case OrderStatus.SHIPPING:
          summary.processing++;
          break;

        // تحویل داده شده
        case OrderStatus.DELIVERED:
          summary.completed++;
          break;

        // مرجوعی/رد شده
        case OrderStatus.REFUNDED:
        case OrderStatus.NOT_DELIVERED:
          summary.returned++;
          break;

        // لغو شده/منقضی/رد شده
        case OrderStatus.PAYMENT_FAILED:
        case OrderStatus.EXPIRED:
        case OrderStatus.REJECTED:
        case OrderStatus.CANCELLED:
          summary.cancelled++;
          break;
      }
    });

    return summary;
  }

  // /**
  //  * آمار کلی خرید کاربر
  //  */
  // private async getUserStatistics(userId: number): Promise<UserStatisticsDto> {
  //   const result = await this.orderRepo
  //     .createQueryBuilder('order')
  //     .select('COUNT(order.id)', 'totalOrders')
  //     .addSelect('COALESCE(SUM(order.total), 0)', 'totalSpent')
  //     .addSelect('COALESCE(AVG(order.total), 0)', 'averageOrderValue')
  //     .addSelect('MIN(order.created_at)', 'firstOrderDate')
  //     .addSelect('MAX(order.created_at)', 'lastOrderDate')
  //     .where('order.user_id = :userId', { userId })
  //     .andWhere('order.status IN (:...statuses)', {
  //       statuses: [
  //         OrderStatus.PROCESSING,
  //         OrderStatus.PREPARING,
  //         OrderStatus.SHIPPING,
  //         OrderStatus.DELIVERED,
  //       ],
  //     })
  //     .getRawOne();

  //   return {
  //     totalOrders: parseInt(result.totalOrders) || 0,
  //     totalSpent: parseFloat(result.totalSpent) || 0,
  //     averageOrderValue: parseFloat(result.averageOrderValue) || 0,
  //     firstOrderDate: result.firstOrderDate || null,
  //     lastOrderDate: result.lastOrderDate || null,
  //   };
  // }

  /**
   * خریدهای پرتکرار کاربر (محصولاتی که بیشتر خریده)
   */
  async getFrequentPurchases(userId: number, limit: number = 10): Promise<FrequentPurchaseDto[]> {
    const result = await this.orderItemRepo
      .createQueryBuilder('item')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('product.price', 'currentPrice')
      .addSelect('product.stock', 'stock')
      .addSelect('product.is_active', 'isActive')
      .addSelect('COUNT(item.id)', 'purchaseCount')
      .addSelect('MAX(order.created_at)', 'lastPurchaseDate')
      .innerJoin('item.order', 'order')
      .innerJoin('item.product', 'product')
      .where('order.user_id = :userId', { userId })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.PROCESSING,
          OrderStatus.PREPARING,
          OrderStatus.SHIPPING,
          OrderStatus.DELIVERED,
        ],
      })
      .groupBy('product.id')
      .addGroupBy('product.name')
      .addGroupBy('product.price')
      .addGroupBy('product.stock')
      .addGroupBy('product.is_active')
      .orderBy('purchaseCount', 'DESC')
      .limit(limit)
      .getRawMany();

    // دریافت تصاویر محصولات به صورت جداگانه
    const productIds = result.map(item => item.productId);

    if (productIds.length === 0) {
      return [];
    }
    return result.map((product) => ProductMapper.toResponse(product, { cartesian: false }))
  }

  /**
   * آمار کاربر به صورت جداگانه
   */
  // async getUserStatisticsOnly(userId: number): Promise<UserStatisticsDto> {
  //   return this.getUserStatistics(userId);
  // }

  /**
   * لیست سفارشات بر اساس وضعیت
   * 
   * ✅ اصلاح شده: مستقیماً از Order می‌گیره تا تکراری نشه
   * هر Order فقط یکبار برمی‌گردونه، حتی اگه چندتا Payment داشته باشه
   */
  async getOrdersByStatus(
    userId: number,
    status: OrderStatus | OrderStatus[],
  ) {
    const statuses = Array.isArray(status) ? status : [status];

    // ✅ مستقیماً از Order بگیر، نه از Payment
    const orders = await this.orderRepo.find({
      where: {
        user: { id: userId },
        status: In(statuses),
      },
      order: { createdAt: 'DESC' },
      relations: [
        'user',
        'items',
        'items.product',
        'items.product.mediaPinned',
        'items.product.medias',
        'items.variant',
        'items.variant.attributes',
        'items.variant.attributes.value',
        'items.variant.attributes.value.attribute',
        'address',
      ],
    });

    const returnedOrder = orders.map(order => OrderMapper.toAllResponse(order));
    return returnedOrder;
  }
}
