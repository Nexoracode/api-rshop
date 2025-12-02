# 🚀 Promotion Module - Quick Start Guide

راهنمای سریع شروع کار با ماژول Promotion

---

## ⚡ نصب سریع (5 دقیقه)

### 1. بررسی Prerequisites

```bash
✓ Node.js >= 20.x
✓ NestJS >= 11.x
✓ MySQL >= 8.x
✓ TypeScript >= 5.x
```

### 2. تنظیم Environment Variables

در فایل `.env.development` یا `.env.production`:

```env
# SMS Configuration (برای کوپن خرید بعدی)
SMS_PROVIDER=ippanel
IPPANEL_API_KEY=your_api_key_here
IPPANEL_FROM_NUMBER=+983000505

# Cache (اختیاری اما توصیه می‌شود)
PROMOTION_CACHE_ENABLED=true
PROMOTION_CACHE_TTL=300
```

### 3. اجرای Migration

```bash
# ایجاد جداول
npm run mig:run
```

### 4. شروع سرور

```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

✅ Done! ماژول آماده است 🎉

---

## 📝 اولین پروموشن خود را بسازید

### مثال 1: کد تخفیف ساده

```bash
curl -X POST http://localhost:3001/api/admin/promotions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "تخفیف 10 درصدی",
    "type": "coupon",
    "code": "WELCOME10",
    "starts_at": "2025-01-01T00:00:00.000Z",
    "ends_at": "2025-12-31T23:59:59.000Z",
    "usage_limit": 100,
    "is_active": true,
    "conditions": [
      {
        "type": "min_order_amount",
        "min_amount": 100000
      }
    ],
    "actions": [
      {
        "type": "percent_discount",
        "value": 10
      }
    ]
  }'
```

### مثال 2: فروش ویژه محصول

```bash
curl -X POST http://localhost:3001/api/admin/promotions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "فروش ویژه لپ‌تاپ",
    "type": "flash_deal",
    "starts_at": "2025-12-01T00:00:00.000Z",
    "ends_at": "2025-12-05T23:59:59.000Z",
    "is_active": true,
    "conditions": [
      {
        "type": "product",
        "products": [
          {
            "product_id": 100
          }
        ]
      }
    ],
    "actions": [
      {
        "type": "amount_discount",
        "value": 500000
      },
      {
        "type": "free_shipping"
      }
    ]
  }'
