# 🔄 جلوگیری از ساخت Payment های تکراری

## ❌ مشکل قبلی:

```
کاربر Order #123 می‌سازه
↓
کلیک "پرداخت آنلاین"
↓
Payment #1 ساخته می‌شه (IN_PROGRESS, Authority: A-xxxxx-xxxxx-xxxxx-xxxxxx-B)
Cart: LOCKED 🔒
Order: AWAITING_PAYMENT
↓
کاربر صفحه درگاه رو می‌بنده (پرداخت نمی‌کنه)
↓
Payment #1 همچنان IN_PROGRESS (معلق!)
↓
کاربر می‌ره پروفایل → "سفارشات در انتظار پرداخت"
کلیک "پرداخت کنید"
↓
Payment #2 ساخته می‌شه! (IN_PROGRESS, Authority: A-yyyyy-yyyyy-yyyyy-yyyyyy-B) ❌
Cart: همچنان LOCKED 🔒
↓
نتیجه:
- Order #123
  ├─ Payment #1 (IN_PROGRESS, معلق)
  └─ Payment #2 (IN_PROGRESS, معلق) ❌ تکراری!
```

**مشکلات:**
1. Payment های تکراری برای یک Order
2. اتلاف منابع (Request به Zarinpal)
3. گیج شدن در Callback (کدوم Authority رو verify کنیم?)
4. مشکل در گزارش‌گیری

---

## ✅ راه‌حل:

قبل از ساختن Payment جدید، چک کن Payment معلق داری یا نه!

```typescript
// ✅ در PaymentCreationHandler

// 1️⃣ چک کردن Payment معلق
const existingPayment = await paymentRepo.findOne({
  where: {
    order: { id: order.id },
    status: PaymentStatus.IN_PROGRESS,
    gateway: PaymentGateway.ZARINPAL,
  },
  order: { createdAt: 'DESC' }, // آخرین Payment
});

// 2️⃣ اگه وجود داره، همون رو برگردون
if (existingPayment) {
  this.logger.debug(
    `Returning existing IN_PROGRESS payment ${existingPayment.id} for order ${orderId}`
  );
  
  return PaymentResponseMapper.createPayment(order, existingPayment.authority);
}

// 3️⃣ اگه نداره، ادامه بده و Payment جدید بساز...
```

---

## 🎯 چرخه جدید:

```
کاربر Order #123 می‌سازه
↓
کلیک "پرداخت آنلاین"
↓
چک: Payment معلق داره؟ → خیر
↓
Payment #1 ساخته می‌شه (IN_PROGRESS, Authority: A-xxxxx)
↓
کاربر صفحه رو می‌بنده
↓
Payment #1 همچنان IN_PROGRESS
↓
کاربر دوباره کلیک "پرداخت کنید"
↓
چک: Payment معلق داره؟ → بله! Payment #1 ✅
↓
برگرداندن همون Payment #1 با همون Authority
↓
نتیجه:
- Order #123
  └─ Payment #1 (IN_PROGRESS) ✅ فقط یکی!
```

---

## 📊 مقایسه:

| سناریو | قبل | بعد |
|--------|-----|-----|
| کاربر 1 بار "پرداخت" بزنه | 1 Payment | 1 Payment ✅ |
| کاربر 3 بار "پرداخت" بزنه | 3 Payment ❌ | 1 Payment ✅ |
| Request به Zarinpal | 3 بار ❌ | 1 بار ✅ |
| Authority تکراری | دارد ❌ | ندارد ✅ |
| Database rows | 3 ❌ | 1 ✅ |

---

## 🔍 جزئیات پیاده‌سازی:

### Query برای پیدا کردن Payment معلق:

```typescript
const existingPayment = await paymentRepo.findOne({
  where: {
    order: { id: order.id },           // ✅ همون Order
    status: PaymentStatus.IN_PROGRESS, // ✅ فقط معلق‌ها
    gateway: PaymentGateway.ZARINPAL,  // ✅ فقط آنلاین
  },
  order: { createdAt: 'DESC' },        // ✅ جدیدترین
});
```

**معادل SQL:**
```sql
SELECT *
FROM payments
WHERE order_id = 123
  AND status = 'IN_PROGRESS'
  AND gateway = 'ZARINPAL'
ORDER BY created_at DESC
LIMIT 1;
```

---

## 🎨 سناریوهای مختلف:

### سناریو 1: اولین بار پرداخت
```
Request: POST /payment/create
Body: { orderId: 123 }

چک: Payment معلق؟ → خیر
↓
Zarinpal Request → Authority: A-xxxxx
↓
Payment ایجاد می‌شه
↓
Response: { authority: 'A-xxxxx', url: 'https://...' }
```

