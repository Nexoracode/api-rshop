# 🐛 تحلیل مشکل: سفارش جدید ثبت نمی‌شه

## وضعیت فعلی:

کاربر بعد از تکمیل سفارش اول (کارت به کارت + تایید ادمین)، نمی‌تونه سفارش دوم ثبت کنه.

## فلوی کارت به کارت:

```
1. createFromCard() → Order ساخته میشه
   Status: AWAITING_PAYMENT
   Cart: LOCKED ✅

2. initiate() → Payment ساخته میشه
   Card-to-Card Status: PENDING
   Order Status: AWAITING_PAYMENT (بدون تغییر)

3. uploadReceipt() → رسید آپلود میشه
   Card-to-Card Status: UPLOADED
   Order Status: PAYMENT_CONFIRMATION_PENDING ✅
   Cart: LOCKED ✅

4. reviewReceipt(APPROVED) → ادمین تایید می‌کنه
   Card-to-Card Status: APPROVED
   Payment Status: SUCCESS
   Order Status: PROCESSING ✅
   Cart: ABANDONED ✅
   
   ✅ موجودی کم میشه
   ✅ Promotion usage افزایش پیدا می‌کنه
   ✅ Invoice ساخته میشه
```

## حالا کاربر سفارش دوم می‌خواد ثبت کنه:

```
1. Cart جدید باز می‌کنه → محصول اضافه می‌کنه
   Cart Status: ABANDONED → OPEN ✅ (باید شه)

2. createFromCard() فراخوانی میشه
   
   چک existingOrder:
   - AWAITING_PAYMENT? ❌
   - PAYMENT_FAILED? ❌
   - PAYMENT_CONFIRMATION_PENDING? ❌
   
   سفارش قبلی PROCESSING است ✅
   پس existingOrder = null ✅
   
   باید سفارش جدید بسازه ✅
```

## ❓ پس مشکل کجاست؟

چند احتمال:

### 1️⃣ Cart ABANDONED نمی‌شه:
```typescript
// card-to-card.service.ts → reviewReceipt()
await this.cardStatusService.abandonCart(payment.user.id, manager);
```

اگه این کار نکنه، Cart هنوز LOCKED مونده → کاربر نمی‌تونه محصول اضافه کنه

### 2️⃣ سفارش قدیمی هنوز PAYMENT_CONFIRMATION_PENDING هست:
```typescript
// اگه order.status درست save نشده باشه:
order.status = OrderStatus.PROCESSING;
await manager.save(Order, order);
```

اگه این save نشه، existingOrder پیدا میشه و سفارش جدید ساخته نمیشه

### 3️⃣ Transaction rollback شده:
اگه بعد از `reviewReceipt` خطایی افتاده باشه، همه چی rollback شده

### 4️⃣ Payment duplicate:
```typescript
// card-to-card.service.ts → initiate()
const existingPayment = await manager.findOne(Payment, {
    where: {
        order: { id: order.id },
        paymentMethod: PaymentMethod.CARD_TO_CARD,
        cardToCardStatus: CardToCardStatus.PENDING,
    },
});

if (existingPayment) {
    return existingPayment; // ⚠️ همون قدیمی رو برمی‌گردونه
}
```

## ✅ راه حل:

باید چک کنیم:

1. **Cart Status** چیه؟ باید OPEN باشه
2. **Order Status** چیه؟ باید PROCESSING یا بالاتر باشه
3. **Payment** چند تا هست؟ باید فقط یکی APPROVED باشه

## 🔍 Debug:

لطفاً اینارو چک کن:

```sql
-- 1. چک کردن Cart Status
SELECT * FROM cards WHERE user_id = [USER_ID] ORDER BY created_at DESC LIMIT 2;

-- 2. چک کردن Order Status
SELECT id, status, created_at FROM orders WHERE user_id = [USER_ID] ORDER BY created_at DESC LIMIT 2;

-- 3. چک کردن Payment
SELECT id, order_id, payment_method, status, card_to_card_status, created_at 
FROM payments 
WHERE user_id = [USER_ID] 
ORDER BY created_at DESC LIMIT 5;
```

## 🎯 احتمال زیاد:

**Cart هنوز LOCKED یا ABANDONED است** و کاربر نمی‌تونه محصول جدید اضافه کنه!

باید `CardStatusService` رو چک کنم...
