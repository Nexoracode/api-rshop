# 🎯 User Profile API - Complete Implementation

## 📋 Overview
سیستم کامل پروفایل کاربری که شامل اطلاعات دقیق سفارشات، آمار خرید و خریدهای پرتکرار می‌باشد.

---

## 🔗 Endpoints Added

### 1️⃣ پروفایل کامل کاربر
```
GET /users/me/profile
```
**توضیحات:**
- اطلاعات کامل کاربر
- خلاصه وضعیت سفارشات (در انتظار پرداخت، در حال پردازش، تکمیل شده، مرجوعی، لغو شده)
- آمار کلی خرید (مجموع خرید، میانگین سفارش، تعداد سفارشات، تاریخ اولین و آخرین خرید)
- لیست 10 محصول پرتکرار
- تعداد آدرس‌های ثبت شده

**Response Structure:**
```typescript
{
  user: {
    id: number;
    firstName?: string;
    lastName?: string;
    phone: string;
    email?: string;
    avatarUrl?: string;
    isPhoneVerified: boolean;
    createdAt: Date;
  },
  orderSummary: {
    awaitingPayment: number;    // در انتظار پرداخت
    processing: number;          // در حال پردازش
    shipping: number;            // در حال ارسال
    completed: number;           // تکمیل شده
    returned: number;            // مرجوعی
    cancelled: number;           // لغو شده
    total: number;              // مجموع
  },
  statistics: {
    totalSpent: number;          // مجموع مبلغ خرید
    averageOrderValue: number;   // میانگین سفارش
    totalOrders: number;         // تعداد کل سفارشات
    firstOrderDate?: Date;       // اولین خرید
    lastOrderDate?: Date;        // آخرین خرید
  },
  frequentPurchases: [
    {
      productId: number;
      productName: string;
      productImage?: string;
      purchaseCount: number;     // تعداد خرید
      lastPurchaseDate: Date;    // آخرین خرید
      currentPrice: number;      // قیمت فعلی
      isAvailable: boolean;      // موجود بودن
    }
  ],
  addressCount: number;
}
```

---

### 2️⃣ سفارشات در انتظار پرداخت
```
GET /users/me/orders/awaiting-payment
```
**شامل وضعیت‌های:**
- `AWAITING_PAYMENT` - در انتظار پرداخت
- `PAYMENT_CONFIRMATION_PENDING` - در انتظار تایید پرداخت  
- `PENDING_APPROVAL` - در انتظار تایید

