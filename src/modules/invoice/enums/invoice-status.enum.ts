export enum InvoiceStatus {
    UNPAID = "unpaid",          // در انتظار پرداخت
    PAID = "paid",              // پرداخت‌شده
    FAILED = "failed",          // ناموفق
    REFUNDED = "refunded",      // بازگشت وجه
    CANCELED = "canceled",      // لغوشده
}