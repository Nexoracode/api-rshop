export enum OrderStatus {
    PENDING_APPROVAL = "pending_approval", // در انتظار تایید
    AWAITING_PAYMENT = 'awaiting_payment', // در انتطار پرداخت
    PAYMENT_CONFIRMATION_PENDING = "payment_confirmation_pending", //در انتظار تایید پرداخت
    PREPARING = "preparing", // در حال آماده سازی
    SHIPPING = "shipping", // در حال ارسال
    DELIVERED = 'delivered', // تحویل گرفته
    NOT_DELIVERED = "not_delivered", // تحویل نگرفته
    EXPAIRED = 'expired', // منقضی شده
    REJECTED = 'rejected', // رد شده
    REFUNDED = "refunded", // عودت وجه
    PAYMENT_FAILED = "payment_failed", // پرداخت ناموفق
}