**Response:**
```json
{
  "message": "سفارشات در انتظار پرداخت با موفقیت دریافت شد.",
  "data": [
    {
      "id": 1,
      "status": "awaiting_payment",
      "total": 2500000,
      "items": [...],
      "address": {...},
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

### 3️⃣ سفارشات تکمیل شده
```
GET /users/me/orders/completed
```
**شامل وضعیت:**
- `DELIVERED` - تحویل داده شده

**Response:**
```json
{
  "message": "سفارشات تکمیل شده با موفقیت دریافت شد.",
  "data": [...]
}
```

---

### 4️⃣ سفارشات مرجوعی
```
GET /users/me/orders/returned
```
**شامل وضعیت‌های:**
- `REFUNDED` - بازپرداخت شده
- `NOT_DELIVERED` - تحویل داده نشده

**Response:**
```json
{
  "message": "سفارشات مرجوعی با موفقیت دریافت شد.",
  "data": [...]
}
```

---

### 5️⃣ سفارشات در حال پردازش
```
GET /users/me/orders/processing
```
**شامل وضعیت‌های:**
- `PROCESSING` - در حال پردازش
- `PREPARING` - در حال آماده‌سازی
- `SHIPPING` - در حال ارسال

**Response:**
```json
{
  "message": "سفارشات در حال پردازش با موفقیت دریافت شد.",
  "data": [...]
}
```

---

### 6️⃣ خریدهای پرتکرار
```
GET /users/me/frequent-purchases
```
**توضیحات:**
- لیست 10 محصولی که بیشترین خرید را داشته‌اند
- شامل قیمت فعلی و وضعیت موجودی
- مرتب شده بر اساس تعداد خرید (نزولی)

**Response:**
```json
{
  "message": "خریدهای پرتکرار با موفقیت دریافت شد.",
  "data": [
    {
      "productId": 15,
      "productName": "گوشی موبایل سامسونگ A54",
      "productImage": "https://...",
      "purchaseCount": 5,
      "lastPurchaseDate": "2025-01-10T08:00:00Z",
      "currentPrice": 15000000,
      "isAvailable": true
    }
  ]
}
```

---

### 7️⃣ آمار خرید کاربر
```
GET /users/me/statistics
```
**توضیحات:**
- مجموع مبلغ خریدهای موفق
- میانگین مبلغ هر سفارش
- تعداد کل سفارشات موفق
- تاریخ اولین و آخرین خرید

**Response:**
```json
{
  "message": "آمار خرید با موفقیت دریافت شد.",
  "data": {
    "totalSpent": 50000000,
    "averageOrderValue": 2500000,
    "totalOrders": 20,
    "firstOrderDate": "2024-01-15T10:30:00Z",
    "lastOrderDate": "2025-01-20T14:45:00Z"
  }
}
```

---

## 📊 Database Queries Optimization

### خلاصه سفارشات (Order Summary)
- فقط `id` و `status` را دریافت می‌کند
- بدون join - سریع‌ترین روش

### آمار کاربر (User Statistics)
- استفاده از `createQueryBuilder` با aggregate functions
- فقط سفارشات موفق (PROCESSING, PREPARING, SHIPPING, DELIVERED)
- یک query برای تمام آمار

### خریدهای پرتکرار (Frequent Purchases)
```sql
SELECT 
  product.id, 
  product.name, 
  product.price, 
  product.stock,
  product.isActive,
  media.url,
  COUNT(item.id) as purchaseCount,
  MAX(order.createdAt) as lastPurchaseDate
FROM order_items item
INNER JOIN orders order ON item.orderId = order.id
INNER JOIN products product ON item.productId = product.id
LEFT JOIN media ON product.mediaId = media.id
WHERE order.userId = :userId
  AND order.status IN ('processing', 'preparing', 'shipping', 'delivered')
GROUP BY product.id
ORDER BY purchaseCount DESC
LIMIT 10
```

### لیست سفارشات بر اساس وضعیت
- استفاده از `createQueryBuilder` با `IN` operator
- شامل join با items, product, variant, address
- شامل تصاویر محصولات و variants
- مرتب شده بر اساس `createdAt` (نزولی)

---

## 🔐 Security & Authentication

✅ همه endpoint ها نیاز به Authentication دارند
- `AccessGuard` - بررسی توکن JWT
- `RoleGuard` - بررسی نقش کاربر

✅ دسترسی فقط به اطلاعات خود کاربر
- استفاده از `req.user.sub` (userId از JWT)

---

## 📦 Files Created/Modified

### ✨ New Files:
1. `src/modules/user/dto/user-profile.dto.ts` - DTOs برای response های پروفایل
2. `src/modules/user/user-profile.service.ts` - سرویس اصلی پروفایل

### 🔧 Modified Files:
1. `src/modules/user/user.controller.ts` - اضافه شدن 7 endpoint جدید
2. `src/modules/user/user.module.ts` - ثبت UserProfileService و entities جدید

---

## 🎨 Frontend Usage Example

```typescript
// دریافت پروفایل کامل
const profile = await api.get('/users/me/profile');

// نمایش خلاصه سفارشات
<div>
  <Badge>{profile.orderSummary.awaitingPayment}</Badge> در انتظار پرداخت
  <Badge>{profile.orderSummary.processing}</Badge> در حال پردازش
  <Badge>{profile.orderSummary.completed}</Badge> تکمیل شده
</div>

// نمایش آمار
<div>
  مجموع خرید: {formatPrice(profile.statistics.totalSpent)}
  میانگین سفارش: {formatPrice(profile.statistics.averageOrderValue)}
