export enum InvoiceStatus {
    PENDING = "pending",      // در انتظار پرداخت
    PAID = "paid",            // پرداخت‌شده
    CANCELLED = "cancelled",  // لغوشده
    SHIPPED = "shipped",      // ارسال‌شده
    DELIVERED = "delivered",  // تحویل‌شده
    REFUNDED = "refunded",    // بازگشت وجه
    FAILED = 'failed',   // لغوشده
}