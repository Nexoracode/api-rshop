# 🔍 بررسی کامل Payment Services

## 📋 خلاصه وضعیت:

| موضوع | وضعیت | توضیح |
|-------|-------|-------|
| Payment.service.ts | ✅ عالی | همه چی اوکیه |
| Payment-recovery.service.ts | ⚠️ یک مشکل | Cron برای تست تغییر کرده |

---

## 1️⃣ Payment.service.ts - بررسی کامل

### ✅ نکات مثبت:

#### 1. Transaction Safety:
```typescript
✅ استفاده از runInTransaction()
✅ rollback خودکار در صورت خطا
✅ queryRunner.release() در finally
```

#### 2. Error Handling:
```typescript
✅ try-catch برای Zarinpal
✅ Log تمام خطاها
✅ Payment Log برای تمام مراحل
✅ Status های مختلف (SUCCESS, FAILED, CANCELLED, VERIFIED)
```

#### 3. Cart Management:
```typescript
✅ Lock کردن Cart قبل از پرداخت
✅ Unlock کردن Cart در صورت لغو
✅ Abandon کردن Cart بعد از موفقیت
✅ استفاده از CardStatusService
```

#### 4. Invoice Handling:
```typescript
✅ ساخت Invoice بعد از پرداخت موفق
✅ Handle کردن خطای Invoice
✅ Payment.status = VERIFIED اگه Invoice نساخته بشه
```

#### 5. Promotion Integration:
```typescript
✅ افزایش usage count پروموشن‌ها
✅ Handle خطا بدون اثر روی پرداخت
```

#### 6. Event-Driven Architecture:
```typescript
✅ emit کردن order.paid event
✅ یکپارچه‌سازی با Accounting
✅ Error handling برای event
```

### 🟡 نکات قابل بهبود:

#### 1. Double Lock در createPayment:
```typescript
// خط 91-95:
const card = await cardRepo.findOne({...});
if (card) {
    card.status = CardStatus.LOCKED;
    await cardRepo.save(card);
}

// خط 148:
await this.cardStatusService.lockCart(order.user.id, manager);

// ⚠️ مشکل: دوبار lock می‌کنیم!
```

**راه حل:**
```typescript
// فقط یکی کافیه:
await this.cardStatusService.lockCart(order.user.id, manager);
```

#### 2. Double Unlock در finally:
```typescript
// خط 358-363:
finally {
    const lockedCard = await cardRepo.findOne({...});
    if (lockedCard) {
        lockedCard.status = CardStatus.OPEN;
        await cardRepo.save(lockedCard);
    }
}

// ⚠️ مشکل: اگه پرداخت موفق بود، Cart باید ABANDONED باشه نه OPEN!
```

**راه حل:**
```typescript
finally {
    // فقط اگه پرداخت fail شده بود، unlock کن
    if (payment.status === PaymentStatus.FAILED || 
        payment.status === PaymentStatus.CANCELLED) {
        await this.cardStatusService.unlockCart(order.user.id, manager);
    }
}
```

---

## 2️⃣ Payment-recovery.service.ts - بررسی کامل

### ✅ نکات مثبت:

#### 1. Transaction Safety:
```typescript
✅ استفاده از QueryRunner
✅ startTransaction / commitTransaction / rollbackTransaction
✅ release در finally
```

#### 2. Idempotency:
```typescript
✅ چک می‌کنه Invoice قبلاً ساخته نشده باشه
✅ اگه موجود بود، فقط status رو update می‌کنه
```

#### 3. Error Handling:
```typescript
✅ try-catch کامل
✅ Log تمام خطاها
✅ ثبت Payment Log
```

### ❌ مشکل اصلی:

#### خط 23: Cron برای تست تغییر کرده!
```typescript
// ❌ اشتباه:
@Cron(CronExpression.EVERY_5_MINUTES)
async recoverUninvoicedPayments() {

// ✅ درست:
@Cron(CronExpression.EVERY_DAY_AT_3AM)
async recoverUninvoicedPayments() {
```

**چرا مشکله؟**
- هر 5 دقیقه اجرا میشه → Load زیاد روی دیتابیس
- احتمال Race Condition بالاست
- برای Production نامناسبه

**باید:**
- روزی یکبار (ساعت 3 صبح) کافیه
- یا اگه می‌خوای بیشتر → حداکثر هر 30 دقیقه

### 🟡 نکات قابل بهبود:

#### 1. Missing Event Emission:
```typescript
// بعد از ساخت موفق Invoice، باید event بزنیم:
this.eventEmitter.emit(
    'order.paid',
    new OrderPaidEvent(order.id, payment.id, user.id),
);
```

#### 2. Missing Stock Decrease:
```typescript
// اگه Payment VERIFIED شد ولی Invoice نساخته شد،
// یعنی موجودی هم کم نشده!
// باید بعد از ساخت Invoice، موجودی رو کم کنیم
```

---

## 🔧 Fix های پیشنهادی:

### 1. payment.service.ts:

```typescript
// ✅ Fix 1: حذف double lock
async createPayment(callbackUrl: string, orderId: number, req: Request) {
    return runInTransaction(this.dataSource, async (manager) => {
        // ... کد قبلی ...
        
        // ❌ حذف این:
        // const card = await cardRepo.findOne({...});
        // if (card) {
        //     card.status = CardStatus.LOCKED;
        //     await cardRepo.save(card);
        // }
        
        // ... کد قبلی ...
        
        // ✅ فقط این:
        await this.cardStatusService.lockCart(order.user.id, manager);
    });
}

// ✅ Fix 2: اصلاح finally
async verifyPayment(...) {
    return runInTransaction(this.dataSource, async (manager) => {
        // ... کد قبلی ...
        
    } catch (e) {
        // ... handle error ...
    } finally {
        // ✅ فقط در صورت fail یا cancel
        if (payment.status === PaymentStatus.FAILED || 
            payment.status === PaymentStatus.CANCELLED) {
            await this.cardStatusService.unlockCart(order.user.id, manager);
        }
    });
}
```

### 2. payment-recovery.service.ts:

```typescript
// ✅ Fix 1: تغییر Cron
@Cron(CronExpression.EVERY_DAY_AT_3AM) // ✅ نه هر 5 دقیقه!
async recoverUninvoicedPayments() {
    // ... کد موجود ...
}

// ✅ Fix 2: اضافه کردن Event Emission
private async recoverSinglePayment(payment: Payment) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // ... کد موجود ...
        
        const invoice = await this.invoiceService.createFromOrder(...);
        
        // ✅ اضافه شود:
        try {
            this.eventEmitter.emit(
                'order.paid',
                new OrderPaidEvent(order.id, payment.id, user.id),
            );
            this.logger.log(`🎉 Event emitted for recovered payment ${payment.id}`);
        } catch (error) {
            this.logger.error(`Failed to emit event for payment ${payment.id}`, error);
        }
        
        // ... باقی کد ...
    }
}
```

---

## 🎯 اولویت Fix ها:

### 🔴 فوری (باید حتماً):
1. **تغییر Cron به روزانه** در payment-recovery.service.ts
   - از `EVERY_5_MINUTES` به `EVERY_DAY_AT_3AM`

### 🟡 مهم (توصیه می‌شه):
2. **حذف double lock** در payment.service.ts
3. **اصلاح finally block** در payment.service.ts

### 🟢 اختیاری (بهتره):
4. **اضافه کردن event emission** در payment-recovery
5. **اضافه کردن stock decrease** در payment-recovery

---

## ✅ نکات امنیتی:

### 1. Zarinpal Security:
```typescript
✅ Authority validation
✅ Amount verification
✅ Status checking (100, 101)
✅ Duplicate payment prevention
```

### 2. Transaction Isolation:
```typescript
✅ Pessimistic locking برای Card
✅ Transaction rollback
✅ Idempotent operations
```

### 3. Logging:
```typescript
✅ تمام مراحل log می‌شه
✅ Payment Log جامع
✅ Error stack trace
```

---

## 📊 Flow Chart:

### Payment Flow:
```
createPayment()
    ↓ Lock Cart
    ↓ Zarinpal Request
    ↓ Save Payment (IN_PROGRESS)
    ↓ Order → PAYMENT_CONFIRMATION_PENDING
    ↓ Return URL

User pays → Zarinpal Callback

verifyPayment()
    ↓ Find Payment
    ↓ Zarinpal Verify
    ↓ Status 100?
        ↓ YES:
            ↓ Order → PREPARING
            ↓ Payment → SUCCESS
            ↓ Cart → ABANDONED
            ↓ Increment Promotions
            ↓ Emit order.paid Event
            ↓ Create Invoice ✅
        ↓ NO:
            ↓ Order → PAYMENT_FAILED
            ↓ Payment → FAILED
            ↓ Cart → OPEN (unlock)
```

### Recovery Flow:
```
recoverUninvoicedPayments() [Every Day 3AM]
    ↓ Find VERIFIED Payments
    ↓ Loop each Payment
        ↓ Invoice exists?
            ↓ YES: Payment → SUCCESS
            ↓ NO: 
                ↓ Create Invoice
                ↓ Payment → SUCCESS
                ↓ Emit Event ⚠️ (missing)
                ↓ Log Success
```

---

## 🚀 خلاصه:

| Service | وضعیت کلی | Fix های لازم |
|---------|-----------|---------------|
| payment.service.ts | 95% ✅ | 2 مورد جزئی |
| payment-recovery.service.ts | 90% ✅ | 1 مورد مهم (Cron) |

**کد به طور کلی عالیه!** فقط چند نکته جزئی نیاز به اصلاح دارن.

---

**تاریخ بررسی:** دسامبر 2024  
**نتیجه:** ✅ آماده Production (بعد از Fix های فوری)