```

---

## 🧪 تست کردن

### بررسی تخفیف برای سفارش

```bash
curl -X POST http://localhost:3001/api/promotions/check \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "code": "WELCOME10",
    "subtotal": 500000,
    "is_first_order": false,
    "items": [
      {
        "product_id": 10,
        "quantity": 2,
        "unit_price": 250000,
        "category_id": 3
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "message": "تخفیف‌ها با موفقیت محاسبه شد",
  "data": {
    "discount": 50000,
    "free_shipping": false,
    "applied_promotions": [
      {
        "promotion": {
          "id": 1,
          "name": "تخفیف 10 درصدی",
          "type": "coupon",
          "code": "WELCOME10"
        },
        "discount_amount": 50000
      }
    ]
  }
}
```

---

## 📚 سناریوهای رایج

### سناریو 1: تخفیف اولین خرید

```json
{
  "name": "هدیه خوش‌آمدگویی",
  "type": "first_order",
  "starts_at": "2025-01-01T00:00:00.000Z",
  "ends_at": "2025-12-31T23:59:59.000Z",
  "is_active": true,
  "conditions": [
    {
      "type": "first_order"
    }
  ],
  "actions": [
    {
      "type": "percent_discount",
      "value": 15
    }
  ]
}
```

### سناریو 2: ارسال رایگان برای خرید بالا

```json
{
  "name": "ارسال رایگان",
  "type": "free_shipping",
  "starts_at": "2025-01-01T00:00:00.000Z",
  "ends_at": "2025-12-31T23:59:59.000Z",
  "is_active": true,
  "conditions": [
    {
      "type": "min_order_amount",
      "min_amount": 1000000
    }
  ],
  "actions": [
    {
      "type": "free_shipping"
    }
  ]
}
```

### سناریو 3: تخفیف دسته‌بندی

```json
{
  "name": "تخفیف لوازم الکترونیکی",
  "type": "flash_deal",
  "starts_at": "2025-12-01T00:00:00.000Z",
  "ends_at": "2025-12-07T23:59:59.000Z",
  "is_active": true,
  "conditions": [
    {
      "type": "category",
      "category_ids": [1, 2, 3]
    }
  ],
  "actions": [
    {
      "type": "percent_discount",
      "value": 20
    }
  ]
}
```

### سناریو 4: Bundle Discount

```json
{
  "name": "پکیج ویژه",
  "type": "flash_deal",
  "starts_at": "2025-12-01T00:00:00.000Z",
  "ends_at": "2025-12-31T23:59:59.000Z",
  "is_active": true,
  "conditions": [
    {
      "type": "product",
      "products": [
        {"product_id": 100},
        {"product_id": 101},
        {"product_id": 102}
      ]
    }
  ],
  "actions": [
    {
      "type": "amount_discount",
      "value": 1000000
    }
  ]
}
```

---

## 🔧 استفاده در کد

### در Order Service

```typescript
import { CheckPromotionUseCase } from '@/modules/promotion/application/usecases/check-promotion.usecase';

@Injectable()
export class OrderService {
  constructor(
    private readonly checkPromotionUseCase: CheckPromotionUseCase
  ) {}

  async createOrder(orderDto: CreateOrderDto) {
    // 1. محاسبه subtotal
    const subtotal = this.calculateSubtotal(orderDto.items);

    // 2. چک کردن تخفیف‌ها
    const promotionResult = await this.checkPromotionUseCase.execute({
      userId: orderDto.userId,
      code: orderDto.couponCode,
      subtotal,
      isFirstOrder: await this.isFirstOrder(orderDto.userId),
      items: orderDto.items
    });

    // 3. ایجاد سفارش با تخفیف
    const order = await this.orderRepo.save({
      ...orderDto,
      subtotal,
      discountAmount: promotionResult.discount,
      freeShipping: promotionResult.freeShipping,
      total: subtotal - promotionResult.discount
    });

    return order;
  }
}
```

### در Cart Service

```typescript
@Injectable()
export class CartService {
  constructor(
    private readonly checkPromotionUseCase: CheckPromotionUseCase
  ) {}

  async applyCoupon(userId: number, couponCode: string) {
    const cart = await this.getCart(userId);
    
    const result = await this.checkPromotionUseCase.execute({
      userId,
      code: couponCode,
      subtotal: cart.total,
      isFirstOrder: false,
      items: cart.items
    });

    if (result.appliedPromotions.length === 0) {
      throw new BadRequestException('کد تخفیف معتبر نیست');
    }

    await this.cartRepo.update(cart.id, {
      couponCode,
      discount: result.discount
    });

    return {
      message: 'کد تخفیف اعمال شد',
      discount: result.discount
    };
  }
}
```

---

## 📖 API Documentation

### Swagger UI

پس از اجرای سرور، به آدرس زیر بروید:

```
http://localhost:3001/docs
```

در Swagger تمام Endpoints، Examples، و Schemas را خواهید دید.

### API Endpoints

#### Admin (نیاز به Authentication)

| Method | Endpoint | توضیحات |
|--------|----------|---------|
| POST | `/api/admin/promotions` | ایجاد پروموشن |
| GET | `/api/admin/promotions` | لیست پروموشن‌ها |
| GET | `/api/admin/promotions/:id` | جزئیات پروموشن |
| PUT | `/api/admin/promotions/:id` | بروزرسانی |
| DELETE | `/api/admin/promotions/:id` | حذف |

#### Public

| Method | Endpoint | توضیحات |
|--------|----------|---------|
| POST | `/api/promotions/check` | بررسی تخفیف |

---

## 🐛 مشکلات رایج

### مشکل 1: کد تخفیف اعمال نمی‌شود

**علت:** شرایط promotion برآورده نیست

**راه‌حل:**
1. بررسی کنید `is_active = true`
2. بررسی کنید تاریخ شروع/پایان
3. بررسی کنید شرایط (min_amount, product, category)
4. بررسی کنید usage_limit پر نشده باشد

### مشکل 2: Error: "Promotion not found"

**علت:** کد تخفیف وجود ندارد یا منقضی شده

**راه‌حل:**
```sql
-- بررسی وجود کد
SELECT * FROM promotions WHERE code = 'YOUR_CODE';

-- بررسی فعال بودن
SELECT * FROM promotions 
WHERE code = 'YOUR_CODE' 
  AND is_active = 1 
  AND starts_at <= NOW() 
  AND ends_at >= NOW();
```

### مشکل 3: Response Time زیاد

**علت:** N+1 Query Problem یا Cache غیرفعال

**راه‌حل:**
```env
# فعال کردن Cache
PROMOTION_CACHE_ENABLED=true
PROMOTION_CACHE_TTL=300
```

---

## 📊 مثال‌های پیشرفته

### تخفیف ترکیبی (محصول + حداقل خرید)

```json
{
  "name": "تخفیف ویژه آیفون",
  "type": "flash_deal",
  "conditions": [
    {
      "type": "product",
      "products": [
        {
          "product_id": 100,
          "variant_ids": [501, 502]
        }
      ]
    },
    {
      "type": "min_order_amount",
      "min_amount": 30000000
    }
  ],
  "actions": [
    {
      "type": "percent_discount",
      "value": 12
    },
    {
      "type": "free_shipping"
    }
  ]
}
```

### کوپن خرید بعدی

```json
{
  "name": "جایزه وفاداری",
  "type": "next_order_reward",
  "conditions": [
    {
      "type": "min_order_amount",
      "min_amount": 5000000
    }
  ],
  "actions": [
    {
      "type": "next_order_coupon",
      "value": 500000,
      "meta": {
        "expires_in_days": 30,
        "min_order_amount": 2000000
      }
    }
  ]
}
```

---

## 🎓 منابع بیشتر

- 📖 [README کامل](./README.md)
- 📝 [CHANGELOG](./CHANGELOG.md)
- 🚀 [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- 💻 [Usage Examples](./examples/usage-examples.ts)
- 📊 [Summary](./SUMMARY.md)

---

## ❓ سوالات متداول

### Q: آیا می‌توانم چند کد تخفیف با هم استفاده کنم؟

A: فعلاً خیر، اما تخفیف‌های اتوماتیک (مثل first_order، flash_deal) با کد تخفیف ترکیب می‌شوند.

### Q: چگونه می‌توانم تخفیف فقط برای یک variant خاص بدهم؟

A: در condition از این ساختار استفاده کنید:
```json
{
  "type": "product",
  "products": [
    {
      "product_id": 100,
      "variant_ids": [501]
    }
  ]
}
```

### Q: آیا می‌توانم تخفیف برای کاربر خاص تعریف کنم؟

A: بله:
```json
{
  "type": "user",
  "user_id": 123
}
```

### Q: چگونه می‌توانم آمار استفاده از پروموشن را ببینم؟

A: از endpoint زیر استفاده کنید:
```
GET /api/admin/promotions/:id
```

---

## 🎯 چیزهایی که باید بدانید

### ✅ Do's
- همیشه `is_active` را چک کنید
- تاریخ شروع/پایان را درست تنظیم کنید
- برای production حتماً `usage_limit` بگذارید
- Cache را فعال کنید
- Logging را بررسی کنید

### ❌ Don'ts
- کدهای duplicate نسازید
- تاریخ پایان را قبل از تاریخ شروع نگذارید
- همه پروموشن‌ها را فعال نگذارید
- بدون تست در production اضافه نکنید

---

**آماده هستید! 🚀**

برای شروع کار با Promotion Module همین الان می‌توانید اولین تخفیف خود را بسازید.

اگر سوالی دارید، [README کامل](./README.md) را مطالعه کنید یا با تیم توسعه در ارتباط باشید.

**Good Luck! 💪**
