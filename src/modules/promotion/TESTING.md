# 🧪 Promotion Module - Testing Guide

## راهنمای تست سریع

این فایل برای تست سریع بهبودهای اعمال شده در ماژول Promotion است.

---

## ✅ Checklist تست‌ها

### 1. بررسی اولیه

- [ ] سرور بدون خطا اجرا می‌شود
- [ ] تمام Environment Variables تنظیم شده
- [ ] Redis در حال اجراست (برای Cache)
- [ ] Database به‌روز است

```bash
# اجرای سرور
npm run start:dev

# بررسی Log ها
# باید پیام‌های زیر را ببینید:
# ✅ "Nest application successfully started"
# ✅ بدون هیچ Error قرمزی
```

---

### 2. تست API Endpoints

#### 2.1 ایجاد پروموشن جدید

```bash
POST http://localhost:3001/api/admin/promotions
Content-Type: application/json

{
  "name": "تست تخفیف 10 درصد",
  "type": "coupon",
  "code": "TEST10",
  "starts_at": "2025-01-01T00:00:00.000Z",
  "ends_at": "2025-12-31T23:59:59.000Z",
  "usage_limit": 100,
  "is_active": true,
  "conditions": [
    {
      "type": "min_order_amount",
      "min_amount": 100000
    }
  ],
  "actions": [
    {
      "type": "percent_discount",
      "value": 10
    }
  ]
}
```

**انتظار**:
- ✅ Status Code: 201
- ✅ Response حاوی promotion با ID
- ✅ Log: "Created promotion: ID=X, Name=تست تخفیف 10 درصد"

---

#### 2.2 لیست پروموشن‌ها

```bash
GET http://localhost:3001/api/admin/promotions?page=1&limit=10
```

**انتظار**:
- ✅ Status Code: 200
- ✅ Response حاوی items, meta, links
- ✅ هیچ N+1 Query در Log نباشد
- ✅ زمان پاسخ < 100ms (با Cache)

---

#### 2.3 دریافت جزئیات پروموشن

```bash
GET http://localhost:3001/api/admin/promotions/1
```

**انتظار**:
- ✅ Status Code: 200
- ✅ Response حاوی conditions و actions کامل
- ✅ در دفعه دوم، از Cache برگردد (سریع‌تر)
- ✅ Log: "Cache hit for promotion ID: 1" (دفعه دوم)

---

#### 2.4 بررسی تخفیف

```bash
POST http://localhost:3001/api/promotions/check
Content-Type: application/json

{
  "user_id": 1,
  "code": "TEST10",
  "subtotal": 150000,
  "is_first_order": false,
  "items": [
    {
      "product_id": 1,
      "category_id": 1,
      "quantity": 1,
      "unit_price": 150000
    }
  ]
}
```

**انتظار**:
- ✅ Status Code: 200
- ✅ `discount: 15000` (10% از 150000)
- ✅ `applied_promotions` حاوی promotion
- ✅ Log: "Applied promotion TEST10"

---

#### 2.5 تست Error Handling

**تست 1: کد تخفیف نامعتبر**
```bash
POST http://localhost:3001/api/promotions/check
Content-Type: application/json

{
  "user_id": 1,
  "code": "INVALID_CODE",
  "subtotal": 150000,
  "is_first_order": false,
  "items": [...]
}
```

**انتظار**:
- ✅ Status Code: 404
- ✅ Error Message: "پروموشن با شناسه 'INVALID_CODE' یافت نشد"
- ✅ `error: "PROMOTION_NOT_FOUND"`

**تست 2: شرایط برآورده نشده**
```bash
# با subtotal کمتر از min_amount
{
  "code": "TEST10",
  "subtotal": 50000,  // کمتر از 100000
  ...
}
```

**انتظار**:
- ✅ Status Code: 200
- ✅ `discount: 0`
- ✅ `applied_promotions: []`
- ✅ Log: "condition failed: Order subtotal less than min amount"

---

### 3. تست Cache

#### 3.1 بررسی Cache Hit

```bash
# دفعه اول
GET http://localhost:3001/api/admin/promotions/1
# زمان: ~50ms
# Log: بدون "Cache hit"

# دفعه دوم (بلافاصله)
GET http://localhost:3001/api/admin/promotions/1
# زمان: ~5ms
# Log: "Cache hit for promotion ID: 1"
```

#### 3.2 بررسی Cache Invalidation

```bash
# Update promotion
PUT http://localhost:3001/api/admin/promotions/1
{...}

# سپس دریافت مجدد
GET http://localhost:3001/api/admin/promotions/1
# باید از DB بخواند (Cache invalidate شده)
# Log: بدون "Cache hit"
```

---

### 4. تست Logging

در Log ها باید موارد زیر را ببینید:

