# ⚡ راه‌اندازی سریع SEO - 5 دقیقه

## گام 1️⃣: اضافه کردن SeoModule به app.module.ts

```typescript
import { SeoModule } from './modules/seo/seo.module'; // ✅ اضافه کنید

@Module({
  imports: [
    AppConfigModule,
    // ... سایر ماژول‌ها
    SeoModule, // ✅ اضافه کنید
  ],
  controllers: [AppController, HelperController],
  providers: [AppService, CatalogImportService],
})
export class AppModule { }
```

---

## گام 2️⃣: اضافه کردن متغیر محیطی

به فایل `.env.production` یا `.env.development` اضافه کنید:

```env
FRONTEND_URL=https://yourdomain.com
```

---

## گام 3️⃣: تست راه‌اندازی

### شروع سرور:
```bash
npm run start:dev
```

### تست URLها:

1. **Robots.txt**: 
   ```
   http://localhost:3000/robots.txt
   ```

2. **Sitemap**: 
   ```
   http://localhost:3000/sitemap.xml
   ```

---

## گام 4️⃣: استفاده در کنترلرها

### مثال 1: استفاده در Product Controller

به فایل `src/modules/product/product.controller.ts` این کد را اضافه کنید:

```typescript
import { SeoService } from '../seo/seo.service'; // ✅ import کنید

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly seoService: SeoService, // ✅ inject کنید
  ) {}

  @Get(':slug')
  async getProductBySlug(@Param('slug') slug: string) {
    const product = await this.productService.findBySlug(slug);
    
    // ✅ تولید SEO metadata
    const seoMeta = this.seoService.generateProductMeta(product);
    
    return {
      ...product,
      seo: seoMeta, // ✅ اضافه کردن به response
    };
  }
}
```

### مثال 2: استفاده در Category Controller

```typescript
import { SeoService } from '../seo/seo.service';

@Controller('categories')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly seoService: SeoService,
  ) {}

  @Get(':slug')
  async getCategoryBySlug(@Param('slug') slug: string) {
    const category = await this.categoryService.findBySlug(slug);
    const seoMeta = this.seoService.generateCategoryMeta(category);
    
    return {
      ...category,
      seo: seoMeta,
    };
  }
}
```

---

## گام 5️⃣: اضافه کردن SeoService به Module محصولات

در `src/modules/product/product.module.ts`:

```typescript
import { SeoModule } from '../seo/seo.module'; // ✅ import

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    SeoModule, // ✅ اضافه کنید
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
```

مشابه برای `category.module.ts`:

```typescript
import { SeoModule } from '../seo/seo.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    SeoModule, // ✅ اضافه کنید
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
```

---

## ✅ تمام! 

حالا APIهای شما SEO metadata برمی‌گردانند:

### نمونه Response:

```json
{
  "id": 1,
  "name": "گوشی سامسونگ Galaxy S24",
  "slug": "samsung-galaxy-s24",
  "price": 25000000,
  "description": "...",
  "seo": {
    "title": "گوشی سامسونگ Galaxy S24 | فروشگاه آنلاین",
    "description": "خرید گوشی سامسونگ Galaxy S24 با بهترین قیمت...",
    "keywords": "گوشی سامسونگ, Galaxy S24, خرید موبایل",
    "canonical": "https://yourdomain.com/product/samsung-galaxy-s24",
    "ogTitle": "گوشی سامسونگ Galaxy S24",
    "ogDescription": "خرید گوشی سامسونگ Galaxy S24...",
    "ogImage": "https://yourdomain.com/images/s24.jpg",
    "structuredData": {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": "گوشی سامسونگ Galaxy S24",
      "offers": {
        "@type": "Offer",
        "price": 25000000,
        "priceCurrency": "IRR"
      }
    }
  }
}
```

---

## 🎯 گام‌های بعدی (اختیاری):

1. ✅ اضافه کردن فیلدهای SEO به Entity محصولات (`metaTitle`, `metaDescription`)
2. ✅ پیاده‌سازی Breadcrumb Schema
3. ✅ اضافه کردن alt text به تصاویر
4. ✅ بهینه‌سازی تصاویر با WebP
5. ✅ اضافه کردن Google Analytics

**مستندات کامل:**
- `SEO_IMPLEMENTATION_GUIDE.md` - راهنمای کامل پیاده‌سازی
- `ADVANCED_SEO_OPTIMIZATIONS.md` - بهینه‌سازی‌های پیشرفته

---

**زمان راه‌اندازی: ~5 دقیقه** ⏱️  
**نتیجه: SEO آماده برای تولید** 🚀
