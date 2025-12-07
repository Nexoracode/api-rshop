/**
 * نوع حرکت انبار
 */
export enum StockMovementType {
  /** ورود به انبار */
  IN = 'IN',
  
  /** خروج از انبار */
  OUT = 'OUT',
  
  /** انتقال بین انبارها */
  TRANSFER = 'TRANSFER',
  
  /** تنظیم موجودی (اصلاح) */
  ADJUSTMENT = 'ADJUSTMENT',
}

/**
 * دلیل ورود به انبار
 */
export enum StockInReason {
  /** خرید از تامین‌کننده */
  PURCHASE = 'PURCHASE',
  
  /** برگشت از مشتری */
  CUSTOMER_RETURN = 'CUSTOMER_RETURN',
  
  /** تولید */
  PRODUCTION = 'PRODUCTION',
  
  /** تنظیم موجودی (اضافه شدن) */
  ADJUSTMENT_INCREASE = 'ADJUSTMENT_INCREASE',
  
  /** انتقال از انبار دیگر */
  TRANSFER_IN = 'TRANSFER_IN',
  
  /** سایر موارد */
  OTHER = 'OTHER',
}

/**
 * دلیل خروج از انبار
 */
export enum StockOutReason {
  /** فروش به مشتری */
  SALE = 'SALE',
  
  /** برگشت به تامین‌کننده */
  SUPPLIER_RETURN = 'SUPPLIER_RETURN',
  
  /** ضایعات */
  DAMAGE = 'DAMAGE',
  
  /** سرقت */
  THEFT = 'THEFT',
  
  /** انقضا */
  EXPIRY = 'EXPIRY',
  
  /** تنظیم موجودی (کاهش) */
  ADJUSTMENT_DECREASE = 'ADJUSTMENT_DECREASE',
  
  /** انتقال به انبار دیگر */
  TRANSFER_OUT = 'TRANSFER_OUT',
  
  /** سایر موارد */
  OTHER = 'OTHER',
}

/**
 * وضعیت حرکت انبار
 */
export enum StockMovementStatus {
  /** در حال انتظار */
  PENDING = 'PENDING',
  
  /** تایید شده */
  APPROVED = 'APPROVED',
  
  /** رد شده */
  REJECTED = 'REJECTED',
  
  /** کنسل شده */
  CANCELLED = 'CANCELLED',
}

/**
 * نوع انبار
 */
export enum WarehouseType {
  /** انبار اصلی */
  MAIN = 'MAIN',
  
  /** انبار فرعی */
  BRANCH = 'BRANCH',
  
  /** انبار مرجوعی */
  RETURN = 'RETURN',
  
  /** انبار ضایعات */
  DAMAGE = 'DAMAGE',
  
  /** انبار قرنطینه */
  QUARANTINE = 'QUARANTINE',
}

/**
 * وضعیت انبار
 */
export enum WarehouseStatus {
  /** فعال */
  ACTIVE = 'ACTIVE',
  
  /** غیرفعال */
  INACTIVE = 'INACTIVE',
  
  /** در دست تعمیر */
  MAINTENANCE = 'MAINTENANCE',
}

/**
 * سطح هشدار موجودی
 */
export enum StockAlertLevel {
  /** موجودی کافی */
  SUFFICIENT = 'SUFFICIENT',
  
  /** نزدیک به اتمام */
  LOW = 'LOW',
  
  /** بسیار کم */
  CRITICAL = 'CRITICAL',
  
  /** اتمام موجودی */
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}
