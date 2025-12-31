import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { AccessGuard } from 'src/common/guard/access.guard';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { RequestUser } from 'src/common/interfaces/request-user.interface';
import { ProfileDetailedResponseDto } from './dto/profile-detailed.dto';
import { OrderStatus } from '../order/enums/order-status.enum';

@ApiTags('👤 Profile')
@ApiBearerAuth()
@UseGuards(AccessGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @Get()
  @ApiOperation({ summary: 'دریافت اطلاعات کلی پروفایل کاربر (Overview)' })
  async getOverview(@CurrentUser() user: RequestUser) {
    return this.profileService.getProfileOverview(user.id);
  }

  @Get('detailed')
  @HttpCode(200)
  @ApiOperation({
    summary: 'دریافت پروفایل کامل و جزئی',
    description: 'شامل اطلاعات کاربر، خلاصه سفارشات، آمار خرید و محصولات پرتکرار'
  })
  @ApiResponse({
    status: 200,
    description: 'پروفایل کامل با موفقیت دریافت شد',
    type: ProfileDetailedResponseDto
  })
  async getDetailedProfile(@CurrentUser() user: RequestUser): Promise<ProfileDetailedResponseDto> {
    return this.profileService.getDetailedProfile(user.id);
  }

  @Get('orders/awaiting-payment')
  @HttpCode(200)
  @ApiOperation({
    summary: 'سفارشات در انتظار پرداخت',
    description: 'لیست سفارشاتی که هنوز پرداخت نشده‌اند'
  })
  async getAwaitingPaymentOrders(@CurrentUser() user: RequestUser) {
    const orders = await this.profileService.getOrdersByStatus(
      user.id,
      [OrderStatus.AWAITING_PAYMENT, OrderStatus.PAYMENT_CONFIRMATION_PENDING, OrderStatus.PENDING_APPROVAL]
    );
    return {
      message: 'سفارشات در انتظار پرداخت با موفقیت دریافت شد.',
      data: orders,
    };
  }

  @Get('orders/completed')
  @HttpCode(200)
  @ApiOperation({
    summary: 'سفارشات تکمیل شده',
    description: 'لیست سفارشاتی که تحویل داده شده‌اند'
  })
  async getCompletedOrders(@CurrentUser() user: RequestUser) {
    const orders = await this.profileService.getOrdersByStatus(
      user.id,
      OrderStatus.DELIVERED
    );
    return {
      message: 'سفارشات تکمیل شده با موفقیت دریافت شد.',
      data: orders,
    };
  }

  @Get('orders/returned')
  @HttpCode(200)
  @ApiOperation({
    summary: 'سفارشات مرجوعی',
    description: 'لیست سفارشاتی که بازگردانده شده یا عودت وجه شده‌اند'
  })
  async getReturnedOrders(@CurrentUser() user: RequestUser) {
    return this.profileService.getOrdersByStatus(
      user.id,
      [OrderStatus.REFUNDED, OrderStatus.NOT_DELIVERED]
    );
  }

  @Get('orders/processing')
  @HttpCode(200)
  @ApiOperation({
    summary: 'سفارشات در حال پردازش',
    description: 'لیست سفارشاتی که در حال آماده‌سازی یا ارسال هستند'
  })
  async getProcessingOrders(@CurrentUser() user: RequestUser) {
    return await this.profileService.getOrdersByStatus(
      user.id,
      [OrderStatus.PROCESSING, OrderStatus.PREPARING, OrderStatus.SHIPPING]
    );
  }

  @Get('orders/cancelled')
  @HttpCode(200)
  @ApiOperation({
    summary: 'سفارشات در حال پردازش',
    description: 'لیست سفارشاتی که در حال آماده‌سازی یا ارسال هستند'
  })
  async getCanclledOrders(@CurrentUser() user: RequestUser) {
    return await this.profileService.getOrdersByStatus(
      user.id,
      [OrderStatus.CANCELLED, OrderStatus.EXPIRED]
    );
  }

  // @Get('frequent-purchases')
  // @HttpCode(200)
  // @ApiOperation({
  //   summary: 'خریدهای پرتکرار شما',
  //   description: 'لیست محصولاتی که بیشترین تعداد خرید را داشته‌اند'
  // })
  // async getFrequentPurchases(@CurrentUser() user: RequestUser) {
  //   const purchases = await this.profileService.getFrequentPurchases(user.id);
  //   return {
  //     message: 'خریدهای پرتکرار با موفقیت دریافت شد.',
  //     data: purchases,
  //   };
  // }

  // @Get('statistics')
  // @HttpCode(200)
  // @ApiOperation({
  //   summary: 'آمار خرید کاربر',
  //   description: 'شامل مجموع خرید، میانگین سفارش، تعداد سفارشات و ...'
  // })
  // async getStatistics(@CurrentUser() user: RequestUser) {
  //   const stats = await this.profileService.getUserStatisticsOnly(user.id);
  //   return {
  //     message: 'آمار خرید با موفقیت دریافت شد.',
  //     data: stats,
  //   };
  // }
}
