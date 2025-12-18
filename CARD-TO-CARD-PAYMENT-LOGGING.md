# ✅ Payment Logging برای Card-to-Card

## 🎯 هدف:

اضافه کردن **Payment Log** برای تمام مراحل کارت به کارت، مثل درگاه آنلاین (Zarinpal).

---

## ❌ قبل از تغییرات:

```typescript
// card-to-card.service.ts
// ❌ هیچ لاگی ثبت نمی‌شد!

initiate() → Payment ساخته میشه ❌ (بدون لاگ)
uploadReceipt() → رسید آپلود میشه ❌ (بدون لاگ)
reviewReceipt(REJECTED) → رد میشه ❌ (بدون لاگ)
reviewReceipt(APPROVED) → تایید میشه ❌ (بدون لاگ)
```

**مشکلات:**
- ❌ نمی‌تونی track کنی چه اتفاقی افتاده
- ❌ آمار نداری
- ❌ برای debug مشکله
- ❌ برای audit log نداری

---

## ✅ بعد از تغییرات:

### فلوی کامل با Log:

```
1. initiate() → Payment ساخته میشه
   ✅ Log: INITIATED
   ✅ Message: "پرداخت کارت به کارت ایجاد شد، در انتظار آپلود رسید"
   ✅ Payload: { orderId, amount }

2. uploadReceipt() → رسید آپلود میشه
   ✅ Log: CALLBACK_RECEIVED
   ✅ Message: "رسید آپلود شد، در انتظار بررسی ادمین"
   ✅ Payload: { hasImage, hasCardNumber, hasTrackingCode, depositDate }

3a. reviewReceipt(REJECTED) → ادمین رد می‌کنه
   ✅ Log: FAILED
   ✅ Message: "رسید توسط ادمین رد شد: {دلیل}"
   ✅ Payload: { adminId, reason }

3b. reviewReceipt(APPROVED) → ادمین تایید می‌کنه
   ✅ Log: VERIFIED
   ✅ Message: "پرداخت توسط ادمین تایید شد و فاکتور صادر شد"
   ✅ Payload: { adminId, invoiceId, refId, adminNote }
```

---

## 📊 مقایسه با Zarinpal:

### Zarinpal (Online):
```
1. createPayment() → INITIATED
2. verifyPayment(OK) → CALLBACK_RECEIVED
3. Zarinpal Verify → VERIFIED
4. Create Invoice → SUCCESS
```

### Card-to-Card (Manual):
```
1. initiate() → INITIATED ✅
2. uploadReceipt() → CALLBACK_RECEIVED ✅
3. Admin Review → VERIFIED or FAILED ✅
4. Create Invoice (if VERIFIED) ✅
```

**حالا هر دو یکسان هستن!** 🎉

---

## 🔧 تغییرات انجام شده:

### فایل: card-to-card.service.ts

#### 1. Import ها:
```typescript
+ import { Logger } from '@nestjs/common';
+ import { PaymentLog } from './entities/payment-logs.entity';
+ import { PaymentLogStatus } from './enums/payment-status.enum';
```

#### 2. Constructor:
```typescript
+ private readonly logger = new Logger(CardToCardService.name);

+ @InjectRepository(PaymentLog)
+ private readonly paymentLogRepo: Repository<PaymentLog>,
```

#### 3. initiate() - خط 95-108:
```typescript
const savedPayment = await manager.save(Payment, payment);

// ✅ ثبت لاگ
await this.paymentLogRepo.save({
    order,
    payment: savedPayment,
    user,
    authority: savedPayment.authority,
    status: PaymentLogStatus.INITIATED,
    message: 'پرداخت کارت به کارت ایجاد شد، در انتظار آپلود رسید',
    payload: { orderId: order.id, amount: order.total },
});

this.logger.log(`Card-to-card payment initiated for order ${order.id}`);
```

#### 4. uploadReceipt() - خط 186-201:
```typescript
order.status = OrderStatus.PAYMENT_CONFIRMATION_PENDING;
await orderRepo.save(order);

// ✅ ثبت لاگ
await this.paymentLogRepo.save({
    order,
    payment: saved,
    user,
    authority: saved.authority,
    status: PaymentLogStatus.CALLBACK_RECEIVED,
    message: 'رسید آپلود شد، در انتظار بررسی ادمین',
    payload: {
        hasImage: !!receiptImageId,
        hasCardNumber: !!dto.senderCardNumber,
        hasTrackingCode: !!dto.trackingCode,
        depositDate: dto.depositDate,
    },
});

this.logger.log(`Receipt uploaded for payment ${saved.id}`);
```

#### 5. reviewReceipt(REJECTED) - خط 340-352:
```typescript
await this.cardStatusService.unlockCart(payment.user.id, manager);

// ✅ ثبت لاگ
await this.paymentLogRepo.save({
    order: payment.order,
    payment,
    user: payment.user,
    authority: payment.authority,
    status: PaymentLogStatus.FAILED,
    message: `رسید توسط ادمین رد شد: ${dto.adminNote}`,
    payload: { adminId: admin.id, reason: dto.adminNote },
});

this.logger.warn(`Payment ${payment.id} rejected by admin ${admin.id}`);
```

#### 6. reviewReceipt(APPROVED) - خط 417-434:
```typescript
if (invoice) {
    await this.invoiceService.updateInvoiceStatus(
        manager,
        order.id,
        InvoiceStatus.PAID,
    );
}

// ✅ ثبت لاگ
await this.paymentLogRepo.save({
    order,
    payment,
    user: payment.user,
    authority: payment.authority,
    status: PaymentLogStatus.VERIFIED,
    message: 'پرداخت توسط ادمین تایید شد و فاکتور صادر شد',
    payload: {
        adminId: admin.id,
        invoiceId: invoice?.id,
        refId: payment.refId,
        adminNote: dto.adminNote,
    },
});

this.logger.log(`Payment ${payment.id} approved by admin ${admin.id}, invoice ${invoice?.id} created`);
```

