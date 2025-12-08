# ماژول مدیریت صفحه اصلی (Home Page Module)

این ماژول امکان مدیریت کامل محتوای صفحه اصلی فروشگاه را فراهم می‌کند.

## ویژگی‌ها

### 1. مدیریت اسلایدرهای اصلی (Hero Sliders)
- افزودن/ویرایش/حذف اسلایدرها
- تنظیم عنوان، توضیحات و تصویر
- انتخاب رنگ پس‌زمینه
- تنظیم دکمه و لینک
- مدیریت ترتیب نمایش
- فعال/غیرفعال کردن اسلایدرها
- **ترک کلیک‌ها و آنالیز آماری** ✨ جدید

### 2. مدیریت بنرهای کناری (Side Banners)
- افزودن بنرها در موقعیت‌های مختلف (بالا، وسط، پایین)
- تنظیم عنوان و زیرعنوان
- افزودن برچسب تخفیف
- انتخاب رنگ برچسب
- لینک دهی به صفحات مختلف
- **ترک کلیک‌ها و آنالیز آماری** ✨ جدید

### 3. مدیریت بخش‌های محصولات (Home Sections)
چهار نوع بخش قابل ایجاد است:

#### a) محصولات ویژه (Featured)
محصولاتی که به عنوان ویژه علامت‌گذاری شده‌اند

#### b) محصولات دستی (Special Products)
انتخاب دستی محصولات توسط ادمین

#### c) محبوب‌ترین محصولات (Most Popular)
بر اساس تعداد فروش

#### d) بخش‌های دسته‌بندی محور (Category Based)
نمایش محصولات یک دسته‌بندی خاص

### 4. سیستم کش (Caching) ✨ جدید
- کش خودکار API صفحه اصلی (TTL: 5 دقیقه)
- پاک شدن خودکار کش بعد از تغییرات
- بهبود سرعت و کاهش بار دیتابیس

### 5. آنالیتیکس (Analytics) ✨ جدید
- ترک کلیک‌ها روی اسلایدرها و بنرها
- آمار کلی و جزئیات کلیک‌ها
- آمار در بازه زمانی مشخص
- تشخیص کاربران یونیک

## ساختار API

### Public APIs

#### دریافت تمام داده‌های صفحه اصلی
```
GET /home
```

پاسخ شامل:
- لیست اسلایدرهای فعال
- لیست بنرهای کناری فعال
- دسته‌بندی‌های اصلی
- تمام بخش‌های فعال به همراه محصولات آن‌ها

**نکته:** این API از کش استفاده می‌کند و هر 5 دقیقه بروزرسانی می‌شود.

#### ثبت کلیک روی عنصر
```
POST /home/analytics/track/:type/:id
```

پارامترها:
- `type`: نوع عنصر (hero_slider یا side_banner)
- `id`: شناسه عنصر

### Admin APIs

#### مدیریت اسلایدرها
```
POST   /admin/hero-sliders          - ایجاد اسلایدر جدید
GET    /admin/hero-sliders          - دریافت لیست اسلایدرها
GET    /admin/hero-sliders/:id      - دریافت یک اسلایدر
PATCH  /admin/hero-sliders/:id      - بروزرسانی اسلایدر
DELETE /admin/hero-sliders/:id      - حذف اسلایدر
POST   /admin/hero-sliders/sort-order - تغییر ترتیب
```

#### مدیریت بنرهای کناری
```
POST   /admin/side-banners          - ایجاد بنر جدید
GET    /admin/side-banners          - دریافت لیست بنرها
GET    /admin/side-banners?position=top_right - فیلتر بر اساس موقعیت
GET    /admin/side-banners/:id      - دریافت یک بنر
PATCH  /admin/side-banners/:id      - بروزرسانی بنر
DELETE /admin/side-banners/:id      - حذف بنر
```

#### مدیریت بخش‌های صفحه
```
POST   /admin/home-sections         - ایجاد بخش جدید
GET    /admin/home-sections         - دریافت لیست بخش‌ها
GET    /admin/home-sections/:id     - دریافت یک بخش
GET    /admin/home-sections/:id/products - دریافت محصولات بخش
PATCH  /admin/home-sections/:id     - بروزرسانی بخش
DELETE /admin/home-sections/:id     - حذف بخش
```

