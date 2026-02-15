export interface IMonthlyDataPoint {
  id: number;
  month: string;
  slug: string;
  value: number;
}

export interface IDashboardStats {
  /** بازدید ماهانه */
  visits: IMonthlyDataPoint[];

  /** فروش کل ماهانه (تومان) */
  total_sales: IMonthlyDataPoint[];

  /** تعداد سفارش‌های ماهانه */
  orders: IMonthlyDataPoint[];

  /** مشتری‌های جدید ماهانه */
  new_customers: IMonthlyDataPoint[];
}

/** اطلاعات ثابت ماه‌های شمسی */
export interface IPersianMonth {
  id: number;
  month: string;
  slug: string;
  /** عدد ماه شمسی (۱-۱۲) */
  monthNumber: number;
}
