# Promotion System - Complete Enhancement

## خلاصه تغییرات

✅ **Response بر اساس Type**: فقط فیلدهای مرتبط با type هر condition برمی‌گردن
✅ **Category Details**: اطلاعات کامل دسته‌بندی‌ها
✅ **Multiple Users (userIds)**: پشتیبانی از چند کاربر
✅ **Variant Name**: ساخت خودکار نام از attributes
✅ **Helper Method**: `enrichPromotion` برای استفاده مجدد
✅ **All Methods Updated**: findById, findActiveByCode, findActiveForOrder, paginated

## تغییرات Repository

### قبل
هر متد enrichment خودش رو داشت → تکرار کد

### بعد
یک helper method مشترک → کد تمیزتر و maintainable

```typescript
private async enrichPromotion(entity: PromotionOrmEntity): Promise<any> {
    // جمع‌آوری IDs بر اساس type
    // بارگذاری داده‌ها
    // Enrichment بر اساس type
}
```

## متدهای آپدیت شده

### 1. findById ✅
```typescript
async findById(id: number): Promise<Promotion | null> {
    const entity = await this.ormRepo.findOne({
        where: { id },
        relations: ['conditions', 'actions'],
    });

    if (!entity) return null;

    return this.enrichPromotion(entity);
}
```

### 2. findActiveByCode ✅
```typescript
async findActiveByCode(code: string): Promise<Promotion | null> {
    const entity = await this.ormRepo
        .createQueryBuilder('p')
        // ... filters
        .getOne();

    if (!entity) return null;

    return this.enrichPromotion(entity);
}
```

### 3. findActiveForOrder ✅
```typescript
async findActiveForOrder(order: OrderPreview): Promise<Promotion[]> {
    const entities = await this.ormRepo
        .createQueryBuilder('p')
        // ... filters including userIds
        .getMany();

    const enrichedPromotions = await Promise.all(
        entities.map(entity => this.enrichPromotion(entity))
    );

    return enrichedPromotions.filter(Boolean);
}
```

### 4. paginated ✅
همان لاجیک قبلی با type-based filtering

## ساختار Response

### TYPE: PRODUCT
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
        "mediaPinned": {...},
        "category": {...}
      },
      "variants": [
        {
          "id": 101,
          "name": "مشکی - 128GB",
          "sku": "SAM-BLK-128",
          "price": 15500000,
          "stock": 20,
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
      "description": "انواع لپ‌تاپ",
      "parentId": null,
      "level": 0,
      "displayOrder": 1,
      "isActive": true
    }
  ]
}
```

### TYPE: USER (با userIds)
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

### TYPE: MIN_ORDER_AMOUNT
```json
{
  "type": "min_order_amount",
  "minAmount": 1000000
}
```

### TYPE: FIRST_ORDER
```json
{
  "type": "first_order"
}
```

## Flow کامل

### 1. دریافت Promotion با Code
```
User → CheckPromotionUseCase
  ↓
findActiveByCode(code)
  ↓
enrichPromotion(entity)
  ↓
Return: Promotion با اطلاعات کامل
```

### 2. دریافت Promotions برای Order
```
User → CheckPromotionUseCase
  ↓
findActiveForOrder(order)
  ↓
Query with userIds filter
  ↓
enrichPromotion for each
  ↓
Return: Promotions[] با اطلاعات کامل
```

### 3. دریافت Promotion جزئیات
```
Admin → GetPromotionByIdUseCase
  ↓
findById(id)
  ↓
enrichPromotion(entity)
  ↓
Return: Promotion با اطلاعات کامل
```

## مزایا

### 1. کد تمیزتر ✅
- یک helper method به جای تکرار
- DRY principle رعایت شده

### 2. Maintainability بهتر ✅
- تغییر در یک جا → همه جا اعمال می‌شه
- باگ‌ها راحت‌تر پیدا می‌شن

### 3. Consistency ✅
- همه متدها همین لاجیک رو دارن
- Response یکسان در همه جا

### 4. Performance ✅
- رفع N+1 Problem
- Bulk loading برای همه داده‌ها

### 5. Type Safety ✅
- فقط فیلدهای مرتبط با type
- کاهش حجم response

## تست‌های جامع

### تست 1: findById
```bash
GET /api/admin/promotions/1

# چک کنید:
# ✅ products با variant name
# ✅ categories با اطلاعات کامل
# ✅ users با اطلاعات کامل
```

### تست 2: findActiveByCode
```bash
POST /api/promotions/check
{
  "code": "WINTER20",
  "userId": 5,
  "subtotal": 1000000,
  "items": [...]
}

# چک کنید:
# ✅ promotion با enriched data برگشته
# ✅ فقط فیلدهای مرتبط با type
```

### تست 3: findActiveForOrder با userIds
```bash
# ایجاد promotion با userIds: [5, 10]
POST /api/admin/promotions
{
  "conditions": [{
    "type": "user",
    "user_ids": [5, 10]
  }]
}

# تست با user 5
POST /api/promotions/check
{"userId": 5, ...}
# ✅ باید promotion برگرده

# تست با user 15
POST /api/promotions/check
{"userId": 15, ...}
# ✅ نباید promotion برگرده
```

### تست 4: paginated
```bash
GET /api/admin/promotions?page=1&limit=10

# چک کنید:
# ✅ products array کامل
# ✅ categories array کامل
# ✅ users array کامل
```

### تست 5: Category Details
```bash
# ایجاد promotion با category
POST /api/admin/promotions
{
  "conditions": [{
    "type": "category",
    "category_ids": [1, 2]
  }]
}

# دریافت
GET /api/admin/promotions/1

# Response باید داشته باشه:
{
  "conditions": [{
    "type": "category",
    "categoryIds": [1, 2],
    "categories": [
      {"id": 1, "title": "لپ‌تاپ", ...},
      {"id": 2, "title": "موبایل", ...}
    ]
  }]
}
```

## Migration

```bash
npm run migration:run
```

## Performance Metrics

### قبل (بدون enrichment):
```
findById: 1 query
findActiveByCode: 1 query
findActiveForOrder: 1 query
---
Total: 3 queries (ولی بدون اطلاعات کامل)
```

### بعد (با enrichment):
```
findById: 4 queries (1 promo + 3 batch loads)
findActiveByCode: 4 queries
findActiveForOrder: 4 queries per promotion
---
Total: 4-16 queries (با اطلاعات کامل!)
```

با 5 محصول، 3 category، 2 user:
- **بدون Bulk Loading**: 1 + 5 + 3 + 2 = 11 queries
- **با Bulk Loading**: 4 queries
- **بهبود**: 64% کاهش queries ✅

## نکات مهم

1. ✅ **Helper Method**: `enrichPromotion` در همه جا استفاده می‌شه
2. ✅ **Type-Based**: فقط فیلدهای مرتبط با type
3. ✅ **Backward Compatible**: `userId` همچنان کار می‌کنه
4. ✅ **Variant Name**: خودکار ساخته می‌شه
5. ✅ **Security**: فقط فیلدهای امن user

سیستم promotion حالا کاملا بهینه، تمیز و قدرتمند شده! 🎉
