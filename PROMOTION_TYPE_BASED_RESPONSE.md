# سیستم Promotion - Response بر اساس Type

## تغییرات

### قبل
همه فیلدها بدون توجه به `type` برگشته می‌شدن.

### بعد
فقط فیلدهای مرتبط با `type` هر condition برمی‌گردن.

## انواع Type و Response ها

### 1. TYPE: PRODUCT
```json
{
  "type": "product",
  "products": [
    {
      "productId": 10,
      "variantIds": [101, 102],
      "product": {
        "id": 10,
        "name": "گوشی سامسونگ",
        "slug": "samsung-phone",
        "price": 15000000,
        "stock": 50,
        "discountPercent": 10,
        "discountAmount": 0,
        "mediaPinned": {
          "id": 5,
          "url": "..."
        },
        "category": {
          "id": 2,
          "title": "موبایل"
        }
      },
      "variants": [
        {
          "id": 101,
          "name": "مشکی - 128GB",
          "sku": "SAM-BLK-128",
          "price": 15500000,
          "stock": 20,
          "discountPercent": 5,
          "discountAmount": 0,
          "attributes": [...]
        }
      ]
    }
  ]
}
```

### 2. TYPE: CATEGORY
```json
{
  "type": "category",
  "categoryIds": [1, 2, 3],
  "categories": [
    {
      "id": 1,
      "title": "لپ‌تاپ",
      "slug": "laptop",
      "description": "انواع لپ‌تاپ",
      "parentId": null,
      "level": 0,
      "displayOrder": 1,
      "isActive": true
    },
    {
      "id": 2,
      "title": "موبایل",
      "slug": "mobile",
      "description": "گوشی‌های هوشمند",
      "parentId": null,
      "level": 0,
      "displayOrder": 2,
      "isActive": true
    }
  ]
}
```

### 3. TYPE: USER (با userId - deprecated)
```json
{
  "type": "user",
  "userId": 5,
  "user": {
    "id": 5,
    "firstName": "علی",
    "lastName": "احمدی",
    "email": "ali@example.com",
    "phone": "09123456789"
  }
}
```

### 4. TYPE: USER (با userIds - جدید ✅)
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
    },
    {
      "id": 10,
      "firstName": "رضا",
      "lastName": "محمدی",
      "email": "reza@example.com",
      "phone": "09187654321"
    }
  ]
}
```

### 5. TYPE: MIN_ORDER_AMOUNT
```json
{
  "type": "min_order_amount",
  "minAmount": 1000000
}
```

### 6. TYPE: FIRST_ORDER
```json
{
  "type": "first_order"
}
```

## مثال کامل Promotion با چند Condition

```json
{
  "id": 1,
  "name": "تخفیف ویژه VIP",
  "type": "coupon",
  "code": "VIP20",
  "starts_at": "2025-01-01T00:00:00.000Z",
  "ends_at": "2025-12-31T23:59:59.000Z",
  "is_active": true,
  "max_discount_amount": 500000,
  "conditions": [
    {
      "id": 1,
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
    },
    {
      "id": 2,
      "type": "category",
      "categoryIds": [1, 2],
      "categories": [
        {
          "id": 1,
          "title": "لپ‌تاپ",
          "slug": "laptop",
          "isActive": true
        },
        {
          "id": 2,
          "title": "موبایل",
          "slug": "mobile",
          "isActive": true
        }
      ]
    },
    {
      "id": 3,
      "type": "min_order_amount",
      "minAmount": 2000000
    }
  ],
  "actions": [
    {
      "type": "percent_discount",
      "value": 20
    }
  ]
}
```

## لاجیک Enrichment

```typescript
// بر اساس type، فقط فیلدهای مرتبط enrichment می‌شن

if (condition.type === ConditionType.PRODUCT) {
    // فقط products و variants
    enrichedCondition.products = [...];
}

if (condition.type === ConditionType.CATEGORY) {
    // فقط categoryIds و categories
    enrichedCondition.categoryIds = [...];
    enrichedCondition.categories = [...];
}

if (condition.type === ConditionType.USER) {
    // فقط userId/userIds و user/users
    enrichedCondition.userId = ...;
    enrichedCondition.user = {...};
    // یا
    enrichedCondition.userIds = [...];
    enrichedCondition.users = [...];
}

if (condition.type === ConditionType.MIN_ORDER_AMOUNT) {
    // فقط minAmount
    enrichedCondition.minAmount = ...;
}

if (condition.type === ConditionType.FIRST_ORDER) {
    // هیچ فیلد اضافی نداره
}
```

## مزایا

### 1. Response تمیزتر ✅
فقط فیلدهای مرتبط با type برمی‌گردن، نه همه چیز.

### 2. کاهش حجم Response ✅
اطلاعات غیرضروری برگشته نمی‌شن.

### 3. Type Safety بهتر ✅
Frontend می‌دونه بر اساس type چه فیلدهایی انتظار داشته باشه.

### 4. Performance بهینه ✅
فقط داده‌های لازم از DB لود می‌شن.

## تست

### تست 1: Product Type
```bash
POST /api/admin/promotions
{
  "conditions": [{
    "type": "product",
    "products": [{"productId": 10, "variantIds": [101]}]
  }]
}

GET /api/admin/promotions/1
# Response باید فقط products و variants داشته باشه
```

### تست 2: Category Type
```bash
POST /api/admin/promotions
{
  "conditions": [{
    "type": "category",
    "category_ids": [1, 2]
  }]
}

GET /api/admin/promotions/1
# Response باید categoryIds و categories array کامل داشته باشه
```

### تست 3: User Type با userIds
```bash
POST /api/admin/promotions
{
  "conditions": [{
    "type": "user",
    "user_ids": [5, 10]
  }]
}

GET /api/admin/promotions/1
# Response باید userIds و users array کامل داشته باشه
```

### تست 4: Multiple Conditions
```bash
POST /api/admin/promotions
{
  "conditions": [
    {"type": "user", "user_ids": [5]},
    {"type": "category", "category_ids": [1, 2]},
    {"type": "min_order_amount", "min_amount": 1000000}
  ]
}

GET /api/admin/promotions/1
# هر condition فقط فیلدهای مرتبط با type خودش رو داره
```

## نکات مهم

1. ✅ **Type-Based**: همه چیز بر اساس `type` هر condition
2. ✅ **Clean Response**: فقط فیلدهای مرتبط
3. ✅ **Performance**: فقط داده‌های لازم load می‌شن
4. ✅ **Backward Compatible**: `userId` همچنان کار می‌کنه
5. ✅ **Variant Name**: خودکار ساخته می‌شه از attributes

این ساختار باعث می‌شه Response تمیزتر، کوچکتر و مفیدتر باشه! 🎉
