import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Order } from '../order/entities/order.entity';
import { Payment } from '../payment/entities/payment.entity';
import { Role } from 'src/common/enums/role.enum';
import { OrderStatus } from '../order/enums/order-status.enum';
import { PaymentStatus } from '../payment/enums/payment-status.enum';
import {
  IDashboardStats,
  IMonthlyDataPoint,
  IPersianMonth,
} from './interfaces/dashboard.interface';

/** لیست ماه‌های شمسی به ترتیب */
const PERSIAN_MONTHS: IPersianMonth[] = [
  { id: 0,  month: 'فروردین',  slug: 'farvardin',   monthNumber: 1  },
  { id: 1,  month: 'اردیبهشت', slug: 'ordibehesht', monthNumber: 2  },
  { id: 2,  month: 'خرداد',    slug: 'khordad',     monthNumber: 3  },
  { id: 3,  month: 'تیر',      slug: 'tir',         monthNumber: 4  },
  { id: 4,  month: 'مرداد',    slug: 'mordad',      monthNumber: 5  },
  { id: 5,  month: 'شهریور',   slug: 'shahrivar',   monthNumber: 6  },
  { id: 6,  month: 'مهر',      slug: 'mehr',        monthNumber: 7  },
  { id: 7,  month: 'آبان',     slug: 'aban',        monthNumber: 8  },
  { id: 8,  month: 'آذر',      slug: 'azar',        monthNumber: 9  },
  { id: 9,  month: 'دی',       slug: 'dey',         monthNumber: 10 },
  { id: 10, month: 'بهمن',     slug: 'bahman',      monthNumber: 11 },
  { id: 11, month: 'اسفند',    slug: 'esfand',      monthNumber: 12 },
];

/**
 * تبدیل تاریخ میلادی به ماه شمسی (1-12)
 * از الگوریتم ساده تبدیل استفاده می‌کند
 */
function getPersianMonth(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // مرجع: تبدیل تقریبی ماه میلادی به شمسی
  // فروردین = مارس 21 تا آوریل 20
  const MILADI_TO_JALALI: Array<{ start: [number, number]; jalali: number }> = [
    { start: [3, 21], jalali: 1  }, // فروردین
    { start: [4, 21], jalali: 2  }, // اردیبهشت
    { start: [5, 22], jalali: 3  }, // خرداد
    { start: [6, 22], jalali: 4  }, // تیر
    { start: [7, 23], jalali: 5  }, // مرداد
    { start: [8, 23], jalali: 6  }, // شهریور
    { start: [9, 23], jalali: 7  }, // مهر
    { start: [10, 23], jalali: 8 }, // آبان
    { start: [11, 22], jalali: 9 }, // آذر
    { start: [12, 22], jalali: 10}, // دی
    { start: [1, 21], jalali: 11 }, // بهمن (سال بعد)
    { start: [2, 20], jalali: 12 }, // اسفند
  ];

  // ماه‌های دی و بهمن و اسفند (میلادی: ژانویه، فوریه، مارس قبل از ۲۱)
  if (month === 1 && day >= 21) return 11; // بهمن
  if (month === 2 && day >= 20) return 12; // اسفند
  if (month === 3 && day < 21)  return 12; // اسفند (ادامه)
  if (month === 3 && day >= 21) return 1;  // فروردین
  if (month === 4 && day < 21)  return 1;  // فروردین
  if (month === 4 && day >= 21) return 2;  // اردیبهشت
  if (month === 5 && day < 22)  return 2;  // اردیبهشت
  if (month === 5 && day >= 22) return 3;  // خرداد
  if (month === 6 && day < 22)  return 3;  // خرداد
  if (month === 6 && day >= 22) return 4;  // تیر
  if (month === 7 && day < 23)  return 4;  // تیر
  if (month === 7 && day >= 23) return 5;  // مرداد
  if (month === 8 && day < 23)  return 5;  // مرداد
  if (month === 8 && day >= 23) return 6;  // شهریور
  if (month === 9 && day < 23)  return 6;  // شهریور
  if (month === 9 && day >= 23) return 7;  // مهر
  if (month === 10 && day < 23) return 7;  // مهر
  if (month === 10 && day >= 23) return 8; // آبان
  if (month === 11 && day < 22) return 8;  // آبان
  if (month === 11 && day >= 22) return 9; // آذر
  if (month === 12 && day < 22) return 9;  // آذر
  if (month === 12 && day >= 22) return 10;// دی
  if (month === 1 && day < 21)  return 10; // دی (ادامه)

  return 1;
}

/**
 * ساخت آرایه ۱۲ ماهه با value صفر
 */
function buildEmptyMonths(): Map<number, number> {
  const map = new Map<number, number>();
  for (const m of PERSIAN_MONTHS) {
    map.set(m.monthNumber, 0);
  }
  return map;
}

/**
 * تبدیل Map ماهانه به آرایه خروجی با فرمت استاندارد
 */
