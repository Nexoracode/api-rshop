# 📦 یکپارچه‌سازی محصول با انبارداری - کامل شد!

## ✅ چه چیزهایی اضافه شد:

### 1. **product.service.ts** ✅
```diff
+ import { EventEmitter2 } from '@nestjs/event-emitter';
+ import { Logger } from '@nestjs/common';

+ // Event Classes
+ export class ProductCreatedEvent { ... }
+ export class ProductStockUpdatedEvent { ... }

  constructor(
+   private readonly eventEmitter: EventEmitter2,
+   private readonly logger = new Logger(ProductService.name),
  ) {}

  async create(data: CreateProductDto, userId?: number) {
    // ... ایجاد محصول
    
+   // ✅ ثبت موجودی اولیه در انبار
+   if (data.stock && data.stock > 0) {
+     this.eventEmitter.emit(
+       'product.created',
+       new ProductCreatedEvent(savedProduct.id, data.stock, userId || 1),
+     );
+   }
  }

  async update(id: number, data: UpdateProductDto, userId?: number) {
+   const oldStock = product.stock; // ذخیره موجودی قدیمی
    
    // ... بروزرسانی محصول
    
+   // ✅ بروزرسانی موجودی در انبار
+   if (data.stock != null && data.stock !== oldStock) {
+     this.eventEmitter.emit(
+       'product.stock.updated',
+       new ProductStockUpdatedEvent(savedProduct.id, oldStock, data.stock, userId || 1),
+     );
+   }
  }
```

### 2. **product.controller.ts** ✅
```diff
+ import { Req } from '@nestjs/common';

  @Post()
- create(@Body() data: CreateProductDto) {
+ create(@Body() data: CreateProductDto, @Req() req: any) {
+   const userId = req.user?.id;
-   return this.productService.create(data);
+   return this.productService.create(data, userId);
  }

  @Patch(':id')
- update(@Param('id') id: number, @Body() data: UpdateProductDto) {
+ update(@Param('id') id: number, @Body() data: UpdateProductDto, @Req() req: any) {
+   const userId = req.user?.id;
-   return this.productService.update(id, data);
+   return this.productService.update(id, data, userId);
  }
```

### 3. **product-inventory.listener.ts** ✅ (جدید)
Listener جدید برای پردازش Event های محصول:
- `product.created` → ثبت موجودی اولیه
- `product.stock.updated` → تنظیم موجودی (افزایش/کاهش)

### 4. **accounting.module.ts** ✅
```diff
+ import { ProductInventoryListener } from './listeners/product-inventory.listener';

  providers: [
    // ... سایر providers
    OrderAccountingListener,
+   ProductInventoryListener, // ✅ اضافه شد
  ],
```

---

## 🔄 جریان کار:

### حالت 1: ایجاد محصول جدید با موجودی

```
1. ادمین محصول جدید می‌سازد (با stock: 100)
   ↓
2. ProductService.create() فراخوانی می‌شود
   ↓
3. محصول در دیتابیس ذخیره می‌شود
   ↓
4. emit('product.created', { productId, stock: 100, userId })
   ↓
5. ProductInventoryListener.handleProductCreated()
   ↓
6. StockMovement ثبت می‌شود:
   - type: IN
   - quantity: 100
   - reason: ADJUSTMENT_INCREASE
   - description: "موجودی اولیه محصول"
   ↓
7. تایید خودکار
   ↓
8. ProductStock ایجاد می‌شود:
   - quantity: 100
   - available_quantity: 100
   ↓
9. ✅ تمام!
```

### حالت 2: بروزرسانی موجودی محصول

```
1. ادمین موجودی رو از 100 به 150 تغییر می‌ده
   ↓
2. ProductService.update() فراخوانی می‌شود
   ↓
3. oldStock: 100, newStock: 150 ذخیره می‌شود
   ↓
4. محصول بروز می‌شود
   ↓
5. emit('product.stock.updated', { productId, oldStock: 100, newStock: 150, userId })
   ↓
6. ProductInventoryListener.handleProductStockUpdated()
   ↓
7. difference = 150 - 100 = +50
   ↓
8. StockMovement ثبت می‌شود:
   - type: IN
   - quantity: 50
   - reason: ADJUSTMENT_INCREASE
   - description: "افزایش موجودی توسط مدیر - 50 عدد (100 → 150)"
   ↓
9. تایید خودکار
   ↓
10. ProductStock بروز می‌شود:
    - quantity: 150
    - available_quantity: 150
   ↓
11. ✅ تمام!
```

### حالت 3: کاهش موجودی

```
1. ادمین موجودی رو از 150 به 120 کم می‌کنه
   ↓
2. difference = 120 - 150 = -30
   ↓
3. StockMovement ثبت می‌شود:
   - type: OUT
   - quantity: 30
   - reason: ADJUSTMENT_DECREASE
   - description: "کاهش موجودی توسط مدیر - 30 عدد (150 → 120)"
   ↓
4. ProductStock بروز می‌شود:
   - quantity: 120
```

---

## 📊 داده‌های ثبت شده:

