import { ApiProperty } from '@nestjs/swagger';

export class OrderSummaryDto {
    // @ApiProperty({ description: 'تعداد سفارشات در انتظار پرداخت', example: 2 })
    // awaitingPayment: number;

    @ApiProperty({ description: 'تعداد سفارشات در حال پردازش', example: 1 })
    processing: number;

    @ApiProperty({ description: 'تعداد سفارشات ارسال شده', example: 5 })
    shipping: number;

    @ApiProperty({ description: 'تعداد سفارشات تکمیل شده', example: 10 })
    completed: number;

    @ApiProperty({ description: 'تعداد سفارشات مرجوعی', example: 1 })
    returned: number;

    @ApiProperty({ description: 'تعداد سفارشات لغو شده', example: 0 })
    cancelled: number;

    @ApiProperty({ description: 'مجموع سفارشات', example: 19 })
    total: number;
}

export class FrequentPurchaseDto {
    @ApiProperty({ description: 'شناسه محصول', example: 1 })
    productId: number;

    @ApiProperty({ description: 'نام محصول', example: 'گوشی موبایل' })
    productName: string;

    @ApiProperty({ description: 'تصویر محصول' })
    productImage?: string;

    @ApiProperty({ description: 'تعداد خرید', example: 5 })
    purchaseCount: number;

    @ApiProperty({ description: 'آخرین خرید' })
    lastPurchaseDate: Date;

    @ApiProperty({ description: 'قیمت فعلی محصول', example: 15000000 })
    currentPrice: number;

    @ApiProperty({ description: 'موجود بودن محصول', example: true })
    isAvailable: boolean;
}

export class UserStatisticsDto {
    @ApiProperty({ description: 'مجموع مبلغ خرید', example: 50000000 })
    totalSpent: number;

    @ApiProperty({ description: 'میانگین مبلغ سفارش', example: 2500000 })
    averageOrderValue: number;

    @ApiProperty({ description: 'تعداد کل سفارشات', example: 20 })
    totalOrders: number;

    @ApiProperty({ description: 'تاریخ اولین خرید' })
    firstOrderDate?: Date;

    @ApiProperty({ description: 'تاریخ آخرین خرید' })
    lastOrderDate?: Date;
}

export class ProfileDetailedResponseDto {
    @ApiProperty({ description: 'اطلاعات کاربر' })
    // user: {
    //     id: number;
    //     firstName?: string;
    //     lastName?: string;
    //     phone: string;
    //     email?: string;
    //     avatarUrl?: string;
    //     isPhoneVerified: boolean;
    //     createdAt: Date;
    // };

    @ApiProperty({ description: 'خلاصه سفارشات', type: OrderSummaryDto })
    orderSummary: OrderSummaryDto;

    // @ApiProperty({ description: 'آمار کاربر', type: UserStatisticsDto })
    // statistics: UserStatisticsDto;

    // @ApiProperty({ description: 'خریدهای پرتکرار', type: [FrequentPurchaseDto] })
    // frequentPurchases: FrequentPurchaseDto[];

    // @ApiProperty({ description: 'تعداد آدرس‌های ثبت شده', example: 2 })
    // addressCount: number;

    @ApiProperty({ description: 'تعداد نظرات', example: 5 })
    reviewCount: number;

    @ApiProperty({ description: 'تعداد علاقه‌مندی‌ها', example: 10 })
    wishlistCount: number;
}
