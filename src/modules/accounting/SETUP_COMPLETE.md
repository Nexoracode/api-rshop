# 🚀 راهنمای نصب و فعال‌سازی

## ✅ چه چیزهایی انجام شد:

### 1. PaymentService.ts ✅
- ✅ اضافه شد: `EventEmitter2` به constructor
- ✅ اضافه شد: Import `OrderPaidEvent`
- ✅ اضافه شد: Event emit در `verifyPayment()` پس از تایید موفق
- ✅ اضافه شد: Try-catch برای Event (در صورت خطا، پرداخت موفق می‌ماند)

### 2. app.module.ts ✅
- ✅ اضافه شد: `EventEmitterModule.forRoot()`
- ✅ قرار گرفت قبل از همه ماژول‌ها

### 3. payment.module.ts ✅
- ✅ نیازی به import AccountingModule نیست
- ✅ EventEmitter خودش Event ها رو route می‌کنه

---

## 📦 گام 1: نصب Package

```bash
npm install @nestjs/event-emitter
```

---

## 🔧 گام 2: اضافه کردن missing import

اگر ارور `OrderPaidEvent` داد، این فایل رو چک کن:

### فایل: `src/modules/accounting/listeners/order-accounting.listener.ts`

این فایل باید وجود داشته باشه (قبلاً ساخته شد):
```typescript
export class OrderPaidEvent {
  constructor(
    public readonly orderId: number,
    public readonly paymentId: number,
    public readonly userId: number,
  ) {}
}
```

---

## 🎯 گام 3: ایجاد حساب و انبار پیش‌فرض

### 3.1 ایجاد حساب پیش‌فرض

```bash
POST http://localhost:3001/accounting/accounts
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_TOKEN

{
  "name": "حساب اصلی فروشگاه",
  "code": "MAIN-001",
  "type": "BANK_ACCOUNT",
  "currency": "IRR",
  "initialBalance": 0,
  "isDefault": true,
  "isActive": true,
  "description": "حساب اصلی برای دریافت پرداخت‌های فروشگاه"
}
```

### 3.2 ایجاد انبار پیش‌فرض

```bash
POST http://localhost:3001/accounting/warehouses
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_TOKEN

{
  "name": "انبار مرکزی",
  "code": "WH-MAIN-001",
  "type": "MAIN",
  "status": "ACTIVE",
  "isDefault": true,
  "city": "تهران",
  "description": "انبار اصلی فروشگاه"
}
```

---

## 🧪 گام 4: تست

### 4.1 تست پرداخت موفق

1. یک سفارش ایجاد کن
2. پرداخت رو انجام بده (Sandbox Zarinpal)
3. بعد از تایید موفق، چک کن:

```bash
# چک تراکنش‌های مالی
GET http://localhost:3001/accounting/transactions?orderId=123

# چک حرکات انبار
GET http://localhost:3001/accounting/stock-movements?orderId=123

# چک موجودی محصول
GET http://localhost:3001/accounting/warehouses/1/products
```

### 4.2 بررسی Log ها

در console باید این log ها رو ببینی:

```
[PaymentService] Payment verified successfully for order 123, refId: ...
[PaymentService] 🎉 Event 'order.paid' emitted for order 123
[OrderAccountingListener] رویداد پرداخت سفارش دریافت شد - Order: 123
[OrderAccountingService] سفارش 123 با موفقیت در سیستم حسابداری ثبت شد
[StockMovementService] موجودی محصول X کم شد - تعداد: 2
```

---

## ⚠️ عیب‌یابی

### مشکل 1: Event دریافت نمی‌شود

**علت**: EventEmitterModule فعال نشده

**راه حل**:
```typescript
// در app.module.ts
EventEmitterModule.forRoot(), // باید قبل از همه imports باشه
```

### مشکل 2: حساب پیش‌فرض یافت نشد

**علت**: حساب پیش‌فرض ایجاد نشده

**راه حل**: گام 3.1 رو انجام بده

### مشکل 3: انبار پیش‌فرض یافت نشد

**علت**: انبار پیش‌فرض ایجاد نشده

**راه حل**: گام 3.2 رو انجام بده

### مشکل 4: Import ارور `OrderPaidEvent`

**علت**: Path اشتباه است

**راه حل**:
```typescript
// در payment.service.ts
import { OrderPaidEvent } from "../accounting/listeners/order-accounting.listener";
```

---

## 📊 جریان کار (چک کن)

```
✅ 1. مشتری پرداخت می‌کند
✅ 2. PaymentService.verifyPayment() فراخوانی می‌شود
✅ 3. Payment و Order بروز می‌شوند
✅ 4. EventEmitter.emit('order.paid', ...) فراخوانی می‌شود
✅ 5. OrderAccountingListener.handleOrderPaid() فراخوانی می‌شود
✅ 6. Transaction ثبت می‌شود (درآمد)
✅ 7. StockMovement ثبت می‌شود (خروج)
✅ 8. موجودی کم می‌شود
✅ 9. ✅ تمام!
```

---

## 🎉 چک‌لیست نهایی

- [ ] `npm install @nestjs/event-emitter` اجرا شد
- [ ] `app.module.ts` بروز شد
- [ ] `payment.service.ts` بروز شد
- [ ] Server restart شد
- [ ] حساب پیش‌فرض ایجاد شد
- [ ] انبار پیش‌فرض ایجاد شد
- [ ] یک پرداخت تست انجام شد
- [ ] Transaction ثبت شد ✅
- [ ] StockMovement ثبت شد ✅
- [ ] موجودی کم شد ✅
- [ ] Log ها صحیح هستند ✅

---

## 🚀 اگر همه چیز OK بود:

**تبریک! یکپارچه‌سازی با موفقیت انجام شد!** 🎉

از حالا به بعد:
- هر پرداخت موفق → خودکار تراکنش ثبت می‌شه
- هر پرداخت موفق → خودکار موجودی کم می‌شه
- همه چیز داخل Transaction امن است
- در صورت خطا → Rollback کامل

**دیگه نیازی به کاری نیست، همه چیز خودکاره!** ✨

---

## 📞 در صورت مشکل:

1. Log های server رو چک کن
2. Database رو چک کن (accounting_transactions, stock_movements)
3. مطمئن شو حساب و انبار پیش‌فرض ایجاد شدن
4. مطمئن شو EventEmitterModule import شده

---

**موفق باشی!** 🚀
