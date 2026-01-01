# 💳 Card-to-Card Payment - Handler Architecture

## 📁 ساختار فایل‌ها:

```
src/modules/payment/
├── handlers/
│   └── card-to-card/
│       ├── card-to-card-initiation.handler.ts      # ایجاد پرداخت
│       ├── card-to-card-upload-receipt.handler.ts  # آپلود رسید
│       ├── card-to-card-rejection.handler.ts       # رد رسید (ادمین)
│       └── card-to-card-approval.handler.ts        # تایید رسید (ادمین)
├── card-to-card.service.ts                         # Service ساده (40 خط!)
└── payment.module.ts                               # Module
```

---

## 🎯 Handler ها:

### 1️⃣ CardToCardInitiationHandler
**مسئولیت:** ایجاد پرداخت کارت به کارت

**گام‌ها:**
1. بررسی Order
2. بررسی Payment های موجود (PENDING/UPLOADED)
3. Lock کردن Cart
4. ایجاد Payment جدید
5. ثبت Log

**Input:** `InitiateCardToCardDto`, `User`, `Request`  
**Output:** `Payment` با وضعیت `PENDING`

---

### 2️⃣ CardToCardUploadReceiptHandler
**مسئولیت:** آپلود رسید توسط کاربر

**گام‌ها:**
1. بررسی Payment
2. بروزرسانی اطلاعات رسید (عکس، شماره کارت، کد پیگیری)
3. تغییر وضعیت به `UPLOADED`
4. تغییر Order به `PAYMENT_CONFIRMATION_PENDING`
5. ثبت Log

**Input:** `UploadReceiptDto`, `receiptImageId`, `User`  
**Output:** `Payment` با وضعیت `UPLOADED`

---

### 3️⃣ CardToCardRejectionHandler
**مسئولیت:** رد رسید توسط ادمین

**گام‌ها:**
1. بررسی Payment
2. بروزرسانی Payment (`REJECTED`, `FAILED`)
3. ✅ **تغییر Order به `AWAITING_PAYMENT`** (مثل لغو کاربر!)
4. ✅ **Unlock کردن Cart** (کاربر می‌تونه دوباره تلاش کنه)
5. ثبت Log با دلیل رد

**Input:** `ReviewReceiptDto`, `admin`  
**Output:** `Payment` با وضعیت `REJECTED`

**⚠️ نکته مهم:** Order به `AWAITING_PAYMENT` می‌ره، **نه `REJECTED`**!

---

### 4️⃣ CardToCardApprovalHandler
**مسئولیت:** تایید رسید توسط ادمین

**گام‌ها:**
1. بررسی Payment و Order
2. کم کردن موجودی محصولات
3. افزایش شمارنده Promotion
4. تغییر Order به `PROCESSING`
5. بروزرسانی Payment (`APPROVED`, `SUCCESS`)
6. ✅ **Abandon کردن Cart**
7. ایجاد Invoice
8. ثبت Log

**Input:** `ReviewReceiptDto`, `admin`  
**Output:** `Payment` با وضعیت `APPROVED`

---

## 🔄 چرخه کامل:

```
1. کاربر Order می‌سازه
   ↓
   Order: START_ORDER
   Cart: LOCKED 🔒

2. کاربر پرداخت کارت به کارت رو انتخاب می‌کنه
   ↓
   Payment: PENDING
   Order: AWAITING_PAYMENT
   Cart: LOCKED 🔒

3. کاربر رسید آپلود می‌کنه
   ↓
   Payment: UPLOADED
   Order: PAYMENT_CONFIRMATION_PENDING
   Cart: LOCKED 🔒

4a. ادمین رد می‌کنه
    ↓
    Payment: REJECTED
    Order: AWAITING_PAYMENT ✅ (می‌تونه دوباره تلاش کنه!)
    Cart: OPEN 🔓
    
4b. ادمین تایید می‌کنه
    ↓
    Payment: APPROVED
    Order: PROCESSING
    Cart: ABANDONED (+ Cart جدید)
    Invoice: PAID
```

---

## ✅ منطق جدید (مثل دیجیکالا):

| سناریو | Order Status | Cart Status | می‌تونه دوباره تلاش کنه؟ |
|--------|-------------|-------------|----------------------|
| رسید رد شد | AWAITING_PAYMENT | OPEN | ✅ بله |
| 30 دقیقه گذشت | EXPIRED | OPEN | ❌ خیر (Order جدید) |
| رسید تایید شد | PROCESSING | ABANDONED | ❌ خیر (سفارش ثبت شد) |

---

## 🆚 قبل vs بعد:

### ❌ قبل (Service بزرگ):
```typescript
// card-to-card.service.ts - 400+ خط!
async initiate(...) { /* 80 خط */ }
async uploadReceipt(...) { /* 100 خط */ }
async reviewReceipt(...) { /* 200 خط */ }
```

### ✅ بعد (Handler Architecture):
```typescript
// card-to-card.service.ts - 40 خط!
async initiate(user, dto, req) {
  return runInTransaction(this.dataSource, async (manager) => {
    return this.initiationHandler.handle(manager, user, dto, req);
  });
}
```

**مزایا:**
- ✅ خوانایی بالاتر
- ✅ تست‌پذیری بهتر
- ✅ مسئولیت‌های جدا
- ✅ قابل استفاده مجدد

---

## 📊 مقایسه با Online Payment:

| ویژگی | Online Payment | Card-to-Card |
|-------|---------------|--------------|
| درگاه | Zarinpal | دستی |
| تایید | خودکار | ادمین |
| زمان | فوری | چند ساعت |
| Handler ها | 5 تا | 4 تا |
| Rejection | کاربر لغو کرد | ادمین رد کرد |
| منطق AWAITING_PAYMENT | ✅ | ✅ |

---

## 🧪 تست:

### تست 1: رد شدن رسید
```bash
1. Order بساز
2. پرداخت کارت به کارت
3. رسید آپلود کن
4. ادمین رد کنه
5. چک کن: Order.status = AWAITING_PAYMENT ✅
6. چک کن: Cart.status = OPEN ✅
7. دوباره رسید آپلود کن
8. باید کار کنه ✅
```

### تست 2: تایید رسید
```bash
1. Order بساز
2. پرداخت کارت به کارت
3. رسید آپلود کن
4. ادمین تایید کنه
5. چک کن: Order.status = PROCESSING ✅
6. چک کن: Cart.status = ABANDONED ✅
7. چک کن: Invoice ایجاد شده ✅
8. چک کن: موجودی کم شده ✅
```

---

## 📝 نکات مهم:

### 1. رد رسید ≠ لغو Order
```typescript
// ❌ اشتباه (قبل):
order.status = OrderStatus.REJECTED;

// ✅ درست (بعد):
order.status = OrderStatus.AWAITING_PAYMENT;
```

### 2. Unlock Cart بعد از رد
```typescript
// رد رسید → Unlock Cart
await this.cardStatusService.unlockCart(user.id, manager);
```

### 3. Abandon Cart بعد از تایید
```typescript
// تایید رسید → Abandon Cart
await this.cardStatusService.abandonCart(user.id, manager);
```

---

## ✅ خلاصه تغییرات:

1. ✅ **Service ساده شد:** 400+ خط → 40 خط
2. ✅ **4 Handler جدید:** هر کدوم یک مسئولیت
3. ✅ **منطق دیجیکالا:** رد رسید → AWAITING_PAYMENT
4. ✅ **Cart Management:** Unlock/Abandon درست
5. ✅ **Module آپدیت شد:** همه Handler ها register شدن

همه چی آماده‌س! 🚀