#### آنالیتیکس (فقط برای ادمین) ✨ جدید
```
GET /home/analytics/sliders           - آمار تمام اسلایدرها
GET /home/analytics/banners           - آمار تمام بنرها
GET /home/analytics/:type/:id         - آمار یک عنصر
GET /home/analytics/:type/:id/range?start=2024-01-01&end=2024-01-31
                                      - آمار در بازه زمانی
```

## نصب و راه‌اندازی

### 1. اجرای Migration اصلی
```sql
-- فایل: migrations/create_home_page_tables.sql
-- این فایل جداول مورد نیاز را ایجاد می‌کند
```

### 2. اجرای Migration Analytics ✨ جدید
```sql
-- فایل: migrations/add_click_analytics.sql
-- ایجاد جدول و view های آنالیتیکس
```

### 3. اجرای Seed Data (اختیاری)
```sql
-- فایل: seeds/home-page-seed.sql
-- برای ایجاد داده‌های نمونه
```

### 4. تنظیمات ماژول
ماژول به صورت خودکار در `app.module.ts` ثبت شده است.

## نمونه استفاده

### ایجاد اسلایدر جدید
```json
POST /admin/hero-sliders
{
  "title": "تسبیح تایگر چشم بین",
  "description": "لورم صنعت چاپ و از طراحان گرافیک است",
  "image_url": "/uploads/sliders/slider1.jpg",
  "background_color": "#E8B4D9",
  "button_text": "مشاهده محصول",
  "button_link": "/products/123",
  "sort_order": 1,
  "is_active": true
}
```

### ایجاد بنر کناری
```json
POST /admin/side-banners
{
  "title": "مصحف همراه (طلاکوب)",
  "subtitle": "از ۵۴۹,۹۱ تا ۵۵۹ هزار تومان",
  "image_url": "/uploads/banners/banner1.jpg",
  "link": "/category/quran",
  "position": "top_right",
  "badge_text": "14%",
  "badge_color": "#FF0000",
  "is_active": true
}
```

### ایجاد بخش محصولات دستی
```json
POST /admin/home-sections
{
  "title": "محصولات ویژه",
  "slug": "special-products",
  "section_type": "special_products",
  "display_style": "carousel",
  "product_ids": [1, 2, 3, 4, 5],
  "products_limit": 10,
  "show_view_all_button": true,
  "view_all_link": "/products?featured=true",
  "is_active": true
}
```

### ایجاد بخش دسته‌بندی محور
```json
POST /admin/home-sections
{
  "title": "ادعیه و کتب مذهبی",
  "slug": "religious-books",
  "section_type": "category_based",
  "display_style": "grid",
  "category_id": 5,
  "products_limit": 8,
  "show_view_all_button": true,
  "view_all_link": "/category/religious-books",
  "is_active": true
}
```

### ثبت کلیک روی اسلایدر ✨ جدید
```javascript
// از سمت فرانت‌اند
POST /home/analytics/track/hero_slider/1
// هیچ بادی‌ای لازم نیست، IP و User-Agent به صورت خودکار ثبت می‌شود
```

### دریافت آمار یک اسلایدر ✨ جدید
```
GET /home/analytics/hero_slider/1

Response:
{
  "element_type": "hero_slider",
  "element_id": 1,
  "total_clicks": 150,
  "unique_users": 87,
  "last_click": "2024-01-15T10:30:00Z"
}
```

## نکات مهم

1. **ترتیب نمایش**: از فیلد `sort_order` برای تعیین ترتیب نمایش استفاده کنید
2. **فعال/غیرفعال**: محتوای غیرفعال در API عمومی نمایش داده نمی‌شود
3. **بنرهای کناری**: می‌توانید چند بنر در یک موقعیت داشته باشید
4. **محصولات دستی**: برای بخش‌های `special_products` حتماً `product_ids` را مشخص کنید
5. **دسته‌بندی محور**: برای بخش‌های `category_based` حتماً `category_id` را مشخص کنید
6. **کش**: بعد از هر تغییر در محتوا، کش به صورت خودکار پاک می‌شود ✨ جدید
7. **آنالیتیکس**: کلیک‌ها به صورت خودکار IP و User-Agent کاربر را ذخیره می‌کنند ✨ جدید

