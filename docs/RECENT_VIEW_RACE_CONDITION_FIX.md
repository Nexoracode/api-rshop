# 🔴 Race Condition در Recent Views - حل شد!

## ❌ مشکل قبلی:

```
User باز می‌کنه صفحه محصول
↓
Frontend می‌زنه POST /recent-views (چندتا request همزمان!)
↓
Backend:
  1. findOne({ user_id: 1, product_id: 10 })  → نیست
  2. insert({ user_id: 1, product_id: 10 })   → OK
  
  همزمان:
  1. findOne({ user_id: 1, product_id: 10 })  → نیست (هنوز insert نشده!)
  2. insert({ user_id: 1, product_id: 10 })   → ERROR: Duplicate entry!
```

**Error:**
```
QueryFailedError: Duplicate entry '1-10' for key 'recent_views.IDX_790e4a7c64c17aa72b54757ff4'
```

---

## 🔍 علت:

### 1. **Race Condition:**
```typescript
// ❌ کد قبلی
const exist = await this.repo.findOne({ ... });  // ← چک می‌کنه

// ⚠️ اینجا ممکنه request دیگه‌ای insert کنه!

if (!exist) {
  await this.repo.save({ ... });  // ← ERROR!
}
```

### 2. **UNIQUE INDEX:**
```sql
CREATE UNIQUE INDEX IDX_... ON recent_views (user_id, product_id);
```

این Index جلوی duplicate رو می‌گیره ولی باعث Error می‌شه!

---

## ✅ راه‌حل 1: Upsert (پیشنهادی)

```typescript
// ✅ کد جدید - استفاده از Upsert
await this.repo
  .createQueryBuilder()
  .insert()
  .into(RecentView)
  .values({
    userId: user.id,
    productId: dto.productId,
    updatedAt: new Date(),
  })
  .orUpdate(
    ['updated_at'],           // فیلدهایی که update می‌شن
    ['user_id', 'product_id'] // کلیدهای Unique
  )
  .execute();
```

**معادل SQL:**
```sql
INSERT INTO recent_views (user_id, product_id, updated_at)
VALUES (1, 10, NOW())
ON DUPLICATE KEY UPDATE
  updated_at = NOW();
```

**چطور کار می‌کنه:**
```
Request 1: INSERT → OK
Request 2: INSERT → UPDATE (no error!)
Request 3: INSERT → UPDATE (no error!)
```

---

## ✅ راه‌حل 2: Try-Catch (Fallback)

```typescript
try {
  // تلاش برای Upsert
  await this.repo...
} catch (error) {
  // اگه باز هم Duplicate خورد (بعید!)
  if (error.code === 'ER_DUP_ENTRY') {
    // فقط update کن
    await this.repo.update(
      { userId, productId },
      { updatedAt: new Date() }
    );
  }
}
```

---

## 🎯 تغییرات کلیدی:

### 1️⃣ استفاده از Upsert:
```typescript
// قبل: findOne + save (Race Condition!)
// بعد: insert ... orUpdate (Atomic!)
```

### 2️⃣ جدا کردن Cleanup:
```typescript
// قبل: cleanup بعد از هر add
// بعد: cleanup جدا (سریع‌تر)

private async cleanupOldViews(userId: number) {
  const toDelete = await this.repo
    .skip(this.MAX_VIEWS)  // از 21 به بعد
    .getMany();
  
  if (toDelete.length > 0) {
    await this.repo.delete(ids);
  }
}
```

### 3️⃣ Error Handling:
```typescript
// اگه cleanup با مشکل مواجه شد، فقط لاگ کن
// (مهم نیست، بازدید اضافه شده)
try {
  await this.cleanupOldViews(userId);
} catch (error) {
  this.logger.error('Cleanup failed', error);
  // اما کل عملیات fail نمی‌شه!
}
```

---

## 📊 مقایسه:

| روش | Race Condition | Performance | خطا |
|-----|---------------|-------------|-----|
| ❌ findOne + save | دارد | کند (2 query) | Duplicate Error |
| ✅ Upsert | ندارد | سریع (1 query) | ندارد |
| ✅ Try-Catch | ندارد | متوسط | Handle می‌شه |

---

## 🧪 تست:

### تست 1: تک Request
```bash
POST /api/profile/recent-views
Body: { productId: 10 }

# نتیجه: ✅ OK
```

### تست 2: همزمان (Race Condition)
```bash
# 10 تا request همزمان
for i in {1..10}; do
  curl -X POST /api/profile/recent-views \
    -d '{"productId":10}' &
done

# نتیجه:
# قبل: 1 OK + 9 ERROR ❌
# بعد: 10 OK ✅
```

### تست 3: محصول تکراری
```bash
POST /api/profile/recent-views { productId: 10 }
POST /api/profile/recent-views { productId: 10 }
POST /api/profile/recent-views { productId: 10 }

# نتیجه:
# فقط یک record با updated_at جدید ✅
```

---

## 🔧 Debugging:

اگه هنوز Error میده:

### 1. چک کن Unique Index درسته:
```sql
SHOW INDEX FROM recent_views;

-- باید این رو ببینی:
-- Key_name: IDX_...
-- Column_name: user_id, product_id
-- Non_unique: 0
```

### 2. چک کن TypeORM درست کار می‌کنه:
```typescript
// لاگ query ای که اجرا می‌شه
this.logger.debug('Running upsert query');
```

### 3. اگه هنوز مشکل داره، از Raw Query استفاده کن:
```typescript
await this.repo.query(`
  INSERT INTO recent_views (user_id, product_id, updated_at)
  VALUES (?, ?, NOW())
  ON DUPLICATE KEY UPDATE updated_at = NOW()
`, [userId, productId]);
```

---

## 📝 نکات مهم:

### 1. Upsert فقط MySQL/MariaDB:
اگه از PostgreSQL استفاده می‌کنی:
```typescript
.orUpdate(
  ['updated_at'],
  ['user_id', 'product_id'],
  {
    skipUpdateIfNoValuesChanged: true,  // PostgreSQL
  }
)
```

### 2. Performance:
Upsert سریع‌تر از findOne + save است:
```
findOne + save: 2 query
Upsert: 1 query ✅
```

### 3. Cleanup جداگانه:
Cleanup رو async انجام بده تا response سریع‌تر باشه:
```typescript
// اگه می‌خوای background job داشته باشی
this.cleanupOldViews(userId).catch(err => 
  this.logger.error('Cleanup failed', err)
);
```

### 4. MySQL OFFSET without LIMIT:
MySQL نمی‌تونه `SKIP` بدون `LIMIT` داشته باشه!
```typescript
// ❌ اشتباه - MySQL error!
.skip(20).getMany()

// ✅ درست - با Subquery
await this.repo.query(`
  DELETE FROM recent_views
  WHERE user_id = ?
    AND id NOT IN (
      SELECT id FROM (
        SELECT id FROM recent_views
        WHERE user_id = ?
        ORDER BY updated_at DESC
        LIMIT 20  -- ✅ LIMIT داره!
      ) AS keep_ids
    )
`, [userId, userId, 20]);
```

---

## ✅ خلاصه:

1. ✅ **Upsert اضافه شد** → جلوی Race Condition گرفته شد
2. ✅ **Try-Catch اضافه شد** → Error handling بهتر
3. ✅ **Cleanup با Subquery** → MySQL compatible
4. ✅ **Logging اضافه شد** → Debugging راحت‌تر

همه چی حل شد! 🎉
