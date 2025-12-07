# 🏦 سیستم حسابداری و انبارداری - README

## 📋 فهرست مطالب
1. [معرفی](#معرفی)
2. [ویژگی‌ها](#ویژگی‌ها)
3. [ساختار پروژه](#ساختار-پروژه)
4. [نصب و راه‌اندازی](#نصب-و-راه‌اندازی)
5. [استفاده](#استفاده)
6. [API Documentation](#api-documentation)

---

## 🎯 معرفی

سیستم جامع حسابداری و انبارداری برای پلتفرم RSHOP که شامل:
- مدیریت کامل تراکنش‌های مالی (درآمد و هزینه)
- مدیریت چند انبار
- ردیابی موجودی محصولات
- حرکت‌های انبار (ورود/خروج/انتقال)
- گزارش‌گیری پیشرفته

---

## ✨ ویژگی‌ها

### 💰 ماژول مالی
- ✅ ثبت تراکنش‌های درآمد با دسته‌بندی
- ✅ ثبت تراکنش‌های هزینه با دسته‌بندی
- ✅ انتقال بین حساب‌ها
- ✅ تایید/رد تراکنش‌ها
- ✅ پیوست فایل برای تراکنش‌ها
- ✅ مدیریت چند حساب (بانکی، نقدی، کیف پول)
- ✅ ردیابی تراکنش‌ها با شماره رسید
- 🔄 گزارش سود و زیان
- 🔄 گزارش جریان نقدی

### 📦 ماژول انبار
- ✅ مدیریت چند انبار
- ✅ ورود کالا (خرید، برگشت، تولید)
- ✅ خروج کالا (فروش، برگشت، ضایعات)
- ✅ انتقال بین انبارها
- ✅ تنظیم موجودی
- ✅ ردیابی Batch/Lot
- ✅ مدیریت تاریخ انقضا
- ✅ هشدار موجودی کم
- 🔄 گزارش موجودی
- 🔄 گزارش حرکت‌های انبار
- 🔄 پیش‌بینی موجودی

---

## 📂 ساختار پروژه

```
src/modules/accounting/
├── enums/                      # تعریف انواع و وضعیت‌ها
│   ├── transaction.enum.ts     # انواع تراکنش، روش پرداخت، دسته‌بندی
│   └── warehouse.enum.ts       # انواع حرکت انبار، دلایل ورود/خروج
│
├── interfaces/                 # تعریف رابط‌ها
│   ├── transaction.interface.ts
│   └── inventory.interface.ts
│
├── entities/                   # Entity های دیتابیس
│   ├── transaction.entity.ts
│   ├── account.entity.ts
│   ├── warehouse.entity.ts
│   ├── product-stock.entity.ts
│   └── stock-movement.entity.ts
│
├── dto/                        # Data Transfer Objects
│   ├── transaction.dto.ts
│   ├── account.dto.ts
│   ├── warehouse.dto.ts
│   └── stock-movement.dto.ts
│
├── mappers/                    # تبدیل Entity به DTO
│   ├── transaction.mapper.ts
│   ├── account.mapper.ts
│   ├── warehouse.mapper.ts
│   └── stock-movement.mapper.ts
│
├── services/                   # لایه Business Logic
│   ├── account.service.ts      ✅
│   ├── transaction.service.ts  ⏳
│   ├── warehouse.service.ts    ⏳
│   ├── stock-movement.service.ts ⏳
│   └── report.service.ts       ⏳
│
├── controllers/                # لایه API
│   ├── account.controller.ts   ⏳
│   ├── transaction.controller.ts ⏳
│   ├── warehouse.controller.ts ⏳
│   └── stock-movement.controller.ts ⏳
│
└── accounting.module.ts        ⏳
```

---

## 🚀 نصب و راه‌اندازی

### 1. اجرای Migration

```bash
# ایجاد migration
npm run migration:generate -- src/migrations/CreateAccountingTables

# اجرای migration
npm run migration:run
```

### 2. اضافه کردن به app.module.ts

```typescript
import { AccountingModule } from './modules/accounting/accounting.module';

@Module({
  imports: [
    // ... سایر ماژول‌ها
    AccountingModule,
  ],
})
export class AppModule {}
```

### 3. تنظیمات محیطی (اختیاری)

```env
# فایل .env
ACCOUNTING_DEFAULT_CURRENCY=IRR
ACCOUNTING_LOW_STOCK_THRESHOLD=10
ACCOUNTING_AUTO_APPROVE_TRANSACTIONS=false
```

---

## 💡 استفاده

### مثال 1: ثبت تراکنش درآمد

```typescript
POST /api/accounting/transactions

{
  "type": "INCOME",
  "amount": 1000000,
  "category": "PRODUCT_SALE",
  "paymentMethod": "ONLINE_GATEWAY",
  "accountId": 1,
  "orderId": 123,
  "description": "دریافت مبلغ سفارش #123",
  "referenceNumber": "TRX-2024-001",
  "transactionDate": "2024-12-07T10:30:00Z"
}
```

### مثال 2: ورود کالا به انبار

```typescript
POST /api/accounting/stock-movements

{
  "type": "IN",
  "productId": 5,
  "warehouseId": 1,
  "quantity": 100,
  "unitCost": 50000,
  "reasonIn": "PURCHASE",
  "referenceNumber": "PO-2024-001",
  "description": "خرید از تامین‌کننده A",
  "movementDate": "2024-12-07T10:30:00Z"
}
```

### مثال 3: انتقال بین انبارها

```typescript
POST /api/accounting/stock-movements

{
  "type": "TRANSFER",
  "productId": 5,
  "warehouseId": 1,
  "destinationWarehouseId": 2,
  "quantity": 50,
  "description": "انتقال به انبار شعبه شمال",
  "movementDate": "2024-12-07T10:30:00Z"
}
```

---

## 📊 Enums و مقادیر قابل استفاده

### نوع تراکنش (TransactionType)
- `INCOME` - درآمد
- `EXPENSE` - هزینه
- `TRANSFER` - انتقال

### دسته‌بندی درآمد (IncomeCategory)
- `PRODUCT_SALE` - فروش محصول
- `SHIPPING_FEE` - هزینه ارسال
- `GIFT_WRAPPING_FEE` - هزینه بسته‌بندی
- `SUPPLIER_REFUND` - برگشت از تامین‌کننده
- `OTHER_INCOME` - سایر

### دسته‌بندی هزینه (ExpenseCategory)
- `PURCHASE` - خرید کالا
- `SHIPPING` - حمل و نقل
- `SALARY` - حقوق
- `RENT` - اجاره
- `UTILITIES` - آب، برق، گاز
- `MARKETING` - بازاریابی
- `MAINTENANCE` - نگهداری
- `CUSTOMER_REFUND` - برگشت به مشتری
- `TAX` - مالیات
- `OTHER_EXPENSE` - سایر

### روش پرداخت (PaymentMethod)
- `CASH` - نقدی
- `CARD_TO_CARD` - کارت به کارت
- `ONLINE_GATEWAY` - درگاه آنلاین
- `CHEQUE` - چک
- `BANK_TRANSFER` - حواله
- `CREDIT` - نسیه
- `WALLET` - کیف پول

### نوع حرکت انبار (StockMovementType)
- `IN` - ورود
- `OUT` - خروج
- `TRANSFER` - انتقال
- `ADJUSTMENT` - تنظیم

### دلیل ورود (StockInReason)
- `PURCHASE` - خرید
- `CUSTOMER_RETURN` - برگشت مشتری
- `PRODUCTION` - تولید
- `ADJUSTMENT_INCREASE` - افزایش تنظیم
- `TRANSFER_IN` - انتقال ورودی

### دلیل خروج (StockOutReason)
- `SALE` - فروش
- `SUPPLIER_RETURN` - برگشت به تامین‌کننده
- `DAMAGE` - ضایعات
- `THEFT` - سرقت
- `EXPIRY` - انقضا
- `ADJUSTMENT_DECREASE` - کاهش تنظیم
- `TRANSFER_OUT` - انتقال خروجی

---

## 🔐 دسترسی‌ها و نقش‌ها

### Admin
- دسترسی کامل به همه قابلیت‌ها
- تایید/رد تراکنش‌ها
- مدیریت حساب‌ها و انبارها

### Accountant
- ثبت و ویرایش تراکنش‌ها
- مشاهده گزارش‌های مالی
- مدیریت حساب‌ها

### WarehouseManager
- مدیریت حرکت‌های انبار
- تایید ورود/خروج کالا
- مشاهده گزارش موجودی

### Staff
- ثبت درخواست ورود/خروج
- مشاهده موجودی

---

## 📈 گزارش‌ها

### گزارش‌های مالی
1. **سود و زیان** - خلاصه درآمد و هزینه در بازه زمانی
2. **جریان نقدی** - ورود و خروج پول
3. **تراکنش‌های دسته‌بندی شده** - گروه‌بندی بر اساس دسته
4. **موجودی حساب‌ها** - موجودی فعلی تمام حساب‌ها

### گزارش‌های انبار
1. **موجودی کالا** - موجودی فعلی تمام محصولات
2. **محصولات کم موجود** - هشدار موجودی
3. **حرکت‌های انبار** - تاریخچه ورود/خروج
4. **ارزش موجودی** - ارزش ریالی موجودی
5. **محصولات کم فروش** - محصولاتی که حرکت ندارند
6. **پیش‌بینی موجودی** - تخمین زمان اتمام

---

## 🛠️ توسعه

### اضافه کردن دسته‌بندی جدید

1. به فایل enum اضافه کن:
```typescript
export enum ExpenseCategory {
  // ...
  NEW_CATEGORY = 'NEW_CATEGORY',
}
```

2. در سرویس استفاده کن
3. Migration اجرا کن

### اضافه کردن نوع انبار جدید

مشابه بالا در `warehouse.enum.ts`

---

## 🐛 عیب‌یابی

### مشکل: موجودی منفی می‌شود
**راه‌حل**: بررسی کنید transaction فعال باشد و rollback درست کار کند

### مشکل: تراکنش تایید نمی‌شود
**راه‌حل**: بررسی دسترسی کاربر و وضعیت تراکنش

### مشکل: موجودی با واقعیت تطابق ندارد
**راه‌حل**: از قابلیت Stock Adjustment استفاده کنید

---

## 📞 پشتیبانی

برای سوالات و مشکلات:
- Issues: [GitHub Issues](#)
- Email: support@rshop.com
- Docs: [مستندات کامل](#)

---

## 📝 تاریخچه تغییرات

### نسخه 1.0.0 (2024-12-07)
- ✅ ساختار پایه پروژه
- ✅ Entities و DTOs
- ✅ Mappers
- ✅ Service ها (در حال توسعه)
- ⏳ Controllers (در حال توسعه)
- ⏳ گزارشات (در حال توسعه)

---

**توسعه دهنده**: RSHOP Development Team  
**آخرین بروزرسانی**: دسامبر 2024  
**نسخه**: 1.0.0