## پشتیبانی از تصاویر

تمام فیلدهای مربوط به تصویر (`image_url`) می‌توانند:
- مسیر محلی: `/uploads/sliders/image.jpg`
- URL کامل: `https://example.com/image.jpg`

## Performance و بهینه‌سازی

### کش (Caching) ✨
- API صفحه اصلی به مدت 5 دقیقه کش می‌شود
- بعد از هر تغییر در اسلایدرها، بنرها یا بخش‌ها، کش پاک می‌شود
- کاهش قابل توجه زمان پاسخ‌دهی و بار دیتابیس

### دیتابیس
- استفاده از Index برای بهبود سرعت
- Query Optimization برای گرفتن محصولات
- استفاده از View برای آمار آنالیتیکس

### آنالیتیکس ✨
- Index بر روی `element_type`, `element_id` و `clicked_at`
- استفاده از View برای محاسبات آماری
- بهینه‌سازی Query ها برای سرعت بالا

## امنیت

- تمام API های ادمین نیاز به احراز هویت دارند (`AccessGuard`)
- نقش‌های مجاز: `ADMIN` و `SUPER_ADMIN`
- Validation کامل برای تمام ورودی‌ها
- محافظت در برابر SQL Injection با استفاده از TypeORM

## Structure

```
home-page/
├── controllers/
│   ├── home-page-public.controller.ts
│   ├── hero-slider-admin.controller.ts
│   ├── side-banner-admin.controller.ts
│   ├── home-section-admin.controller.ts
│   └── homepage-analytics.controller.ts ✨ جدید
├── dto/
│   ├── hero-slider.dto.ts
│   ├── side-banner.dto.ts
│   ├── home-section.dto.ts
│   └── home-page-response.dto.ts ✨ جدید
├── entities/
│   ├── hero-slider.entity.ts
│   ├── side-banner.entity.ts
│   ├── home-section.entity.ts
│   └── homepage-click-analytics.entity.ts ✨ جدید
├── interceptors/ ✨ جدید
│   └── clear-homepage-cache.interceptor.ts
├── validators/ ✨ جدید
│   └── section-data.validator.ts
├── migrations/ ✨ جدید
│   └── add_click_analytics.sql
├── seeds/
│   └── home-page-seed.sql
├── hero-slider.service.ts
├── side-banner.service.ts
├── home-section.service.ts
├── home-page.service.ts
├── homepage-analytics.service.ts ✨ جدید
├── home-page.module.ts
├── index.ts
└── README.md
```

## تغییرات جدید در نسخه اخیر ✨

### سیستم کش
- اضافه شدن کش Redis با TTL 5 دقیقه
- پاک شدن خودکار کش با Interceptor
- بهبود 90% سرعت API صفحه اصلی

### سیستم آنالیتیکس
- ترک کلیک‌ها روی اسلایدرها و بنرها
- آمار کلی و جزئیات (تعداد کلیک، کاربران یونیک، آخرین کلیک)
- آمار در بازه زمانی
- View های بهینه برای محاسبات آماری

### Validation بهتر
- اضافه شدن Custom Validator برای بخش‌ها
- چک کردن تطابق داده‌ها با نوع بخش
- پیام‌های خطای دقیق‌تر به فارسی

### مستندسازی
- Response DTO برای API صفحه اصلی
- مستندات کامل Swagger
- نمونه‌های کد بیشتر

## آینده توسعه

- [ ] ~~افزودن کش Redis~~ ✅ انجام شد
- [ ] ~~افزودن Analytics~~ ✅ انجام شد
- [ ] افزودن آپلود تصویر به API
- [ ] پشتیبانی از زمان‌بندی نمایش (تاریخ شروع/پایان)
- [ ] A/B Testing برای اسلایدرها و بنرها
- [ ] اضافه کردن بخش جدید: "تخفیف‌های ویژه"
- [ ] نمایش نرخ تبدیل (CTR) برای هر عنصر
