# راهنمای پیاده‌سازی SEO در پروژه

## 📋 فهرست مطالب
1. [نصب و راه‌اندازی](#نصب-و-راه‌اندازی)
2. [اضافه کردن به app.module](#اضافه-کردن-به-appmodule)
3. [استفاده در کنترلرها](#استفاده-در-کنترلرها)
4. [تنظیمات محیطی](#تنظیمات-محیطی)
5. [بهینه‌سازی‌های اضافی](#بهینه‌سازی‌های-اضافی)

---

## 🚀 نصب و راه‌اندازی

### 1. اضافه کردن SeoModule به app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { SeoModule } from './modules/seo/seo.module';

@Module({
  imports: [
    // ... سایر ماژول‌ها
    SeoModule,
  ],
})
export class AppModule {}
```

---

## 📦 استفاده در کنترلر محصولات

### نمونه کد برای Product Controller:

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SeoService } from '../seo/seo.service';
import { ProductService } from './product.service';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly seoService: SeoService,
  ) {}

  @Get(':slug')
  async getProductBySlug(@Param('slug') slug: string) {
    const product = await this.productService.findBySlug(slug);
    
    // تولید متادیتای SEO
    const seoMeta = this.seoService.generateProductMeta(product);
    
    return {
      ...product,
      seo: seoMeta,
    };
  }
}
```

### نمونه کد برای Category Controller:

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SeoService } from '../seo/seo.service';
import { CategoryService } from './category.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly seoService: SeoService,
  ) {}

  @Get(':slug')
  async getCategoryBySlug(@Param('slug') slug: string) {
    const category = await this.categoryService.findBySlug(slug);
    
    // تولید متادیتای SEO
    const seoMeta = this.seoService.generateCategoryMeta(category);
    
    return {
      ...category,
      seo: seoMeta,
    };
  }
}
```

---

## ⚙️ تنظیمات محیطی

به فایل `.env` خود این متغیر را اضافه کنید:

```env
# URL فرانت‌اند برای تولید sitemap و canonical URLs
FRONTEND_URL=https://yourdomain.com
```

---

## 🌐 دسترسی به فایل‌های SEO

پس از راه‌اندازی، این URLها در دسترس خواهند بود:

- **Robots.txt**: `https://yourdomain.com/robots.txt`
- **Sitemap**: `https://yourdomain.com/sitemap.xml`

---

## 🎯 بهینه‌سازی‌های اضافی برای SEO

### 1. اضافه کردن فیلد slug به Entity محصولات

اگر فیلد `slug` ندارید، به entity محصول اضافه کنید:

```typescript
import { Entity, Column, BeforeInsert, BeforeUpdate } from 'typeorm';

@Entity('products')
export class Product {
  // ... سایر فیلدها

  @Column({ unique: true })
  slug: string;

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (this.name && !this.slug) {
      this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }
  }
}
```

### 2. اضافه کردن Canonical URL Middleware

برای جلوگیری از محتوای تکراری:

```typescript
// src/common/middleware/canonical.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CanonicalMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // حذف trailing slash
    if (req.path.endsWith('/') && req.path.length > 1) {
      const query = req.url.slice(req.path.length);
      res.redirect(301, req.path.slice(0, -1) + query);
      return;
    }
    
    // تبدیل به lowercase
    if (req.path !== req.path.toLowerCase()) {
      res.redirect(301, req.path.toLowerCase());
      return;
    }
    
    next();
  }
}
```

### 3. اضافه کردن Image Alt Tags

مطمئن شوید تصاویر محصولات دارای alt text هستند:

```typescript
@Entity('product_images')
export class ProductImage {
  @Column()
  url: string;

  @Column({ nullable: true })
  alt: string; // توضیح تصویر برای SEO

  @Column({ nullable: true })
  title: string;
}
```

### 4. اضافه کردن فیلدهای SEO به Entity محصول

```typescript
@Entity('products')
export class Product {
  // ... سایر فیلدها

  @Column({ nullable: true, length: 60 })
  metaTitle: string;

  @Column({ nullable: true, length: 160 })
  metaDescription: string;

  @Column({ nullable: true })
  metaKeywords: string;
}
```

### 5. اضافه کردن Rich Snippets برای نقد و بررسی‌ها

در سرویس SEO:

```typescript
generateProductWithReviews(product: any, reviews: any[]) {
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating,
      reviewCount: reviews.length,
    },
    review: reviews.map(review => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
      },
      author: {
        '@type': 'Person',
        name: review.userName,
      },
      datePublished: review.createdAt,
      reviewBody: review.comment,
    })),
  };
}
```

### 6. اضافه کردن Breadcrumb Schema

```typescript
generateBreadcrumb(category: any, product?: any) {
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'خانه',
      item: process.env.FRONTEND_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: category.name,
      item: `${process.env.FRONTEND_URL}/category/${category.slug}`,
    },
  ];

  if (product) {
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: product.name,
      item: `${process.env.FRONTEND_URL}/product/${product.slug}`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}
```

---

## 📊 نظارت و تست SEO

### ابزارهای پیشنهادی:

1. **Google Search Console**: ثبت سایت و بررسی عملکرد
2. **Lighthouse**: تست Performance و SEO
3. **Schema Markup Validator**: بررسی structured data
4. **Mobile-Friendly Test**: بررسی سازگاری با موبایل

### تست URLs:

```bash
# تست Robots.txt
curl http://localhost:3000/robots.txt

# تست Sitemap
curl http://localhost:3000/sitemap.xml

# تست محصول با SEO
curl http://localhost:3000/api/products/sample-product-slug
```

---

## ✅ چک‌لیست SEO

- [ ] نصب و فعال‌سازی SeoModule
- [ ] اضافه کردن FRONTEND_URL به .env
- [ ] اضافه کردن slug به تمام محصولات و دسته‌بندی‌ها
- [ ] پیاده‌سازی canonical URLs
- [ ] اضافه کردن alt text به تصاویر
- [ ] تولید sitemap.xml
- [ ] تنظیم robots.txt
- [ ] اضافه کردن structured data (Schema.org)
- [ ] بهینه‌سازی متاتگ‌ها (title, description)
- [ ] تست با Google Search Console
- [ ] بررسی سرعت سایت با Lighthouse
- [ ] تست responsive design
- [ ] اضافه کردن Open Graph tags
- [ ] پیاده‌سازی lazy loading برای تصاویر
- [ ] فشرده‌سازی تصاویر

---

## 🔗 منابع مفید

- [Google SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)
- [Schema.org](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Google Search Console](https://search.google.com/search-console)

---

## 💡 نکات مهم

1. **محتوای یکتا**: هر صفحه باید title و description منحصر به فرد داشته باشد
2. **طول متاتگ‌ها**: 
   - Title: حداکثر 60 کاراکتر
   - Description: حداکثر 160 کاراکتر
3. **کلمات کلیدی**: از کلمات کلیدی طبیعی و مرتبط استفاده کنید
4. **URL ساختار**: از URLهای خوانا و معنادار استفاده کنید
5. **سرعت**: سایت باید سریع باشد (زیر 3 ثانیه)
6. **موبایل**: سایت باید Mobile-Friendly باشد
7. **HTTPS**: حتماً از SSL استفاده کنید
8. **محتوای باکیفیت**: محتوای ارزشمند تولید کنید

---

**تاریخ ایجاد**: دسامبر 2024  
**نسخه**: 1.0.0
