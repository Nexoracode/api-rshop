# Fix: فقط findById با Enrichment

## تغییرات نهایی

### ✅ findById
با اطلاعات کامل (users, products, variants, categories)

```typescript
async findById(id: number): Promise<any> {
    const entity = await this.ormRepo.findOne({
        where: { id },
        relations: ['conditions', 'actions'],
    });

    if (!entity) return null;

    return this.enrichPromotion(entity);  // ✅ enriched
}
```

### ✅ paginated
بدون enrichment (مثل قبل)

```typescript
async paginated(query: PaginateQuery): Promise<any> {
    const result = await paginate<PromotionOrmEntity>(query, this.ormRepo, {
        // ...
    });

    // تبدیل به domain entities (بدون enrichment)
    const items = result.data.map(entity => PromotionMapper.fromOrmToDomain(entity));

    return {
        items,
        meta: result.meta,
        links: result.links,
    };
}
```

### ✅ findActiveByCode & findActiveForOrder
بدون enrichment (مثل قبل)

```typescript
return entity ? PromotionMapper.fromOrmToDomain(entity) : null;
```

## Response

### GET /api/admin/promotions/:id (findById)
```json
{
  "conditions": [
    {
      "type": "user",
      "userIds": [5, 3, 4, 6],
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
  ]
}
```

### GET /api/admin/promotions (paginated)
```json
{
  "items": [
    {
      "conditions": [
        {
          "type": "user",
          "userIds": [5, 3, 4, 6]
          // بدون users array
        }
      ]
    }
  ]
}
```

## خلاصه

✅ **findById**: enriched (با users, products, categories کامل)
✅ **paginated**: ساده (فقط IDs)
✅ **findActiveByCode**: ساده (فقط IDs)
✅ **findActiveForOrder**: ساده (فقط IDs)

فقط وقتی جزئیات یک promotion خاص رو می‌خوای، enrichment فعال می‌شه! 🎉
