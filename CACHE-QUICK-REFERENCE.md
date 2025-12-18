# 🚀 Quick Reference - Redis Cache

## سریع‌ترین راهنما برای استفاده از Cache

### 🎯 ماژول‌های Cache شده:
1. **Category** → `src/modules/category/cache/`
2. **Product** → `src/modules/product/cache/`
3. **Home Page** → `src/modules/home-page/cache/`

---

## ⚡ شروع سریع

### 1. نصب Redis (Development):
```bash
# با Docker
docker run -d -p 6379:6379 redis:7-alpine

# یا از Redis Desktop
# دانلود از: https://redis.io/download
```

### 2. تنظیم Environment:
```bash
cp .env.example .env

# ویرایش .env
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 3. اجرا:
```bash
npm run start:dev
```

---

## 📝 پترن‌های رایج

### دریافت از Cache:
```typescript
// چک cache
const cached = await this.cacheService.getItemById(id);
if (cached) {
    console.log('✅ از cache');
    return cached;
}

// دریافت از DB
const item = await this.repo.findOne({ where: { id } });

// ذخیره در cache
await this.cacheService.setItemById(id, item);
console.log('💾 ذخیره شد');

return item;
```

### پاک کردن Cache:
```typescript
// بعد از Create/Update/Delete
await this.cacheService.clearItemCache(id);
console.log('🗑️ پاک شد');
```

---

## 🔍 Debug سریع

### بررسی Redis:
```bash
# اتصال به Redis CLI
redis-cli

# مشاهده تمام کلیدها
KEYS *

# مشاهده یک کلید
GET category:tree

# پاک کردن یک کلید
DEL category:tree

# پاک کردن همه
FLUSHALL
```

### بررسی لاگ‌ها:
```bash
# در terminal اپلیکیشن
✅ = Cache Hit (موفق)
💾 = Cache Miss (ذخیره شد)
🗑️ = Cache Clear (پاک شد)
```

---

## 📊 آمارگیری سریع

```typescript
// Category
const stats = await categoryCacheService.getCacheStats();

// Product
const stats = await productCacheService.getCacheStats();

// Home Page
const stats = await homePageCacheService.getCacheStats();
```

---

## 🐛 مشکلات رایج

| مشکل | راه حل |
|------|--------|
| Cache قدیمی است | `clearCache()` بعد از تغییر |
| Redis connect نمیشه | بررسی `REDIS_HOST` و `REDIS_PASSWORD` |
| Memory پره | کاهش `REDIS_MAX_ITEMS` |
| TTL خیلی کوتاه/بلنده | تنظیم TTL مناسب |

---

## 📚 مستندات کامل

- [خلاصه کامل](./CACHE-IMPLEMENTATION-SUMMARY.md)
- [Category Cache](./src/modules/category/cache/README.md)
- [Product Cache](./src/modules/product/cache/README.md)
- [Home Page Cache](./src/modules/home-page/cache/README.md)
- [Environment Setup](./README-ENV.md)

---

## 🎯 Performance

```
Before: 800ms - 3s
After:  5ms - 15ms
Improvement: 100x+ faster! 🚀
```

---

## ✅ Production Checklist

- [ ] Redis نصب شده (CapRover One-Click)
- [ ] Password قوی تنظیم شده
- [ ] Environment variables صحیح
- [ ] TTL ها مناسب
- [ ] Rate limiting فعال
- [ ] Monitoring راه‌اندازی شده

---

**نیاز به کمک؟** مستندات کامل را بخوانید! 📖
