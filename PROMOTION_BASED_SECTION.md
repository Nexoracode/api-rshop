# ✅ تغییرات اعمال شده: Promotion-Based HomeSection

## 📝 خلاصه

قابلیت نمایش محصولات ویژه از **Promotion** به جای فیلد `isFeatured` اضافه شد.

---

## 🔧 فایل‌های تغییر یافته:

✅ `src/modules/home-page/entities/home-section.entity.ts`
✅ `src/modules/home-page/dto/home-section.dto.ts`
✅ `src/modules/home-page/home-section.service.ts`
✅ `src/modules/home-page/home-page.module.ts`
✅ `src/modules/promotion/infrastructure/repositories/promotion-repository.ts`
✅ `db/migrations/1767200000000-AddPromotionIdToHomeSection.ts`

---

## 🚀 مراحل نصب:

### 1. اجرای Migration
```bash
npm run mig:run
```

### 2. Build و Restart
```bash
npm run build
npm run start:dev
```

---

## 🎯 نحوه استفاده:

### مرحله 1: ساخت Promotion
```json
POST /api/admin/promotions

{
  "name": "تخفیف زمستانه",
  "type": "flash_deal",
  "startsAt": "2025-01-01T00:00:00Z",
  "endsAt": "2025-02-01T00:00:00Z",
  "isActive": true,
  "conditions": [
    {
      "type": "product",
      "products": [
        { "productId": 21 },
        { "productId": 25 },
        { "productId": 30 }
      ]
    }
  ],
  "actions": [
    {
      "type": "percentage_discount",
      "value": 20
    }
  ]
}
```

### مرحله 2: ساخت HomeSection
```json
POST /api/admin/home-sections

{
  "title": "پیشنهاد ویژه زمستانه",
  "slug": "winter-special",
  "sectionType": "promotion_based",
  "promotionId": 5,
  "displayStyle": "carousel",
  "productsLimit": 12,
  "isActive": true
}
```

---

## ✨ ویژگی‌های جدید:

- ✅ `SectionType.PROMOTION_BASED` برای نوع بخش
- ✅ فیلد `promotionId` در Entity و DTO
- ✅ متد `getPromotionProducts()` در PromotionRepository
- ✅ بررسی خودکار اعتبار زمانی Promotion
- ✅ پشتیبانی کامل از Cache System

---

## 🔍 چک کردن:

```bash
# دیدن migration ها
npm run migration:show

# چک کردن database
# باید یک ستون promotion_id در جدول home_sections اضافه شده باشد
```

---

## 🎉 تمام!

حالا می‌تونی از CMS محصولات ویژه رو از Promotion مدیریت کنی! 🚀
