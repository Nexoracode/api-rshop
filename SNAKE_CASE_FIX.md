# 🔧 Snake Case Database Fields Fix

## مشکل
تمام فیلدهای دیتابیس به صورت `snake_case` هستند اما در query builder از `camelCase` استفاده می‌شد.

## تغییرات انجام شده

### 1️⃣ getUserStatistics()
```typescript
// ❌ Before
.addSelect('MIN(order.createdAt)', 'firstOrderDate')
.addSelect('MAX(order.createdAt)', 'lastOrderDate')
.where('order.userId = :userId', { userId })

// ✅ After
.addSelect('MIN(order.created_at)', 'firstOrderDate')
.addSelect('MAX(order.created_at)', 'lastOrderDate')
.where('order.user_id = :userId', { userId })
```

### 2️⃣ getFrequentPurchases()
```typescript
// ❌ Before
.addSelect('product.isActive', 'isActive')
.addSelect('MAX(order.createdAt)', 'lastPurchaseDate')
.where('order.userId = :userId', { userId })
.addGroupBy('product.isActive')
.leftJoin('medias', 'media', 'media.product_id = product.id AND media.is_pinned = true')

// ✅ After
.addSelect('product.is_active', 'isActive')
.addSelect('MAX(order.created_at)', 'lastPurchaseDate')
.where('order.user_id = :userId', { userId })
.addGroupBy('product.is_active')
.leftJoin('medias', 'media', 'media.id = product.media_pinned_id')
```

**نکته مهم:** تغییر join برای media:
- قبلاً: `media.is_pinned = true` که فیلد `is_pinned` وجود ندارد
- الان: `media.id = product.media_pinned_id` که از فیلد `mediaPinnedId` در Product استفاده می‌کند

### 3️⃣ getOrdersByStatus()
```typescript
// ❌ Before
.where('order.userId = :userId', { userId })
.orderBy('order.createdAt', 'DESC')

// ✅ After
.where('order.user_id = :userId', { userId })
.orderBy('order.created_at', 'DESC')
```

## نکات مهم

### 🔍 چرا این مهمه؟
TypeORM در `createQueryBuilder` با Raw SQL کار می‌کند:
- Entity properties → `camelCase` (TypeScript)
- Database columns → `snake_case` (MySQL)
- در query builder باید از نام واقعی ستون استفاده کنیم

### 📊 تفاوت find() vs QueryBuilder

```typescript
// ✅ find() - می‌تونی از camelCase استفاده کنی
await repo.find({
  where: { userId: 1 },
  order: { createdAt: 'DESC' }
});

// ⚠️ QueryBuilder - باید snake_case باشه
await repo
  .createQueryBuilder('order')
  .where('order.user_id = :userId', { userId: 1 })
  .orderBy('order.created_at', 'DESC');
```

### 🎯 فیلدهای رایج که تغییر کردند

| Entity Field (camelCase) | Database Column (snake_case) |
|-------------------------|----------------------------|
| `userId` | `user_id` |
| `productId` | `product_id` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |
| `isActive` | `is_active` |
| `mediaPinnedId` | `media_pinned_id` |
| `categoryId` | `category_id` |
| `brandId` | `brand_id` |

## Media Join Strategy

### قبلی (اشتباه):
```sql
LEFT JOIN medias media 
  ON media.product_id = product.id 
  AND media.is_pinned = true  -- ❌ این فیلد وجود ندارد
```

### فعلی (درست):
```sql
LEFT JOIN medias media 
  ON media.id = product.media_pinned_id  -- ✅ استفاده از relation
```

### چرا این روش بهتره؟
- `Product` entity دارای `mediaPinnedId` است
- این FK به تصویر اصلی/انتخاب شده محصول اشاره می‌کند
- نیازی به شرط اضافی نیست
- یک query ساده‌تر و سریع‌تر

## تست

بعد از این تغییرات، همه endpoint ها باید کار کنند:

```bash
✅ GET /profile/detailed
✅ GET /profile/frequent-purchases
✅ GET /profile/statistics
✅ GET /profile/orders/awaiting-payment
✅ GET /profile/orders/completed
✅ GET /profile/orders/returned
✅ GET /profile/orders/processing
```

## پیشنهاد برای آینده

### استفاده از TypeORM Naming Strategy
می‌تونی یک custom naming strategy تعریف کنی که خودکار تبدیل کنه:

```typescript
// ormconfig.ts
import { DefaultNamingStrategy } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';

export class SnakeCaseNamingStrategy extends DefaultNamingStrategy {
  columnName(propertyName: string, customName: string): string {
    return customName ? customName : snakeCase(propertyName);
  }
}

// در main config
{
  namingStrategy: new SnakeCaseNamingStrategy()
}
```

اما چون الان همه چیز manual هست، بهتره همینطور باشه تا consistency داشته باشیم.

---

## Files Changed
- `src/modules/profile/profile.service.ts` ✅ Fixed all queries
