# 🔄 نمودار جریان یکپارچه‌سازی

## 📊 جریان کامل از سفارش تا حسابداری

```
┌─────────────────────────────────────────────────────────────┐
│                   مشتری سفارش می‌دهد                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Order ایجاد می‌شود                                          │
│  - status: AWAITING_PAYMENT                                 │
│  - items: محصولات                                           │
│  - total: مبلغ کل                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  مشتری به درگاه پرداخت می‌رود                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌──────────────────┐        ┌──────────────────┐
│  پرداخت موفق     │        │  پرداخت ناموفق   │
│  ✅              │        │  ❌              │
└────────┬─────────┘        └──────────────────┘
         │                          │
         │                          └─> پایان ❌
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  PaymentService.verifyPayment()                             │
│  1. Payment.status = SUCCESS                                │
│  2. Payment.refId = xxx                                     │
│  3. Order.status = PAID                                     │
│  4. ✨ emit('order.paid', OrderPaidEvent)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  OrderAccountingListener.handleOrderPaid() 🎧               │
│  - فراخوانی OrderAccountingService                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  OrderAccountingService.processOrderPayment()               │
│  📦 Transaction شروع می‌شود                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
    ┌─────────────────┴─────────────────┐
    │                                   │
    ▼                                   ▼
┌────────────────────────┐    ┌──────────────────────────┐
│  ثبت تراکنش‌های مالی  │    │  کم کردن موجودی انبار   │
│  💰                    │    │  📦                      │
└────────┬───────────────┘    └──────────┬───────────────┘
         │                               │
         │  1. تراکنش اصلی (فروش)       │  برای هر محصول:
         │     - amount: total           │  1. StockMovement OUT
         │     - category: PRODUCT_SALE  │     - quantity: x
         │                               │     - reason: SALE
         │  2. تراکنش ارسال (اختیاری)   │  2. تایید خودکار
         │     - category: SHIPPING_FEE  │  3. کم شدن موجودی
         │                               │
         │  3. تراکنش بسته‌بندی          │
         │     - category: GIFT_FEE      │
         │                               │
         │  4. تایید خودکار              │
         └───────────────┬───────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  ✅ Transaction Commit                                      │
│  همه چیز با موفقیت ثبت شد                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Order.status = COMPLETED                                   │
│  مشتری اطلاع‌رسانی می‌شود                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 جریان مرجوعی

```
┌─────────────────────────────────────────────────────────────┐
│  مشتری درخواست مرجوعی می‌دهد                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  OrderService.returnOrder()                                 │
│  1. Order.status = RETURNED                                 │
│  2. ✨ emit('order.returned', OrderReturnedEvent)          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  OrderAccountingListener.handleOrderReturned() 🎧           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  OrderAccountingService.processOrderReturn()                │
│  📦 Transaction شروع می‌شود                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
    ┌─────────────────┴─────────────────┐
    │                                   │
    ▼                                   ▼
┌────────────────────────┐    ┌──────────────────────────┐
│  ثبت تراکنش برگشت وجه │    │  افزایش موجودی انبار    │
│  💸                    │    │  📦                      │
└────────┬───────────────┘    └──────────┬───────────────┘
         │                               │
         │  Transaction EXPENSE          │  برای هر محصول:
         │  - category: REFUND           │  1. StockMovement IN
         │  - amount: order.total        │     - quantity: x
         │                               │     - reason: RETURN
         └───────────────┬───────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  ✅ Transaction Commit                                      │
│  برگشت وجه و موجودی ثبت شد                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 ساختار داده در دیتابیس

### Transaction Record (مثال)
```json
{
  "id": 123,
  "type": "INCOME",
  "status": "APPROVED",
  "amount": 1500000,
  "category": "PRODUCT_SALE",
  "paymentMethod": "ONLINE_GATEWAY",
  "accountId": 1,
  "orderId": 456,
  "description": "دریافت مبلغ سفارش #456 - 3 محصول",
  "referenceNumber": "A00000000000000000000000000123456",
  "transactionDate": "2024-12-07T10:30:00Z",
  "metadata": {
    "breakdown": {
      "productSales": 1200000,
      "shippingFee": 250000,
      "giftWrappingFee": 50000,
      "total": 1500000
    },
    "paymentId": 789,
    "userId": 10,
    "gateway": "ZARINPAL",
    "refId": "1234567890",
    "promotionCode": "SUMMER2024",
    "promotionDiscount": 100000
  }
}
```

### StockMovement Record (مثال)
```json
{
  "id": 234,
  "movementNumber": "OUT-202412-0001",
  "type": "OUT",
  "status": "APPROVED",
  "productId": 15,
  "warehouseId": 1,
  "quantity": 2,
  "unitCost": 600000,
  "totalCost": 1200000,
  "reasonOut": "SALE",
  "orderId": 456,
  "description": "فروش محصول لپ‌تاپ ایسوس - سفارش #456",
  "movementDate": "2024-12-07T10:30:00Z",
  "quantityBefore": 50,
  "quantityAfter": 48,
  "metadata": {
    "orderItemId": 567,
    "customerId": 10
  }
}
```

---

## 🎯 Event Flow

```
PaymentService                OrderService
     │                             │
     │ verifyPayment()             │
     │ ───────────────────────────>│
     │                             │
     │                             │ updateStatus(PAID)
     │                             │
     │                             │
     │    emit('order.paid')       │
     │ <───────────────────────────│
     ▼                             │
EventEmitter                       │
     │                             │
     │                             │
     ▼                             │
OrderAccountingListener            │
     │                             │
     │ handleOrderPaid()           │
     │                             │
     ▼                             │
OrderAccountingService             │
     │                             │
     ├─> recordTransaction()       │
     │   └─> TransactionService    │
     │                             │
     └─> decreaseStock()           │
         └─> StockMovementService  │
```

---

## 💾 Database Tables Relations

```
orders
  │
  ├─> order_items (محصولات سفارش)
  │
  ├─> payments (پرداخت‌ها)
  │     │
  │     └─> accounting_transactions (تراکنش‌های مالی)
  │           │
  │           └─> accounting_accounts (حساب‌ها)
  │
  └─> stock_movements (حرکات انبار)
        │
        ├─> products (محصولات)
        │
        └─> warehouses (انبارها)
              │
              └─> product_stocks (موجودی محصولات)
```

---

## 🔐 Transaction Safety

همه عملیات داخل Database Transaction انجام می‌شوند:

```typescript
await this.dataSource.transaction(async (manager) => {
  // 1. ثبت تراکنش مالی
  await recordTransaction();
  
  // 2. کم کردن موجودی
  await decreaseStock();
  
  // 3. در صورت خطا - همه Rollback
});
```

اگر هر کدام fail بشوند، **همه عملیات Rollback می‌شوند**.

---

## 📈 Performance Considerations

1. **Async Processing**: Event ها async هستند
2. **Indexing**: Index روی فیلدهای پرجستجو
3. **Batch Processing**: برای چند محصول با هم
4. **Caching**: برای انبار و حساب پیش‌فرض

---

**جریان کار کامل و ایمن!** 🎉
