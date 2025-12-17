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
    MELAT = 'melat',
    MELI = 'meli',
}

// ✅ جدید: نوع پرداخت
export enum PaymentMethod {
    /** آنلاین */
    ONLINE = 'online',

    /** نقدی */
    CASH = 'cash',

    /** کارت به کارت */
    CARD_TO_CARD = 'card_to_card',

    /** چک */
    CHEQUE = 'cheque',

    /** حواله بانکی */
    BANK_TRANSFER = 'bank_trasfer',

    /** اعتباری (نسیه) */
    CREDIT = 'credit',

    /** کیف پول */
    WALLET = 'wallet'
}

// ✅ جدید: وضعیت پرداخت کارت به کارت
export enum CardToCardStatus {
    PENDING = 'pending',           // منتظر آپلود رسید
    UPLOADED = 'uploaded',         // رسید آپلود شده، منتظر تایید
    APPROVED = 'approved',         // تایید شده توسط ادمین
    REJECTED = 'rejected',         // رد شده توسط ادمین
}