function mapToDataPoints(monthMap: Map<number, number>): IMonthlyDataPoint[] {
  return PERSIAN_MONTHS.map((m) => ({
    id: m.id,
    month: m.month,
    slug: m.slug,
    value: monthMap.get(m.monthNumber) ?? 0,
  }));
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  /**
   * دریافت آمار کامل داشبورد برای سال جاری شمسی
   */
  async getDashboardStats(): Promise<IDashboardStats> {
    // بازه سال جاری میلادی معادل سال شمسی جاری
    // سال شمسی جاری ← از فروردین (21 مارس) تا اسفند (20 مارس سال بعد)
    const now = new Date();
    const currentYear = now.getFullYear();

    // شروع سال شمسی جاری (21 مارس امسال یا پارسال بسته به تاریخ)
    const jalaliYearStart = new Date(currentYear, 2, 21); // 21 مارس
    if (now < jalaliYearStart) {
      jalaliYearStart.setFullYear(currentYear - 1);
    }
    const jalaliYearEnd = new Date(jalaliYearStart);
    jalaliYearEnd.setFullYear(jalaliYearStart.getFullYear() + 1);

    const [newCustomers, orders, totalSales] = await Promise.all([
      this.getNewCustomersMonthly(jalaliYearStart, jalaliYearEnd),
      this.getOrdersMonthly(jalaliYearStart, jalaliYearEnd),
      this.getTotalSalesMonthly(jalaliYearStart, jalaliYearEnd),
    ]);

    return {
      visits: this.getVisitsMonthly(),   // از analytics یا mock
      total_sales: totalSales,
      orders: orders,
      new_customers: newCustomers,
    };
  }

  // ─── مشتری‌های جدید ─────────────────────────────────────────────────────

  private async getNewCustomersMonthly(
    from: Date,
    to: Date,
  ): Promise<IMonthlyDataPoint[]> {
    const rows: Array<{ createdAt: Date }> = await this.userRepo
      .createQueryBuilder('user')
      .select('user.created_at', 'createdAt')
      .where('user.role = :role', { role: Role.USER })
      .andWhere('user.created_at >= :from', { from })
      .andWhere('user.created_at < :to', { to })
      .getRawMany();

    const monthMap = buildEmptyMonths();
    for (const row of rows) {
      const jalaliMonth = getPersianMonth(new Date(row.createdAt));
      monthMap.set(jalaliMonth, (monthMap.get(jalaliMonth) ?? 0) + 1);
    }

    return mapToDataPoints(monthMap);
  }

  // ─── سفارش‌ها ────────────────────────────────────────────────────────────

  private async getOrdersMonthly(
    from: Date,
    to: Date,
  ): Promise<IMonthlyDataPoint[]> {
    /** فقط سفارش‌های موفق (پرداخت‌شده و بعد از آن) */
    const successStatuses = [
      OrderStatus.PROCESSING,
      OrderStatus.PREPARING,
      OrderStatus.SHIPPING,
      OrderStatus.DELIVERED,
    ];

    const rows: Array<{ createdAt: Date }> = await this.orderRepo
      .createQueryBuilder('order')
      .select('order.created_at', 'createdAt')
      .where('order.status IN (:...statuses)', { statuses: successStatuses })
      .andWhere('order.created_at >= :from', { from })
      .andWhere('order.created_at < :to', { to })
      .getRawMany();

    const monthMap = buildEmptyMonths();
    for (const row of rows) {
      const jalaliMonth = getPersianMonth(new Date(row.createdAt));
      monthMap.set(jalaliMonth, (monthMap.get(jalaliMonth) ?? 0) + 1);
    }

    return mapToDataPoints(monthMap);
  }

  // ─── فروش کل ─────────────────────────────────────────────────────────────

  private async getTotalSalesMonthly(
    from: Date,
    to: Date,
  ): Promise<IMonthlyDataPoint[]> {
    const rows: Array<{ createdAt: Date; amount: string }> =
      await this.paymentRepo
        .createQueryBuilder('payment')
        .select('payment.created_at', 'createdAt')
        .addSelect('payment.amount', 'amount')
        .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
        .andWhere('payment.created_at >= :from', { from })
        .andWhere('payment.created_at < :to', { to })
        .getRawMany();

    const monthMap = buildEmptyMonths();
    for (const row of rows) {
      const jalaliMonth = getPersianMonth(new Date(row.createdAt));
      const prev = monthMap.get(jalaliMonth) ?? 0;
      monthMap.set(jalaliMonth, prev + Math.round(Number(row.amount)));
    }

    return mapToDataPoints(monthMap);
  }

  // ─── بازدید (mock — تا وقتی analytics واقعی داری) ────────────────────────

  private getVisitsMonthly(): IMonthlyDataPoint[] {
    /**
     * اگه analytics واقعی (مثل Google Analytics یا ابزار خودت) داری،
     * این متد رو به API اون وصل کن.
     * فعلاً داده‌های نمونه برمی‌گردونه تا UI رو تست کنی.
     */
    const mockVisits = [
      1200, 1450, 1800, 2100, 2350, 1950,
      2700, 3100, 3400, 3800, 4200, 4500,
    ];
    return PERSIAN_MONTHS.map((m, i) => ({
      id: m.id,
      month: m.month,
      slug: m.slug,
      value: mockVisits[i],
    }));
  }
}
