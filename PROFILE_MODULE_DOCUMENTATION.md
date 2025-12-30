# 🎯 Profile Module - Complete Implementation

## 📋 Overview
سیستم کامل پروفایل کاربری که در ماژول `profile` پیاده‌سازی شده و شامل:
- اطلاعات کلی پروفایل (Overview) - قبلاً موجود بود
- اطلاعات جزئی و کامل پروفایل (Detailed)
- سفارشات به تفکیک وضعیت
- خریدهای پرتکرار
- آمار خرید

---

## 🔗 API Endpoints

### Base URL: `/profile`

---

### 1️⃣ Overview - اطلاعات کلی (قبلی)
```
GET /profile
```
**توضیحات:**
- اطلاعات کلی کاربر
- تعداد نظرات، علاقه‌مندی‌ها، بازدیدهای اخیر، تیکت‌ها، سفارشات
- 3 آیتم آخر از هر بخش

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "محمد رضایی",
    "email": "user@example.com",
    "phone": "09123456789"
  },
  "stats": {
    "reviews": 5,
    "wishlist": 10,
    "recentViews": 15,
    "supports": 2,
    "orders": 20
  },
  "latest": {
    "reviews": [...],
    "wishlist": [...],
    "recentViews": [...],
    "supports": [...],
    "orders": [...]
  }
}
```

---

### 2️⃣ Detailed Profile - پروفایل کامل و جزئی (جدید)
```
GET /profile/detailed
```
**توضیحات:**
- اطلاعات کامل کاربر
- خلاصه وضعیت سفارشات (در انتظار پرداخت، در حال پردازش، تکمیل شده، مرجوعی، لغو شده)
- آمار کلی خرید (مجموع خرید، میانگین سفارش، تعداد سفارشات، تاریخ اولین و آخرین خرید)
- لیست 10 محصول پرتکرار
- تعداد آدرس‌ها، نظرات و علاقه‌مندی‌ها

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
  reviewCount: number;
  wishlistCount: number;
}
```

---

### 3️⃣ سفارشات در انتظار پرداخت
```
GET /profile/orders/awaiting-payment
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

### 4️⃣ سفارشات تکمیل شده
```
GET /profile/orders/completed
```
**شامل وضعیت:**
- `DELIVERED` - تحویل داده شده

---

### 5️⃣ سفارشات مرجوعی
```
GET /profile/orders/returned
```
**شامل وضعیت‌های:**
- `REFUNDED` - بازپرداخت شده
- `NOT_DELIVERED` - تحویل داده نشده

---

### 6️⃣ سفارشات در حال پردازش
```
GET /profile/orders/processing
```
**شامل وضعیت‌های:**
- `PROCESSING` - در حال پردازش
- `PREPARING` - در حال آماده‌سازی
- `SHIPPING` - در حال ارسال

---

### 7️⃣ خریدهای پرتکرار
```
GET /profile/frequent-purchases
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