</div>

// نمایش خریدهای پرتکرار
{profile.frequentPurchases.map(item => (
  <ProductCard 
    product={item}
    badge={`${item.purchaseCount}x خریداری شده`}
  />
))}

// دریافت سفارشات بر اساس وضعیت
const awaitingOrders = await api.get('/users/me/orders/awaiting-payment');
const completedOrders = await api.get('/users/me/orders/completed');
```

---

## 🎯 Use Cases

### 1. صفحه پروفایل کاربر
```
GET /users/me/profile
```
نمایش کامل اطلاعات، آمار و خلاصه سفارشات

### 2. تب سفارشات در پروفایل
```
GET /users/me/orders/awaiting-payment   → تب "در انتظار پرداخت"
GET /users/me/orders/processing          → تب "در حال پردازش"  
GET /users/me/orders/completed           → تب "تکمیل شده"
GET /users/me/orders/returned            → تب "مرجوعی"
```

### 3. بخش "خریدهای پرتکرار شما"
```
GET /users/me/frequent-purchases
```
پیشنهاد محصولات بر اساس خریدهای قبلی

### 4. داشبورد آمار
```
GET /users/me/statistics
```
نمایش آمار کلی خرید کاربر

---

## ✅ Testing Checklist

- [ ] تست پروفایل کامل با کاربر بدون سفارش
- [ ] تست پروفایل با کاربر با سفارشات مختلف
- [ ] تست خریدهای پرتکرار با محصولات غیرفعال
- [ ] تست آمار با سفارشات مختلف (موفق و ناموفق)
- [ ] تست filter سفارشات بر اساس وضعیت‌های مختلف
- [ ] تست performance با تعداد زیاد سفارشات
- [ ] تست authentication و authorization
- [ ] بررسی Swagger documentation

---

## 🚀 Performance Notes

✅ **Optimized Queries:**
- خلاصه سفارشات: فقط select دو فیلد (id, status)
- آمار: یک query با aggregate functions
- خریدهای پرتکرار: GROUP BY با LIMIT 10
- لیست سفارشات: eager loading برای relations

✅ **No N+1 Problems:**
- استفاده از `leftJoinAndSelect` برای relations
- یک query برای هر endpoint

⚠️ **Future Optimization:**
- اضافه کردن Redis cache برای پروفایل کامل (TTL: 5 دقیقه)
- اضافه کردن pagination برای لیست سفارشات
- اضافه کردن index بر روی `(userId, status)` در جدول orders

---

## 📝 Notes

1. **Order Status Grouping:**
   - Awaiting Payment: `AWAITING_PAYMENT`, `PAYMENT_CONFIRMATION_PENDING`, `PENDING_APPROVAL`
   - Processing: `PROCESSING`, `PREPARING`, `SHIPPING`
   - Completed: `DELIVERED`
   - Returned: `REFUNDED`, `NOT_DELIVERED`
   - Cancelled: `CANCELLED`, `EXPIRED`, `REJECTED`

2. **Frequent Purchases Logic:**
   - فقط سفارشات موفق در نظر گرفته می‌شوند
   - محصولات غیرفعال یا ناموجود با flag `isAvailable: false` مشخص می‌شوند
   - محدود به 10 محصول برتر

3. **Statistics Calculation:**
   - فقط سفارشات موفق (PROCESSING به بعد) شمارش می‌شوند
   - سفارشات لغو شده یا رد شده در آمار نیستند

---

## 🎉 Summary

سیستم پروفایل کاربری کامل با 7 endpoint جدید:
1. ✅ پروفایل کامل
2. ✅ سفارشات در انتظار پرداخت
3. ✅ سفارشات تکمیل شده  
4. ✅ سفارشات مرجوعی
5. ✅ سفارشات در حال پردازش
6. ✅ خریدهای پرتکرار
7. ✅ آمار خرید

همه query ها optimize شده و بدون مشکل N+1 هستند! 🚀
