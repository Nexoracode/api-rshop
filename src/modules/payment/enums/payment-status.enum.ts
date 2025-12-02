export enum PaymentStatus {
    PENDING = 'pending', // پرداخت ایجاد شده ولی هنوز انجام نشده
    IN_PROGRESS = 'in_progress', // کاربر در درگاه پرداخت است
    SUCCESS = 'success', // پرداخت با موفقیت تایید شد
    FAILED = 'failed', // پرداخت شکست خورده
    CANCELLED = 'cancelled', // توسط کاربر لغو شد
    VERIFIED = 'verified', // تایید شده ولی فاکتور هنوز صادر نشده
    REFUNDED = 'refunded', // بازگشت وجه
}

export enum PaymentLogStatus {
    INITIATED = 'initiated',
    VERIFIED = 'verified',
    FAILED = 'failed',
    CALLBACK_RECEIVED = 'callback_received',
    USER_CANCELLED = 'user_cancelled',
}

export enum PaymentGateway {
    ZARINPAL = 'zarinpal',
    IDPAY = 'idpay',
    MELAT = 'melat',
}

// ✅ جدید: نوع پرداخت
export enum PaymentMethod {
    ONLINE = 'online',              // پرداخت آنلاین (درگاه)
    CARD_TO_CARD = 'card_to_card',  // کارت به کارت
}

// ✅ جدید: وضعیت پرداخت کارت به کارت
export enum CardToCardStatus {
    PENDING = 'pending',           // منتظر آپلود رسید
    UPLOADED = 'uploaded',         // رسید آپلود شده، منتظر تایید
    APPROVED = 'approved',         // تایید شده توسط ادمین
    REJECTED = 'rejected',         // رد شده توسط ادمین
}
