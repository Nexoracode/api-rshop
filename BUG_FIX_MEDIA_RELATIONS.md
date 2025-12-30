# 🐛 Bug Fix - Media Relations

## مشکل
```
TypeORMError: Relation with property path media in entity was not found.
```

## علت
در entity های `Product` و `VariantProduct`:
- `Product` دارای relation `OneToMany` به `Media` است (نه `ManyToOne`)
- `VariantProduct` اصلاً `media` relation ندارد

## راه حل

### 1️⃣ تصحیح query خریدهای پرتکرار (`getFrequentPurchases`)

**قبل:**
```typescript
.leftJoin('product.media', 'media')
.addSelect('media.url', 'productImage')
.addGroupBy('media.url')
```

**بعد:**
```typescript
// Query اصلی بدون media
const result = await this.orderItemRepo
  .createQueryBuilder('item')
  .select('product.id', 'productId')
  // ...
  .getRawMany();

// دریافت تصاویر به صورت جداگانه
const productsWithMedia = await this.orderRepo.manager
  .createQueryBuilder()
  .select('product.id', 'productId')
  .addSelect('media.url', 'imageUrl')
  .from('products', 'product')
  .leftJoin('media', 'media', 'media.productId = product.id AND media.isPinned = true')
  .where('product.id IN (:...productIds)', { productIds })
  .getRawMany();

// ساخت Map برای mapping
const mediaMap = new Map(
  productsWithMedia.map(item => [item.productId, item.imageUrl])
);

// اضافه کردن تصویر به نتیجه
return result.map((item) => ({
  // ...
  productImage: mediaMap.get(item.productId) || null,
}));
```

### 2️⃣ تصحیح query سفارشات (`getOrdersByStatus`)

**قبل:**
```typescript
.leftJoinAndSelect('variant.media', 'variantMedia') // ❌ variant media ندارد
```

**بعد:**
```typescript
.leftJoinAndSelect('variant.attributes', 'variantAttributes')
.leftJoinAndSelect('variantAttributes.attributeValue', 'attributeValue')
.leftJoinAndSelect('attributeValue.attribute', 'attribute')
```

## نکات مهم

### چرا این روش؟

1. **Product.media یک OneToMany است:**
   - نمی‌توان مستقیماً در GROUP BY استفاده کرد
   - باعث cartesian product می‌شود
   - query کند می‌شود

2. **راه حل بهتر:**
   - Query اصلی فقط aggregation
   - Query دوم فقط برای تصاویر
   - استفاده از Map برای O(1) lookup
   - بهتر از N+1 queries

3. **Variant:**
   - variant اصلاً media ندارد
   - فقط attributes دارد که باید join کرد

## تست

```bash
# تست پروفایل کامل
GET /profile/detailed

# تست خریدهای پرتکرار
GET /profile/frequent-purchases

# تست سفارشات
GET /profile/orders/completed
GET /profile/orders/awaiting-payment
```

## Performance

✅ **بهبود Performance:**
- Query اصلی سریع‌تر (بدون join اضافی)
- تعداد query ها: 2 به جای N+1
- استفاده از IN clause برای batch fetch

✅ **پیشنهاد آینده:**
اگر تعداد محصولات زیاد باشد، می‌توانی:
```typescript
// فقط اولین تصویر pinned
.leftJoin('media', 'media', 'media.productId = product.id AND media.isPinned = true')

// یا همه تصاویر
.leftJoin('media', 'media', 'media.productId = product.id')
```

---

## Files Changed
- `src/modules/profile/profile.service.ts` ✅ Fixed
