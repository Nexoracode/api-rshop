# Promotion System - Final Complete Update

## تغییرات نهایی

### 1. حذف userId (فقط userIds باقی مونده) ✅
- `userId` از همه entities، DTOs، mappers، validator حذف شد
- فقط `userIds` استفاده می‌شه

### 2. حل مشکل enrichPromotion ✅
- دیگه از `fromOrmToDomain` استفاده نمی‌کنه
- مستقیم object enriched شده برمی‌گردونه

## فایل‌های تغییر یافته

### Entities
- ✅ `promotion-condition.orm-entity.ts`: حذف `userId`
- ✅ `promotion-condition.entity.ts`: حذف `userId`

### DTOs
- ✅ `create-promotion.dto.ts`: حذف `userId`
- ✅ `promotion-response.dto.ts`: حذف `userId`

### Mapper
- ✅ `promotion.mapper.ts`: حذف `userId` از همه متدها

### Validator
- ✅ `promotion-validator.service.ts`: فقط `userIds` چک می‌شه

### Repository
- ✅ `promotion-repository.ts`: 
  - `enrichPromotion` دیگه از Mapper استفاده نمی‌کنه
  - مستقیم object می‌سازه
  - Query فقط `userIds` رو چک می‌کنه

## ساختار Response نهایی

### TYPE: USER
```json
{
  "type": "user",
  "userIds": [5, 10, 15],
  "users": [
    {
      "id": 5,
      "firstName": "علی",
      "lastName": "احمدی",
      "email": "ali@example.com",
      "phone": "09123456789"
    }
  ]
}
```

### TYPE: PRODUCT
```json
{
  "type": "product",
  "products": [
    {
      "productId": 10,
      "variantIds": [101],
      "product": {...},
      "variants": [
        {
          "id": 101,
          "name": "مشکی - XL",
          "sku": "...",
          "price": 15000000,
          "attributes": [...]
        }
      ]
    }
  ]
}
```

### TYPE: CATEGORY
```json
{
  "type": "category",
  "categoryIds": [1, 2],
  "categories": [
    {
      "id": 1,
      "title": "لپ‌تاپ",
      "slug": "laptop",
      "isActive": true
    }
  ]
}
```

## لاجیک enrichPromotion

```typescript
private async enrichPromotion(entity: PromotionOrmEntity): Promise<any> {
    // 1. جمع‌آوری IDs بر اساس type
    // 2. بارگذاری داده‌ها
    // 3. ایجاد Maps
    // 4. ساخت object enriched بدون Mapper
    
    return {
        id: entity.id,
        name: entity.name,
        // ...
        conditions: enrichedConditions,  // با اطلاعات کامل
        actions: enrichedActions
    };
}
```

## چرا از Mapper استفاده نکردیم؟

**قبل:**
```typescript
const domain = PromotionMapper.fromOrmToDomain(entity);
// domain فقط IDs داره، نه اطلاعات کامل
```

**بعد:**
```typescript
return {
    id: entity.id,
    name: entity.name,
    conditions: enrichedConditions  // شامل product, variants, categories, users
};
```

## Migrations

### Migration 1: اضافه کردن user_ids
```bash
# قبلاً اجرا شده
1736007000000-AddUserIdsToPromotionCondition.ts
```

### Migration 2: حذف user_id
```bash
# جدید - باید اجرا بشه
1736008000000-RemoveUserIdFromPromotionCondition.ts
```

## دستورات اجرا

```bash
# اجرای migrations
npm run migration:run

# اگر نیاز به rollback بود
npm run migration:revert
```

## تست‌ها

### تست 1: ایجاد با userIds
```bash
POST /api/admin/promotions
{
  "name": "تخفیف VIP",
  "conditions": [{
    "type": "user",
    "user_ids": [5, 10, 15]
  }],
  "actions": [{"type": "percent_discount", "value": 20}]
}
```

### تست 2: دریافت با enrichment
```bash
GET /api/admin/promotions/1

# Response:
{
  "conditions": [{
    "type": "user",
    "userIds": [5, 10, 15],
    "users": [
      {"id": 5, "firstName": "علی", ...}
    ]
  }]
}
```

### تست 3: Category enrichment
```bash
POST /api/admin/promotions
{
  "conditions": [{
    "type": "category",
    "category_ids": [1, 2]
  }]
}

GET /api/admin/promotions/1

# Response:
{
  "conditions": [{
    "type": "category",
    "categoryIds": [1, 2],
    "categories": [
      {"id": 1, "title": "لپ‌تاپ", ...}
    ]
  }]
}
```

### تست 4: Product با variant name
```bash
GET /api/admin/promotions/1

# Response:
{
  "conditions": [{
    "type": "product",
    "products": [{
      "variants": [
        {
          "name": "قرمز - XL",  // ✅ ساخته شده از attributes
          "sku": "...",
          "price": 250000
        }
      ]
    }]
  }]
}
```

### تست 5: Validator با userIds
```bash
# کاربر 5 سفارش می‌ده
POST /api/promotions/check
{
  "code": "VIP20",
  "userId": 5
}

# اگر promotion دارای userIds: [5, 10] باشه → ✅ قبول
# اگر promotion دارای userIds: [15, 20] باشه → ❌ رد
```

## مزایای این رویکرد

### 1. Response کامل ✅
همه اطلاعات در یک response

### 2. بدون تبدیل اضافی ✅
مستقیم object enriched برمی‌گردونه

### 3. Type-based ✅
فقط فیلدهای مرتبط با type

### 4. Performance ✅
Bulk loading برای همه داده‌ها

### 5. Backward Compatible ❌
`userId` حذف شده - باید همه به `userIds` تبدیل بشن

## Breaking Changes

⚠️ **IMPORTANT**: این یک breaking change هست

**قبل:**
```json
{
  "conditions": [{
    "type": "user",
    "user_id": 5
  }]
}
```

**بعد:**
```json
{
  "conditions": [{
    "type": "user",
    "user_ids": [5]
  }]
}
```

## Data Migration Script

اگر داده‌های قدیمی با `userId` دارید، باید تبدیل بشن:

```sql
-- تبدیل user_id به user_ids
UPDATE promotion_conditions 
SET user_ids = JSON_ARRAY(user_id)
WHERE user_id IS NOT NULL 
AND (user_ids IS NULL OR JSON_LENGTH(user_ids) = 0);
```

## خلاصه

✅ **userId حذف شد**
✅ **فقط userIds باقی مونده**
✅ **enrichPromotion بدون Mapper**
✅ **Response کامل با product, variant, category, user details**
✅ **Variant name خودکار ساخته می‌شه**
✅ **Type-based response**

همه چیز تمیز، بهینه و آماده production! 🎉
