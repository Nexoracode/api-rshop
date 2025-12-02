# 📋 خلاصه تغییرات Order & Invoice & Stock Management

## ✅ تغییرات انجام شده

### 1. 📦 Order Service - Stock Management

#### ویژگی‌های اضافه شده:

**A. متد `decreaseStock()`**
```typescript
- کم کردن خودکار موجودی محصولات/واریانت‌ها
- بررسی کافی بودن موجودی قبل از کم کردن
- پیام خطای واضح در صورت کمبود موجودی
- Support برای هر دو Product و Variant
```

**B. متد `incrementPromotionUsage()`**
```typescript
- افزایش شمارنده استفاده از پروموشن‌ها
- فراخوانی بعد از پرداخت موفق
- لاگ تمام عملیات
```

**C. متد `confirmOrderPayment()`** ⭐ جدید
```typescript
- تایید نهایی سفارش بعد از پرداخت موفق
- کم کردن موجودی محصولات
- افزایش usage count پروموشن‌ها
- تغییر وضعیت سفارش به PROCESSING
- Transaction امن
```

#### بهبودهای موجود:

**1. بررسی موجودی قبل از ساخت سفارش:**
```typescript
// در متد createFromCard()
for (const ci of card.items) {
    if (ci.variant) {
        // بررسی موجودی واریانت
    } else {
        // بررسی موجودی محصول اصلی
    }
}
```

**2. Integration کامل با Promotion:**
```typescript
- استفاده از CheckPromotionUseCase
- ذخیره promotionDetails در سفارش
- محاسبه صحیح تخفیف‌ها
- پشتیبانی از Free Shipping
```

**3. Transaction Safety:**
```typescript
- تمام عملیات در Transaction
- Rollback خودکار در صورت خطا
- Lock روی Card برای جلوگیری از Race Condition
```

### 2. 🧾 Invoice Service & Entity

#### تغییرات Entity:

**فیلدهای جدید:**
```typescript
// Promotion Information
promotionCode: string | null
promotionDiscountAmount: number
promotionDetails: {
    promotionId: number;
    name: string;
    type: string;
    amount: number;
}[]

// Shipping Information
shippingCost: number
```

**فیلدهای قدیمی (legacy):**
```typescript
// این‌ها برای backward compatibility نگه داشته شدند
couponCode?: string
couponDiscountAmount?: number
```

#### بهبودهای Service:

**1. متد `createFromOrder()` بهبود یافته:**
```typescript
- کپی کامل اطلاعات Promotion از Order
- محاسبه صحیح totalPayable
- Relations کامل برای دریافت اطلاعات
```

**2. متد `updateInvoiceStatus()` جدید:**
```typescript
- بروزرسانی وضعیت Invoice
- ذخیره پیام و کد خطا در صورت نیاز
- استفاده در Payment Flow
```

**3. متد `getAllInvoices()` برای ادمین:**
```typescript
- دریافت تمام فاکتورها
- Relations کامل
```

### 3. 🔄 Order Module

**Dependencies اضافه شده:**
```typescript
- PromotionModule (import)
- VariantProduct Entity
- Product Entity
```

**Providers:**
```typescript
- CheckPromotionUseCase (از طریق PromotionModule)
- PromotionRepository (از طریق PromotionModule)
```

### 4. 📊 Data Flow کامل

```
1. کاربر سفارش می‌دهد (createFromCard)
   ↓
2. بررسی موجودی اولیه
   ↓
3. اعمال تخفیف‌های Promotion
   ↓
4. ذخیره Order با جزئیات Promotion
   ↓
5. کاربر پرداخت می‌کند
   ↓
6. Payment Service فراخوانی می‌کند:
   → orderService.confirmOrderPayment()
   ↓
7. کم شدن موجودی
   ↓
8. افزایش usage count پروموشن‌ها
   ↓
9. تغییر وضعیت به PROCESSING
   ↓
10. ایجاد Invoice با جزئیات کامل
```

---

## 🎯 نکات مهم

### 1. فراخوانی از Payment Service

**باید در Payment Service این متد فراخوانی شود:**

```typescript
// در payment.service.ts بعد از پرداخت موفق:

async verifyPayment(authority: string) {
    // ... verify payment logic
    
    if (paymentSuccessful) {
        // ✅ فراخوانی confirmOrderPayment
        await this.orderService.confirmOrderPayment(order.id);
        
        // ایجاد Invoice
        await this.invoiceService.createFromOrder(
            manager, 
            order.id, 
            order.user
        );
    }
}
```

### 2. مدیریت خطا

**خطاهای احتمالی:**

```typescript
- "موجودی کافی نیست" → BadRequestException
- "سفارش یافت نشد" → NotFoundException
- "وضعیت سفارش مناسب نیست" → BadRequestException
```

**همه خطاها در Transaction:**
- اگر موجودی کم نشود → Rollback
- اگر Promotion increment نشود → Rollback
- اگر هر مرحله fail شود → Rollback

### 3. وضعیت‌های Order

```typescript
AWAITING_PAYMENT           // منتظر پرداخت
  ↓ (پرداخت موفق)
PROCESSING                 // در حال پردازش (موجودی کم شده)
  ↓
SHIPPED                    // ارسال شده
  ↓
DELIVERED                  // تحویل داده شده
```

### 4. Stock Management

**برای محصولات:**
```typescript
product.stock -= quantity
```

**برای واریانت‌ها:**
```typescript
variant.stock -= quantity
```

**بررسی موجودی:**
```typescript
if (stock < quantity) {
    throw new BadRequestException(
        `موجودی کافی نیست. موجودی فعلی: ${stock}`
    );
}
```

---

## 🚀 استفاده در Production

### 1. Migration های مورد نیاز

```sql
-- اضافه کردن فیلدهای جدید به Invoice
ALTER TABLE invoices 
ADD COLUMN promotion_code VARCHAR(191),
ADD COLUMN promotion_discount_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN promotion_details JSON,
ADD COLUMN shipping_cost DECIMAL(15,2) DEFAULT 0;

-- Index برای بهبود Performance
CREATE INDEX idx_order_status ON orders(status);
CREATE INDEX idx_invoice_status ON invoices(status);
```

### 2. Testing Checklist

```
✅ تست کم شدن موجودی محصول
✅ تست کم شدن موجودی واریانت
✅ تست خطا در صورت کمبود موجودی
✅ تست افزایش usage count پروموشن
✅ تست Rollback در صورت خطا
✅ تست ایجاد Invoice با اطلاعات کامل
✅ تست Free Shipping
✅ تست چند پروموشن با هم
```

### 3. Monitoring

**Metrics مهم:**
```
- تعداد سفارش‌های موفق در روز
- تعداد خطاهای کمبود موجودی
- میانگین تخفیف‌های اعمال شده
- تعداد استفاده از پروموشن‌ها
```

---

## 📝 TODO

### Priority 1 (فوری):
- [ ] Integration با Payment Service
- [ ] تست کامل Flow
- [ ] Migration های Database

### Priority 2 (مهم):
- [ ] افزودن Logging برای Stock Changes
- [ ] Dashboard برای نمایش موجودی
- [ ] Alert برای موجودی کم

### Priority 3 (آینده):
- [ ] بازگشت موجودی در صورت لغو سفارش
- [ ] History تغییرات موجودی
- [ ] Inventory Management System

---

## 🎉 نتیجه

✅ Stock Management کامل  
✅ Integration با Promotion  
✅ Invoice با جزئیات کامل  
✅ Transaction Safety  
✅ Error Handling جامع  

**وضعیت:** آماده برای Production (بعد از Testing)