### 8️⃣ آمار خرید کاربر
```
GET /profile/statistics
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

## 📦 Files Structure

```
src/modules/profile/
├── dto/
│   ├── create-profile.dto.ts         (قبلی)
│   ├── update-profile.dto.ts         (قبلی)
│   └── profile-detailed.dto.ts       (جدید) ✨
├── profile.controller.ts              (آپدیت شده) 🔧
├── profile.service.ts                 (آپدیت شده) 🔧
└── profile.module.ts                  (آپدیت شده) 🔧
```

### ✨ فایل‌های جدید:
- `dto/profile-detailed.dto.ts` - DTOهای جدید

### 🔧 فایل‌های ویرایش شده:
- `profile.controller.ts` - اضافه شدن 7 endpoint جدید
- `profile.service.ts` - اضافه شدن متدهای جدید
- `profile.module.ts` - import کردن Order و OrderItem

---

## 🔐 Security & Authentication

✅ همه endpoint‌ها نیاز به Authentication دارند
- `AccessGuard` - بررسی توکن JWT
- `@CurrentUser()` decorator برای دریافت اطلاعات کاربر

✅ دسترسی فقط به اطلاعات خود کاربر
- استفاده از `user.id` از JWT token

---

## 📊 Database Optimization

### Query Optimization:

1. **Order Summary** (خلاصه سفارشات):
   ```typescript
   // فقط id و status را select می‌کند
   select: ['id', 'status']
   // سریع‌ترین روش - بدون join
   ```

2. **User Statistics** (آمار):
   ```sql
   SELECT 
     COUNT(order.id) as totalOrders,
     COALESCE(SUM(order.total), 0) as totalSpent,
     COALESCE(AVG(order.total), 0) as averageOrderValue,
     MIN(order.createdAt) as firstOrderDate,
     MAX(order.createdAt) as lastOrderDate
   FROM orders
   WHERE userId = :userId
     AND status IN ('processing', 'preparing', 'shipping', 'delivered')
   ```

3. **Frequent Purchases** (خریدهای پرتکرار):
   ```sql
   SELECT 
     product.id,
     product.name,
     COUNT(item.id) as purchaseCount,
     MAX(order.createdAt) as lastPurchaseDate
   FROM order_items item
   INNER JOIN orders order ON item.orderId = order.id
   INNER JOIN products product ON item.productId = product.id
   WHERE order.userId = :userId
     AND order.status IN (...)
   GROUP BY product.id
   ORDER BY purchaseCount DESC
   LIMIT 10
   ```

4. **Orders by Status** (سفارشات بر اساس وضعیت):
   ```typescript
   // استفاده از createQueryBuilder با eager loading
   // بدون N+1 problem
   leftJoinAndSelect('order.items', 'items')
   leftJoinAndSelect('items.product', 'product')
   leftJoinAndSelect('items.variant', 'variant')
   leftJoinAndSelect('product.media', 'productMedia')
   ```

---

## 🎨 Frontend Integration

### React/Next.js Example:

```typescript
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/services/api';

// استفاده از Overview (صفحه اصلی پروفایل)
const ProfilePage = () => {
  const { data: overview } = useQuery({
    queryKey: ['profile', 'overview'],
    queryFn: () => profileApi.getOverview(),
  });

  return (
    <div>
      <h1>سلام {overview.user.name}</h1>
      <Stats data={overview.stats} />
      <LatestItems data={overview.latest} />
    </div>
  );
};

// استفاده از Detailed (صفحه داشبورد کامل)
const DashboardPage = () => {
  const { data: profile } = useQuery({
    queryKey: ['profile', 'detailed'],
    queryFn: () => profileApi.getDetailed(),
  });

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* خلاصه سفارشات */}
      <OrderSummaryCard summary={profile.orderSummary} />
      
      {/* آمار خرید */}
      <StatisticsCard stats={profile.statistics} />
      
      {/* خریدهای پرتکرار */}
      <FrequentPurchases items={profile.frequentPurchases} />
    </div>
  );
};

