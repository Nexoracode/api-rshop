/**
 * نوع تراکنش مالی
 */
export enum TransactionType {
  /** دریافت پول (افزایش موجودی) */
  INCOME = 'INCOME',
  
  /** پرداخت پول (کاهش موجودی) */
  EXPENSE = 'EXPENSE',
  
  /** انتقال بین حساب‌ها */
  TRANSFER = 'TRANSFER',
}

/**
 * دسته‌بندی تراکنش‌های درآمدی
 */
export enum IncomeCategory {
  /** فروش محصولات */
  PRODUCT_SALE = 'PRODUCT_SALE',
  
  /** هزینه ارسال */
  SHIPPING_FEE = 'SHIPPING_FEE',
  
  /** هزینه بسته‌بندی هدیه */
  GIFT_WRAPPING_FEE = 'GIFT_WRAPPING_FEE',
  
  /** برگشت از تامین‌کننده */
  SUPPLIER_REFUND = 'SUPPLIER_REFUND',
  
  /** سایر درآمدها */
  OTHER_INCOME = 'OTHER_INCOME',
}

/**
 * دسته‌بندی تراکنش‌های هزینه
 */
export enum ExpenseCategory {
  /** خرید کالا از تامین‌کننده */
  PURCHASE = 'PURCHASE',
  
  /** هزینه حمل و نقل */
  SHIPPING = 'SHIPPING',
  
  /** حقوق و دستمزد */
  SALARY = 'SALARY',
  
  /** اجاره */
  RENT = 'RENT',
  
  /** آب، برق، گاز */
  UTILITIES = 'UTILITIES',
  
  /** بازاریابی و تبلیغات */
  MARKETING = 'MARKETING',
  
  /** نگهداری و تعمیرات */
  MAINTENANCE = 'MAINTENANCE',
  
  /** برگشت وجه به مشتری */
  CUSTOMER_REFUND = 'CUSTOMER_REFUND',
  
  /** مالیات */
  TAX = 'TAX',
  
  /** سایر هزینه‌ها */
  OTHER_EXPENSE = 'OTHER_EXPENSE',
}

/**
 * وضعیت تراکنش
 */
export enum TransactionStatus {
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
 * روش پرداخت
 */
export enum PaymentMethod {
  /** نقدی */
  CASH = 'CASH',
  
  /** کارت به کارت */
  CARD_TO_CARD = 'CARD_TO_CARD',
  
  /** درگاه پرداخت آنلاین */
  ONLINE_GATEWAY = 'ONLINE_GATEWAY',
  
  /** چک */
  CHEQUE = 'CHEQUE',
  
  /** حواله بانکی */
  BANK_TRANSFER = 'BANK_TRANSFER',
  
  /** اعتباری (نسیه) */
  CREDIT = 'CREDIT',
  
  /** کیف پول */
  WALLET = 'WALLET',
}

/**
 * نوع حساب
 */
export enum AccountType {
  /** حساب بانکی */
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  
  /** صندوق نقدی */
  CASH_BOX = 'CASH_BOX',
  
  /** کیف پول */
  WALLET = 'WALLET',
  
  /** حساب اعتباری */
  CREDIT_ACCOUNT = 'CREDIT_ACCOUNT',
}
