# بهینه‌سازی‌های اضافی SEO

## 📱 1. اضافه کردن PWA Manifest

فایل `public/manifest.json`:

```json
{
  "name": "فروشگاه آنلاین",
  "short_name": "فروشگاه",
  "description": "خرید آنلاین با بهترین قیمت",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007bff",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🚀 2. اضافه کردن Cache Headers

```typescript
// src/common/middleware/cache-headers.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CacheHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Static assets
    if (req.url.match(/\.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    // API responses
    else if (req.url.startsWith('/api/')) {
      if (req.method === 'GET') {
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
      } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
    
    // HTML pages
    else {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
    
    next();
  }
}
```

---

## 🔒 3. اضافه کردن Security Headers

```typescript
// src/common/middleware/security-headers.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // X-XSS-Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer-Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions-Policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
  }
}
```

---

## 🖼️ 4. بهینه‌سازی تصاویر

### نصب پکیج Sharp:
```bash
npm install sharp
```

### سرویس فشرده‌سازی تصویر:

```typescript
// src/modules/media/image-optimization.service.ts
import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class ImageOptimizationService {
  async optimizeImage(
    inputPath: string,
    outputPath: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<void> {
    const {
      width,
      height,
      quality = 80,
      format = 'webp'
    } = options;

    let image = sharp(inputPath);

    // Resize
    if (width || height) {
      image = image.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert and compress
    switch (format) {
      case 'webp':
        image = image.webp({ quality });
        break;
      case 'jpeg':
        image = image.jpeg({ quality, progressive: true });
        break;
      case 'png':
        image = image.png({ quality, compressionLevel: 9 });
        break;
    }

    await image.toFile(outputPath);
  }

  async generateThumbnails(
    inputPath: string,
    outputDir: string,
    filename: string
  ): Promise<{ thumbnail: string; medium: string; large: string }> {
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);

    const sizes = {
      thumbnail: { width: 150, height: 150 },
      medium: { width: 500, height: 500 },
      large: { width: 1200, height: 1200 },
    };

    const results: any = {};

    for (const [key, size] of Object.entries(sizes)) {
      const outputFilename = `${name}-${key}.webp`;
      const outputPath = path.join(outputDir, outputFilename);
      
      await this.optimizeImage(inputPath, outputPath, {
        ...size,
        format: 'webp',
      });
      
      results[key] = outputFilename;
    }

    return results;
  }
}
```

---

## 📊 5. اضافه کردن Google Analytics / Tag Manager

```typescript
// src/modules/analytics/analytics.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('analytics')
export class AnalyticsController {
  @Get('gtag.js')
  getGtagScript(@Res() res: Response) {
    const gtagScript = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${process.env.GA_MEASUREMENT_ID}');
    `;
    
    res.type('application/javascript');
    res.send(gtagScript);
  }
}
```

به `.env` اضافه کنید:
```env
GA_MEASUREMENT_ID=G-XXXXXXXXXX
GTM_ID=GTM-XXXXXX
```

---

## 🗜️ 6. فعال‌سازی Compression

```typescript
// در main.ts
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable compression
  app.use(compression());
  
  await app.listen(3000);
}
```

نصب پکیج:
```bash
npm install compression
npm install -D @types/compression
```

---

## 🌐 7. اضافه کردن hreflang برای چند زبانه

```typescript
// در SeoService
generateHreflangTags(currentUrl: string, availableLanguages: string[]) {
  return availableLanguages.map(lang => ({
    rel: 'alternate',
    hreflang: lang,
    href: `${process.env.FRONTEND_URL}/${lang}${currentUrl}`
  }));
}
```

---

## 🔍 8. اضافه کردن JSON-LD برای Rich Results

```typescript
// src/modules/seo/json-ld.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class JsonLdService {
  // Organization
  generateOrganization() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'فروشگاه آنلاین',
      url: process.env.FRONTEND_URL,
      logo: `${process.env.FRONTEND_URL}/logo.png`,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+98-21-1234-5678',
        contactType: 'Customer Service',
        areaServed: 'IR',
        availableLanguage: ['Persian', 'English']
      },
      sameAs: [
        'https://www.facebook.com/yourshop',
        'https://www.instagram.com/yourshop',
        'https://twitter.com/yourshop'
      ]
    };
  }

  // LocalBusiness (اگر فروشگاه فیزیکی دارید)
  generateLocalBusiness() {
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'فروشگاه آنلاین',
      image: `${process.env.FRONTEND_URL}/storefront.jpg`,
      '@id': process.env.FRONTEND_URL,
      url: process.env.FRONTEND_URL,
      telephone: '+98-21-1234-5678',
      priceRange: '$$',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'خیابان ولیعصر',
        addressLocality: 'تهران',
        postalCode: '1234567890',
        addressCountry: 'IR'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 35.6892,
        longitude: 51.3890
      },
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Saturday',
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday'
        ],
        opens: '09:00',
        closes: '18:00'
      }
    };
  }

  // Product with Reviews
  generateProductWithReviews(product: any, reviews: any[]) {
    return {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name,
      image: product.images.map(img => img.url),
      description: product.description,
      sku: product.sku,
      brand: {
        '@type': 'Brand',
        name: product.brand || 'فروشگاه آنلاین'
      },
      offers: {
        '@type': 'Offer',
        url: `${process.env.FRONTEND_URL}/product/${product.slug}`,
        priceCurrency: 'IRR',
        price: product.price,
        availability: product.stock > 0 
          ? 'https://schema.org/InStock' 
          : 'https://schema.org/OutOfStock'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.averageRating,
        reviewCount: reviews.length
      },
      review: reviews.map(review => ({
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.rating,
          bestRating: 5
        },
        author: {
          '@type': 'Person',
          name: review.userName
        },
        datePublished: review.createdAt,
        reviewBody: review.comment
      }))
    };
  }

  // Offer Catalog
  generateOfferCatalog(products: any[]) {
    return {
      '@context': 'https://schema.org',
      '@type': 'OfferCatalog',
      name: 'محصولات فروشگاه',
      itemListElement: products.map((product, index) => ({
        '@type': 'Offer',
        position: index + 1,
        itemOffered: {
          '@type': 'Product',
          name: product.name,
          image: product.images[0]?.url,
          description: product.description,
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'IRR'
          }
        }
      }))
    };
  }
}
```

---

## ⚡ 9. بهینه‌سازی Core Web Vitals

### A. Lazy Loading برای تصاویر (در فرانت‌اند)
```html
<img 
  src="image.jpg" 
  loading="lazy" 
  alt="توضیحات تصویر"
  width="600"
  height="400"
/>
```

### B. Preconnect و DNS-Prefetch
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://cdn.example.com">
```

### C. Resource Hints
```typescript
// در کنترلر
@Header('Link', '</css/styles.css>; rel=preload; as=style')
@Header('Link', '</js/app.js>; rel=preload; as=script')
```

---

## 📈 10. اضافه کردن Structured Data Testing

```typescript
// src/modules/seo/seo-testing.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SeoTestingService {
  constructor(private readonly httpService: HttpService) {}

  async validateStructuredData(url: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://validator.schema.org/validate',
          { url }
        )
      );
      return response.data;
    } catch (error) {
      return { error: error.message };
    }
  }

  async testPageSpeed(url: string): Promise<any> {
    const apiKey = process.env.PAGESPEED_API_KEY;
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${apiKey}`
        )
      );
      return response.data;
    } catch (error) {
      return { error: error.message };
    }
  }
}
```

---

## 🎯 11. URL Canonicalization

```typescript
// src/common/filters/trailing-slash.filter.ts
import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class TrailingSlashMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    if (req.path !== '/' && req.path.endsWith('/')) {
      const query = req.url.slice(req.path.length);
      res.redirect(301, req.path.slice(0, -1) + query);
    } else {
      next();
    }
  }
}
```

---

## 🔐 12. SSL و HTTPS Redirect

```typescript
// src/common/middleware/force-https.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class ForceHttpsMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    if (
      process.env.NODE_ENV === 'production' &&
      req.headers['x-forwarded-proto'] !== 'https'
    ) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  }
}
```

---

## 📱 13. Mobile-First Responsive Meta Tags

در HTML Head:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

---

## ✅ چک‌لیست نهایی

- [ ] PWA Manifest
- [ ] Cache Headers
- [ ] Security Headers
- [ ] بهینه‌سازی تصاویر (WebP, Lazy Loading)
- [ ] Google Analytics / Tag Manager
- [ ] Compression
- [ ] hreflang Tags
- [ ] JSON-LD Structured Data
- [ ] Core Web Vitals Optimization
- [ ] Trailing Slash Redirect
- [ ] HTTPS Redirect
- [ ] Mobile-Friendly Meta Tags
- [ ] Resource Hints (Preconnect, DNS-Prefetch)
- [ ] Open Graph و Twitter Card
- [ ] Canonical URLs
- [ ] XML Sitemap
- [ ] robots.txt

---

**این فایل شامل تمام بهینه‌سازی‌های پیشرفته SEO است که می‌توانید به تدریج پیاده‌سازی کنید.**