### StockMovement (موجودی اولیه):
```json
{
  "movementNumber": "IN-202412-0001",
  "type": "IN",
  "status": "APPROVED",
  "productId": 15,
  "warehouseId": 1,
  "quantity": 100,
  "reasonIn": "ADJUSTMENT_INCREASE",
  "description": "موجودی اولیه محصول - 100 عدد",
  "quantityBefore": 0,
  "quantityAfter": 100,
  "metadata": {
    "isInitialStock": true
  }
}
```

### StockMovement (افزایش موجودی):
```json
{
  "movementNumber": "IN-202412-0002",
  "type": "IN",
  "status": "APPROVED",
  "productId": 15,
  "warehouseId": 1,
  "quantity": 50,
  "reasonIn": "ADJUSTMENT_INCREASE",
  "description": "افزایش موجودی توسط مدیر - 50 عدد (100 → 150)",
  "quantityBefore": 100,
  "quantityAfter": 150,
  "metadata": {
    "isManualAdjustment": true,
    "oldStock": 100,
    "newStock": 150
  }
}
```

### StockMovement (کاهش موجودی):
```json
{
  "movementNumber": "OUT-202412-0003",
  "type": "OUT",
  "status": "APPROVED",
  "productId": 15,
  "warehouseId": 1,
  "quantity": 30,
  "reasonOut": "ADJUSTMENT_DECREASE",
  "description": "کاهش موجودی توسط مدیر - 30 عدد (150 → 120)",
  "quantityBefore": 150,
  "quantityAfter": 120,
  "metadata": {
    "isManualAdjustment": true,
    "oldStock": 150,
    "newStock": 120
  }
}
```

### ProductStock:
```json
{
  "productId": 15,
  "warehouseId": 1,
  "quantity": 120,
  "reservedQuantity": 0,
  "availableQuantity": 120,
  "minQuantity": 10,
  "maxQuantity": 1000,
  "alertLevel": "SUFFICIENT"
}
```

---

## 🧪 تست:

### 1. ایجاد محصول جدید:
```http
POST http://localhost:3001/product

{
  "name": "لپ‌تاپ ایسوس",
  "price": 25000000,
  "stock": 50,
  "categoryId": 1,
  "brandId": 1,
  "mediaIds": [1, 2]
}
```

**چک کن:**
```sql
-- چک StockMovement
SELECT * FROM stock_movements WHERE product_id = [PRODUCT_ID];

-- چک ProductStock
SELECT * FROM product_stocks WHERE product_id = [PRODUCT_ID];
```

### 2. بروزرسانی موجودی:
```http
PATCH http://localhost:3001/product/[PRODUCT_ID]

{
  "stock": 80
}
```

**چک کن:**
```sql
-- باید حرکت جدید اضافه شده باشه
SELECT * FROM stock_movements WHERE product_id = [PRODUCT_ID] ORDER BY id DESC;

-- موجودی باید 80 باشه
SELECT * FROM product_stocks WHERE product_id = [PRODUCT_ID];
```

### 3. بررسی Log ها:
```
[ProductService] 🎉 Event 'product.created' emitted for product 15 with stock 50
[ProductInventoryListener] رویداد ایجاد محصول دریافت شد - Product: 15, Stock: 50
[ProductInventoryListener] موجودی اولیه محصول 15 در انبار انبار مرکزی ثبت شد

[ProductService] 🎉 Event 'product.stock.updated' emitted for product 15: 50 → 80
[ProductInventoryListener] رویداد بروزرسانی موجودی دریافت شد - Product: 15, 50 → 80
[ProductInventoryListener] موجودی محصول 15 افزایش یافت: 30 عدد
```

---

## 📈 مزایا:

✅ **خودکار**: موجودی خودکار ثبت می‌شه
✅ **کامل**: تاریخچه کامل تغییرات موجودی
✅ **ایمن**: همه داخل Transaction
✅ **قابل ردیابی**: metadata کامل برای هر حرکت
✅ **جداسازی**: Product و Inventory مستقل هستن
✅ **تایید خودکار**: نیازی به تایید دستی نیست

---

## 🎯 نکات مهم:

1. **موجودی اولیه**: فقط زمانی ثبت می‌شه که `stock > 0` باشه
2. **تغییرات**: فقط زمانی Event emit می‌شه که `stock` واقعاً تغییر کرده باشه
3. **userId**: برای audit trail از `req.user.id` استفاده می‌شه
4. **Transaction**: همه عملیات در Transaction امن هستند
5. **Error Handling**: اگر انبارداری خطا کنه، محصول باز هم ذخیره می‌شه

---

## ✅ چک‌لیست:

- [x] product.service.ts بروز شد
- [x] product.controller.ts بروز شد
- [x] ProductInventoryListener ایجاد شد
- [x] accounting.module.ts بروز شد
- [ ] Server restart شد
- [ ] یک محصول تست ایجاد شد
- [ ] StockMovement ثبت شد ✅
- [ ] ProductStock ایجاد شد ✅
- [ ] موجودی بروز شد ✅
- [ ] Log ها صحیح هستند ✅

---

**آماده است! از حالا محصولات خودکار در انبار ثبت می‌شن!** 🎉📦