### سناریو 2: دومین بار پرداخت (Payment معلق)
```
Request: POST /payment/create
Body: { orderId: 123 }

چک: Payment معلق؟ → بله! Payment #1
↓
❌ Zarinpal Request نمی‌زنه (صرفه‌جویی!)
↓
✅ برگرداندن همون Authority قبلی
↓
Response: { authority: 'A-xxxxx', url: 'https://...' }
```

### سناریو 3: پرداخت شکست خورده
```
Request: POST /payment/create
Body: { orderId: 123 }

چک: Payment معلق؟ → خیر (Payment قبلی FAILED بود)
↓
Zarinpal Request جدید → Authority: A-yyyyy
↓
Payment جدید ایجاد می‌شه
↓
Response: { authority: 'A-yyyyy', url: 'https://...' }
```

---

## 🧪 تست:

### تست 1: تک Request
```bash
POST /api/payment/create
Body: { orderId: 123 }

# Database بعد:
# payments table:
# | id | order_id | status      | authority |
# |----|----------|-------------|-----------|
# | 1  | 123      | IN_PROGRESS | A-xxxxx   |

# ✅ فقط 1 Payment
```

### تست 2: سه Request پشت سر هم (قبل)
```bash
POST /api/payment/create { orderId: 123 }
POST /api/payment/create { orderId: 123 }
POST /api/payment/create { orderId: 123 }

# Database قبل:
# | id | order_id | status      | authority |
# |----|----------|-------------|-----------|
# | 1  | 123      | IN_PROGRESS | A-xxxxx   |
# | 2  | 123      | IN_PROGRESS | A-yyyyy   | ❌
# | 3  | 123      | IN_PROGRESS | A-zzzzz   | ❌

# ❌ 3 تا Payment تکراری!
```

### تست 3: سه Request پشت سر هم (بعد)
```bash
POST /api/payment/create { orderId: 123 }
POST /api/payment/create { orderId: 123 }
POST /api/payment/create { orderId: 123 }

# Database بعد:
# | id | order_id | status      | authority |
# |----|----------|-------------|-----------|
# | 1  | 123      | IN_PROGRESS | A-xxxxx   |

# ✅ فقط 1 Payment (همون اولی!)
# Response سه تا همه یکسان: { authority: 'A-xxxxx' }
```

---

## 🔧 Edge Cases:

### 1. دو Payment با وضعیت‌های مختلف:
```
Payment #1: FAILED
Payment #2: IN_PROGRESS
```
→ برمی‌گردونه Payment #2 (فقط IN_PROGRESS رو چک می‌کنه) ✅

### 2. Payment قدیمی (30 دقیقه گذشته):
```
Payment #1: IN_PROGRESS (created 31 minutes ago)
```
→ باید توسط Cron Job به EXPIRED تبدیل بشه
→ بعد از EXPIRED شدن، Payment جدید ساخته می‌شه ✅

### 3. دو روش پرداخت (Online + Card-to-Card):
```
Payment #1: ZARINPAL, IN_PROGRESS
Payment #2: CARD_TO_CARD, PENDING
```
→ هر کدوم مستقل هستن (gateway مختلف) ✅

---

## 📝 نکات مهم:

### 1. Card-to-Card هم همین منطق رو داره:
```typescript
// در CardToCardInitiationHandler

// بررسی Payment PENDING
const existingPayment = await paymentRepo.findOne({
  where: {
    order: { id: order.id },
    paymentMethod: PaymentMethod.CARD_TO_CARD,
    cardToCardStatus: CardToCardStatus.PENDING,
  },
});

if (existingPayment) {
  return existingPayment; // ✅ برگرداندن همون
}

// بررسی Payment UPLOADED
const uploadedPayment = await paymentRepo.findOne({
  where: {
    order: { id: order.id },
    paymentMethod: PaymentMethod.CARD_TO_CARD,
    cardToCardStatus: CardToCardStatus.UPLOADED,
  },
});

if (uploadedPayment) {
  return uploadedPayment; // ✅ برگرداندن همون
}
```

### 2. چرا `order: { createdAt: 'DESC' }`؟
برای اینکه اگه به هر دلیلی چندتا Payment معلق داشتیم، جدیدترین رو برگردونه.

### 3. چرا فقط `IN_PROGRESS`؟
چون:
- `FAILED` → می‌تونه دوباره تلاش کنه (Payment جدید)
- `CANCELLED` → می‌تونه دوباره تلاش کنه (Payment جدید)
- `SUCCESS` → نباید بتونه دوباره پرداخت کنه (Order نباید AWAITING_PAYMENT باشه)

---

## ✅ خلاصه:

1. ✅ **چک Payment معلق** → قبل از ساختن Payment جدید
2. ✅ **برگرداندن همون Payment** → اگه IN_PROGRESS داره
3. ✅ **صرفه‌جویی منابع** → کمتر Request به Zarinpal
4. ✅ **Database تمیز** → نه Payment تکراری

همه چی حل شد! 🚀