// استفاده از Orders Tabs
const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState('awaiting');
  
  const { data: orders } = useQuery({
    queryKey: ['profile', 'orders', activeTab],
    queryFn: () => {
      switch(activeTab) {
        case 'awaiting': return profileApi.getAwaitingPaymentOrders();
        case 'processing': return profileApi.getProcessingOrders();
        case 'completed': return profileApi.getCompletedOrders();
        case 'returned': return profileApi.getReturnedOrders();
      }
    },
  });

  return (
    <Tabs value={activeTab} onChange={setActiveTab}>
      <Tab value="awaiting">در انتظار پرداخت</Tab>
      <Tab value="processing">در حال پردازش</Tab>
      <Tab value="completed">تکمیل شده</Tab>
      <Tab value="returned">مرجوعی</Tab>
    </Tabs>
  );
};
```

---

## 🎯 Use Cases

### 1. صفحه اصلی پروفایل (Overview)
```
GET /profile
```
- نمایش سریع و کلی
- آخرین فعالیت‌ها
- مناسب برای صفحه اصلی پروفایل

### 2. داشبورد کامل کاربری (Detailed)
```
GET /profile/detailed
```
- نمایش کامل آمار و اطلاعات
- خلاصه سفارشات در یک نگاه
- خریدهای پرتکرار برای پیشنهاد سریع

### 3. مدیریت سفارشات
```
GET /profile/orders/awaiting-payment   → سفارشات پرداخت نشده
GET /profile/orders/processing          → سفارشات در حال آماده‌سازی
GET /profile/orders/completed           → تاریخچه خرید
GET /profile/orders/returned            → مرجوعی‌ها
```

### 4. پیشنهادات هوشمند
```
GET /profile/frequent-purchases
```
- نمایش محصولاتی که کاربر معمولاً می‌خرد
- دکمه "خرید مجدد سریع"
- یادآوری محصولات تمام شده

---

## 🆚 تفاوت Overview vs Detailed

| ویژگی | Overview (GET /profile) | Detailed (GET /profile/detailed) |
|------|------------------------|----------------------------------|
| **سرعت** | سریع‌تر | کمی کندتر (queries بیشتر) |
| **جزئیات سفارشات** | فقط تعداد | خلاصه به تفکیک وضعیت |
| **آمار مالی** | ❌ ندارد | ✅ دارد (مجموع، میانگین) |
| **خریدهای پرتکرار** | ❌ ندارد | ✅ دارد (10 محصول) |
| **Latest Items** | ✅ دارد (3 آیتم) | ❌ ندارد |
| **Use Case** | صفحه اصلی پروفایل | داشبورد کامل/آماری |

---

## ✅ Testing Checklist

- [ ] تست Overview با کاربر جدید (بدون داده)
- [ ] تست Detailed با کاربر قدیمی (با داده‌های زیاد)
- [ ] تست سفارشات بر اساس هر وضعیت
- [ ] تست خریدهای پرتکرار با محصولات حذف شده
- [ ] تست آمار با سفارشات مختلف (موفق/ناموفق)
- [ ] تست performance با 1000+ سفارش
- [ ] تست Authentication (بدون token)
- [ ] بررسی Swagger documentation

---

## 🚀 Performance Tips

✅ **Caching Strategy** (آینده):
```typescript
// می‌تونی Redis cache اضافه کنی
@Cacheable('profile:overview', 300) // 5 دقیقه
async getProfileOverview(userId: number) { ... }

@Cacheable('profile:detailed', 300) // 5 دقیقه
async getDetailedProfile(userId: number) { ... }

@Cacheable('profile:stats', 600) // 10 دقیقه
async getUserStatistics(userId: number) { ... }
```

✅ **Pagination** (آینده):
```typescript
// برای لیست سفارشات pagination اضافه کن
async getOrdersByStatus(userId, status, page = 1, limit = 20) {
  return this.orderRepo
    .createQueryBuilder('order')
    // ...
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();
}
```

---

## 📝 Migration Notes

### اگر قبلاً از User module استفاده می‌کردی:

```diff
- GET /users/me/profile           → GET /profile/detailed
- GET /users/me/orders/...        → GET /profile/orders/...
- GET /users/me/frequent-purchases → GET /profile/frequent-purchases
- GET /users/me/statistics        → GET /profile/statistics
```

### Frontend Changes:
```typescript
// Before
await api.get('/users/me/profile');

// After  
await api.get('/profile/detailed');
```

---

## 🎉 Summary

✅ **8 Endpoint در ماژول Profile:**
1. `GET /profile` - Overview (قبلی)
2. `GET /profile/detailed` - جزئیات کامل (جدید)
3. `GET /profile/orders/awaiting-payment` (جدید)
4. `GET /profile/orders/completed` (جدید)
5. `GET /profile/orders/returned` (جدید)
6. `GET /profile/orders/processing` (جدید)
7. `GET /profile/frequent-purchases` (جدید)
8. `GET /profile/statistics` (جدید)

✅ **Optimized Queries** - بدون N+1
✅ **Clean Architecture** - در ماژول مناسب
✅ **Complete DTOs** - با Swagger docs
✅ **Flexible & Scalable** - آماده برای توسعه

همه چیز در جای درست خودش! 🚀