```
✅ [PromotionRepositoryImpl] Loading details: X products, Y categories, Z users
✅ [PromotionValidatorService] Promotion 1 (TEST10) is valid for user 123
✅ [PromotionEngineService] Applying 1 promotion(s) for user 123
✅ [PromotionEngineService] Applied 10% discount from promotion TEST10
✅ [CreatePromotionUseCase] Successfully created promotion: ID=1
```

---

### 5. تست Performance

#### 5.1 بدون Cache (اولین بار)

```bash
GET /api/admin/promotions?page=1&limit=20
```

**انتظار**:
- زمان: 50-100ms
- Query Count: 4 (1 برای promotions + 3 برای products/categories/users)

#### 5.2 با Cache (بار دوم)

```bash
# همان درخواست
GET /api/admin/promotions?page=1&limit=20
```

**انتظار**:
- زمان: 10-20ms (5x سریع‌تر)
- هیچ query اضافی به DB نزند

---

### 6. تست Integration با Payment

#### 6.1 ایجاد سفارش با تخفیف

1. یک سفارش با promotion ایجاد کنید
2. پرداخت را انجام دهید
3. بررسی کنید `usedCount` افزایش پیدا کرده

```bash
# قبل از پرداخت
GET /api/admin/promotions/1
# used_count: 5

# پرداخت موفق...

# بعد از پرداخت
GET /api/admin/promotions/1
# used_count: 6 ✅
```

**Log انتظاری**:
```
[PaymentService] Payment verified successfully for order X
[IncrementPromotionUsageUseCase] Incrementing usage count for promotion: 1
[PromotionRepositoryImpl] Incremented usage count for promotion: 1
```

---

### 7. تست Edge Cases

#### 7.1 تخفیف بیشتر از مبلغ سفارش

```bash
POST /api/promotions/check
{
  "code": "MEGA100",  // 100% discount
  "subtotal": 100000,
  ...
}
```

**انتظار**:
- ✅ `discount: 100000` (نه بیشتر!)
- ✅ Log: "Capping discount at subtotal"

#### 7.2 پروموشن منقضی شده

```bash
POST /api/promotions/check
{
  "code": "EXPIRED_CODE",
  ...
}
```

**انتظار**:
- ✅ Status: 400
- ✅ Error: "کد تخفیف 'EXPIRED_CODE' منقضی شده است"

#### 7.3 محدودیت استفاده

```bash
# اگر usageLimit = 100 و usedCount = 100
POST /api/promotions/check
{
  "code": "FULL_CODE",
  ...
}
```

**انتظار**:
- ✅ Status: 400
- ✅ Error: "کد تخفیف 'FULL_CODE' به حد مجاز استفاده رسیده است"

---

### 8. تست Concurrent Requests

```bash
# ارسال همزمان 10 درخواست
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/promotions/check \
    -H "Content-Type: application/json" \
    -d '{...}' &
done
wait
```

**انتظار**:
- ✅ همه درخواست‌ها موفق
- ✅ بدون Race Condition
- ✅ Cache به درستی کار می‌کند

---

## 📊 Monitoring Checklist

در Production باید موارد زیر را Monitor کنید:

- [ ] Cache Hit Rate > 70%
- [ ] Average Response Time < 100ms
- [ ] Error Rate < 1%
- [ ] Promotion Usage Count به‌روز می‌شود
- [ ] Log ها بدون Error قرمز

---

## 🐛 Debug Guide

### مشکل: Cache کار نمی‌کند

**بررسی**:
```bash
# Redis در حال اجراست؟
redis-cli ping
# باید PONG برگردد

# Environment Variable تنظیم شده؟
echo $PROMOTION_CACHE_ENABLED
# باید true باشد
```

### مشکل: N+1 Query

**بررسی Log**:
```
# اگر این پیام را می‌بینید، مشکلی نیست:
✅ Loading details: 5 products, 2 categories, 1 users

# اگر این را می‌بینید، مشکل است:
❌ (query repeated 10 times)
```

### مشکل: Usage Count افزایش نمی‌یابد

**بررسی**:
1. Payment Module، Promotion Module را import کرده؟
2. `IncrementPromotionUsageUseCase` در PaymentService inject شده؟
3. Log ها چه می‌گویند؟

```bash
# باید این Log را ببینید:
✅ [IncrementPromotionUsageUseCase] Successfully incremented usage count
```

---

## ✅ Success Criteria

بهبودها موفق بوده اگر:

✅ **تمام API ها بدون خطا کار کنند**
✅ **Performance بهبود یافته باشد** (Response Time < 100ms)
✅ **Cache به درستی کار کند** (Hit Rate > 70%)
✅ **Error Handling مناسب باشد** (پیام‌های واضح)
✅ **Logging جامع باشد** (تمام عملیات log شوند)
✅ **Usage Count درست به‌روز شود** (بعد از هر پرداخت)

---

## 📞 پشتیبانی

اگر مشکلی پیش آمد:

1. Log ها را بررسی کنید
2. Environment Variables را چک کنید
3. Database و Redis را بررسی کنید
4. README.md را مطالعه کنید

---

**موفق باشید!** 🚀
