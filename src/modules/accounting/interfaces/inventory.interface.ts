import {
  StockMovementType,
  StockAlertLevel,
  WarehouseStatus,
} from '../enums/warehouse.enum';

/**
 * اطلاعات موجودی محصول
 */
export interface IProductStock {
  /** شناسه محصول */
  productId: number;
  
  /** نام محصول */
  productName: string;
  
  /** SKU */
  sku: string;
  
  /** موجودی فعلی */
  currentStock: number;
  
  /** موجودی رزرو شده */
  reservedStock: number;
  
  /** موجودی قابل فروش */
  availableStock: number;
  
  /** حداقل موجودی */
  minStock: number;
  
  /** حداکثر موجودی */
  maxStock: number;
  
  /** سطح هشدار */
  alertLevel: StockAlertLevel;
  
  /** قیمت خرید میانگین */
  averagePurchasePrice: number;
  
  /** ارزش کل موجودی */
  totalValue: number;
}

/**
 * اطلاعات موجودی انبار
 */
export interface IWarehouseStock {
  /** شناسه انبار */
  warehouseId: number;
  
  /** نام انبار */
  warehouseName: string;
  
  /** وضعیت */
  status: WarehouseStatus;
  
  /** تعداد کل آیتم‌ها */
  totalItems: number;
  
  /** تعداد محصولات منحصر به فرد */
  uniqueProducts: number;
  
  /** ارزش کل موجودی */
  totalValue: number;
  
  /** ظرفیت انبار */
  capacity?: number;
  
  /** درصد پر بودن */
  fillPercentage?: number;
}

/**
 * خلاصه حرکت‌های انبار
 */
export interface IStockMovementSummary {
  /** تعداد ورودی‌ها */
  totalIn: number;
  
  /** تعداد خروجی‌ها */
  totalOut: number;
  
  /** تعداد انتقالات */
  totalTransfer: number;
  
  /** تعداد تنظیمات */
  totalAdjustment: number;
  
  /** ارزش ورودی‌ها */
  totalInValue: number;
  
  /** ارزش خروجی‌ها */
  totalOutValue: number;
}

/**
 * فیلتر جستجوی حرکت انبار
 */
export interface IStockMovementFilter {
  /** نوع حرکت */
  type?: StockMovementType;
  
  /** شناسه محصول */
  productId?: number;
  
  /** شناسه انبار */
  warehouseId?: number;
  
  /** از تاریخ */
  fromDate?: Date;
  
  /** تا تاریخ */
  toDate?: Date;
  
  /** شناسه کاربر */
  userId?: number;
}

/**
 * گزارش موجودی
 */
export interface IInventoryReport {
  /** خلاصه */
  summary: {
    /** تعداد کل محصولات */
    totalProducts: number;
    
    /** ارزش کل موجودی */
    totalValue: number;
    
    /** محصولات کم موجود */
    lowStockProducts: number;
    
    /** محصولات تمام شده */
    outOfStockProducts: number;
    
    /** محصولات زیاد موجود */
    overStockProducts: number;
  };
  
  /** موجودی به تفکیک انبار */
  byWarehouse: IWarehouseStock[];
  
  /** محصولات کم موجود */
  lowStockProducts: IProductStock[];
  
  /** محصولات پرفروش */
  topSellingProducts: Array<{
    productId: number;
    productName: string;
    soldQuantity: number;
    revenue: number;
  }>;
  
  /** محصولات کم فروش */
  slowMovingProducts: Array<{
    productId: number;
    productName: string;
    daysInStock: number;
    currentStock: number;
  }>;
}

/**
 * اطلاعات انتقال بین انبار
 */
export interface IStockTransfer {
  /** شناسه */
  id: number;
  
  /** از انبار */
  fromWarehouse: {
    id: number;
    name: string;
  };
  
  /** به انبار */
  toWarehouse: {
    id: number;
    name: string;
  };
  
  /** محصول */
  product: {
    id: number;
    name: string;
    sku: string;
  };
  
  /** تعداد */
  quantity: number;
  
  /** تاریخ درخواست */
  requestDate: Date;
  
  /** تاریخ تایید */
  approvedDate?: Date;
  
  /** تاریخ اتمام */
  completedDate?: Date;
  
  /** وضعیت */
  status: string;
  
  /** یادداشت */
  notes?: string;
}

/**
 * پیش‌بینی موجودی
 */
export interface IStockForecast {
  /** شناسه محصول */
  productId: number;
  
  /** موجودی فعلی */
  currentStock: number;
  
  /** میانگین فروش روزانه */
  averageDailySales: number;
  
  /** تعداد روزهای باقی‌مانده تا اتمام */
  daysUntilStockOut: number;
  
  /** تاریخ پیش‌بینی شده اتمام */
  estimatedStockOutDate: Date;
  
  /** توصیه سفارش */
  reorderRecommendation: {
    /** باید سفارش داد؟ */
    shouldReorder: boolean;
    
    /** تعداد پیشنهادی */
    suggestedQuantity: number;
    
    /** تاریخ پیشنهادی سفارش */
    suggestedOrderDate: Date;
  };
}