---

## 📋 Payment Log Status ها:

| Status | کجا استفاده میشه | معنی |
|--------|------------------|------|
| INITIATED | initiate() | پرداخت ایجاد شد |
| CALLBACK_RECEIVED | uploadReceipt() | رسید دریافت شد |
| VERIFIED | reviewReceipt(APPROVED) | تایید شد |
| FAILED | reviewReceipt(REJECTED) | رد شد |

---

## 🔍 Query برای آمار:

### تعداد پرداخت‌های هر مرحله:
```sql
SELECT 
    pl.status,
    COUNT(*) as count
FROM payment_logs pl
INNER JOIN payments p ON p.id = pl.payment_id
WHERE p.payment_method = 'card_to_card'
GROUP BY pl.status;
```

### زمان متوسط بررسی توسط ادمین:
```sql
SELECT 
    AVG(TIMESTAMPDIFF(MINUTE, initiated.created_at, verified.created_at)) as avg_review_minutes
FROM payment_logs initiated
INNER JOIN payment_logs verified 
    ON verified.payment_id = initiated.payment_id
WHERE initiated.status = 'initiated'
  AND verified.status IN ('verified', 'failed')
  AND initiated.payment_id IN (
      SELECT id FROM payments WHERE payment_method = 'card_to_card'
  );
```

### تعداد رد شده توسط هر ادمین:
```sql
SELECT 
    pl.payload->>'$.adminId' as admin_id,
    COUNT(*) as rejected_count
FROM payment_logs pl
WHERE pl.status = 'failed'
  AND pl.message LIKE '%رد شد%'
GROUP BY admin_id
ORDER BY rejected_count DESC;
```

### آخرین 10 تایید/رد:
```sql
SELECT 
    p.id as payment_id,
    p.amount,
    pl.status,
    pl.message,
    pl.created_at,
    pl.payload->>'$.adminId' as admin_id
FROM payment_logs pl
INNER JOIN payments p ON p.id = pl.payment_id
WHERE pl.status IN ('verified', 'failed')
  AND p.payment_method = 'card_to_card'
ORDER BY pl.created_at DESC
LIMIT 10;
```

---

## 🎯 مزایای Payment Log:

### 1. Audit Trail:
```
✅ می‌دونی چه کسی کی چه کاری کرده
✅ می‌تونی track کنی یک پرداخت چه مراحلی رو گذرونده
✅ برای مشکلات قانونی مدرک داری
```

### 2. Analytics:
```
✅ متوسط زمان بررسی توسط ادمین
✅ نرخ تایید/رد
✅ کدوم ادمین بیشتر رد می‌کنه
✅ در چه ساعاتی بیشتر آپلود میشه
```

### 3. Debugging:
```
✅ اگه کاربر بگه "پرداختم چی شد؟"
✅ می‌تونی تمام مراحل رو ببینی
✅ دقیقاً می‌دونی کجا مشکل پیش اومده
```

### 4. Monitoring:
```
✅ Alert اگه پرداختی بیش از X ساعت در حالت PENDING مونده
✅ Dashboard برای نمایش تعداد پرداخت‌های منتظر بررسی
✅ نمودار روند پرداخت‌ها
```

---

## 🧪 تست:

### سناریوی تست کامل:

```sql
-- 1. ایجاد پرداخت
-- نتیجه: payment_logs.status = 'initiated' ✅

-- 2. آپلود رسید
-- نتیجه: payment_logs.status = 'callback_received' ✅

-- 3. ادمین رد می‌کنه
-- نتیجه: payment_logs.status = 'failed' ✅

-- یا: ادمین تایید می‌کنه
-- نتیجه: payment_logs.status = 'verified' ✅

-- چک کردن تمام لاگ‌ها:
SELECT 
    pl.id,
    pl.status,
    pl.message,
    pl.created_at,
    pl.payload
FROM payment_logs pl
WHERE pl.payment_id = [PAYMENT_ID]
ORDER BY pl.created_at ASC;
```

---

## 📊 نمونه خروجی لاگ‌ها:

```
[
  {
    id: 1,
    status: 'initiated',
    message: 'پرداخت کارت به کارت ایجاد شد، در انتظار آپلود رسید',
    created_at: '2024-12-18 10:00:00',
    payload: { orderId: 123, amount: 500000 }
  },
  {
    id: 2,
    status: 'callback_received',
    message: 'رسید آپلود شد، در انتظار بررسی ادمین',
    created_at: '2024-12-18 10:05:00',
    payload: { 
      hasImage: true, 
      hasCardNumber: true, 
      hasTrackingCode: false,
      depositDate: '2024-12-18'
    }
  },
  {
    id: 3,
    status: 'verified',
    message: 'پرداخت توسط ادمین تایید شد و فاکتور صادر شد',
    created_at: '2024-12-18 11:00:00',
    payload: { 
      adminId: 5, 
      invoiceId: 87, 
      refId: 'C2C-123',
      adminNote: 'تایید شد'
    }
  }
]
```

---

## 🚀 آماده است!

حالا **Card-to-Card** هم مثل **Zarinpal** تمام مراحل رو log می‌کنه و می‌تونی:
- ✅ Track کنی
- ✅ آمار بگیری
- ✅ Debug کنی
- ✅ Monitor کنی
- ✅ Audit Trail داشته باشی

---

**تاریخ:** دسامبر 2024  
**فایل تغییر یافته:** `card-to-card.service.ts`  
**وضعیت:** ✅ آماده deployment
