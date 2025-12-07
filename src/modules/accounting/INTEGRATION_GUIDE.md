# 🔗 راهنمای یکپارچه‌سازی Order/Payment با Accounting

## 📋 نحوه استفاده

### گام 1: نصب EventEmitter

```bash
npm install @nestjs/event-emitter
```

### گام 2: فعال‌سازی در app.module.ts

```typescript
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    // ... سایر ماژول‌ها
    EventEmitterModule.forRoot(),
    AccountingModule,
  ],
})
export class AppModule {}
```

---

## 🎯 استفاده در OrderService / PaymentService

### روش 1: استفاده از Event (توصیه می‌شود ✅)

```typescript
// order.service.ts یا payment.service.ts

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderPaidEvent } from '../accounting/listeners/order-accounting.listener';

@Injectable()
export class OrderService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    // ... سایر dependency ها
  ) {}

  /**
   * زمانی که پرداخت موفق شد
   */
  async handleSuccessfulPayment(orderId: number, paymentId: number, userId: number) {
    // 1. بروزرسانی وضعیت سفارش
    await this.updateOrderStatus(orderId, OrderStatus.PAID);

    // 2. Emit کردن Event
    this.eventEmitter.emit(
      'order.paid',
      new OrderPaidEvent(orderId, paymentId, userId),
    );

    // ✅ بقیه کارها (ثبت تراکنش، کم کردن موجودی) 
    // به صورت خودکار توسط Listener انجام می‌شود
  }

  /**
   * کنسل کردن سفارش
   */
  async cancelOrder(orderId: number, userId: number) {
    await this.updateOrderStatus(orderId, OrderStatus.CANCELLED);

    this.eventEmitter.emit(
      'order.cancelled',
      new OrderCancelledEvent(orderId, userId),
    );
  }

  /**
   * مرجوعی سفارش
   */
  async returnOrder(orderId: number, userId: number) {
    await this.updateOrderStatus(orderId, OrderStatus.RETURNED);

    this.eventEmitter.emit(
      'order.returned',
      new OrderReturnedEvent(orderId, userId),
    );
  }
}
```

---

### روش 2: فراخوانی مستقیم Service

```typescript
// order.service.ts

import { Injectable } from '@nestjs/common';
import { OrderAccountingService } from '../accounting/services/order-accounting.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderAccountingService: OrderAccountingService,
    // ... سایر dependency ها
  ) {}

  async handleSuccessfulPayment(orderId: number, paymentId: number, userId: number) {
    // 1. بروزرسانی وضعیت
    await this.updateOrderStatus(orderId, OrderStatus.PAID);

    // 2. فراخوانی مستقیم
    await this.orderAccountingService.processOrderPayment(
      orderId,
      paymentId,
      userId,
    );
  }
}
```

---

## 📊 جریان کامل پردازش سفارش

```
1. مشتری سفارش می‌دهد
   └─> Order ایجاد می‌شود (status: AWAITING_PAYMENT)

2. مشتری پرداخت می‌کند
   └─> Payment ثبت می‌شود
   └─> در صورت موفقیت:
       ├─> Order.status = PAID
       ├─> Event: order.paid
       │   └─> OrderAccountingListener.handleOrderPaid()
       │       ├─> ثبت Transaction (درآمد)
       │       │   ├─> تراکنش اصلی (فروش محصول)
       │       │   ├─> تراکنش ارسال (در صورت وجود)
       │       │   └─> تراکنش بسته‌بندی (در صورت وجود)
       │       └─> StockMovement (خروج از انبار)
       │           └─> کم کردن موجودی هر محصول
       └─> Order.status = COMPLETED

3. در صورت مرجوعی
   └─> Event: order.returned
       └─> OrderAccountingListener.handleOrderReturned()
           ├─> ثبت Transaction (برگشت وجه - هزینه)
           └─> StockMovement (ورود به انبار)
               └─> افزایش موجودی محصولات
```

---

## 🔧 تنظیمات پیش‌فرض لازم

### 1. ایجاد حساب پیش‌فرض

```bash
POST /api/accounting/accounts
{
  "name": "حساب اصلی فروشگاه",
  "code": "MAIN-001",
  "type": "BANK_ACCOUNT",
  "initialBalance": 0,
  "isDefault": true,
  "isActive": true
}
```

### 2. ایجاد انبار پیش‌فرض

```bash
POST /api/accounting/warehouses
{
  "name": "انبار مرکزی",
  "code": "WH-MAIN",
  "type": "MAIN",
  "status": "ACTIVE",
  "isDefault": true,
  "city": "تهران"
}
```

---

## 📝 مثال کامل در PaymentService

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderPaidEvent } from '../accounting/listeners/order-accounting.listener';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    // ... repositories
  ) {}

  /**
   * تایید پرداخت آنلاین (Callback از بانک)
   */
  async verifyOnlinePayment(authority: string) {
    // 1. یافتن پرداخت
    const payment = await this.paymentRepository.findOne({
      where: { authority },
      relations: ['order', 'user'],
    });

    if (!payment) {
      throw new Error('پرداخت یافت نشد');
    }

    // 2. تایید از بانک
    const verified = await this.verifyFromBank(payment);

    if (verified.success) {
      // 3. بروزرسانی وضعیت پرداخت
      payment.status = PaymentStatus.SUCCESS;
      payment.refId = verified.refId;
      await this.paymentRepository.save(payment);

      // 4. بروزرسانی سفارش
      payment.order.status = OrderStatus.PAID;
      await this.orderRepository.save(payment.order);

      // 5. ✨ Emit Event - بقیه خودکار!
      this.eventEmitter.emit(
        'order.paid',
        new OrderPaidEvent(
          payment.order.id,
          payment.id,
          payment.user.id,
        ),
      );

      this.logger.log(`پرداخت ${payment.id} تایید شد`);

      return { success: true, orderId: payment.order.id };
    } else {
      // پرداخت ناموفق
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepository.save(payment);

      return { success: false, message: verified.message };
    }
  }

  /**
   * تایید پرداخت کارت به کارت (توسط ادمین)
   */
  async approveCardToCardPayment(paymentId: number, adminId: number) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['order', 'user'],
    });

    // تایید پرداخت
    payment.status = PaymentStatus.SUCCESS;
    payment.cardToCardStatus = CardToCardStatus.APPROVED;
    payment.reviewedById = adminId;
    payment.reviewedAt = new Date();
    await this.paymentRepository.save(payment);

    // بروزرسانی سفارش
    payment.order.status = OrderStatus.PAID;
    await this.orderRepository.save(payment.order);

    // ✨ Emit Event
    this.eventEmitter.emit(
      'order.paid',
      new OrderPaidEvent(
        payment.order.id,
        payment.id,
        payment.user.id,
      ),
    );

    return { success: true };
  }
}
```

---

## ⚠️ نکات مهم

### 1. Transaction Safety
همه عملیات داخل Transaction هستند، در صورت خطا همه Rollback می‌شوند.

### 2. Async Processing
Event ها به صورت async پردازش می‌شوند. اگر خطایی رخ دهد، سفارش ثبت می‌شود ولی حسابداری نه.

### 3. Retry Mechanism (اختیاری)
می‌توانید از Bull Queue برای retry استفاده کنید:

```typescript
@OnEvent('order.paid')
async handleOrderPaid(event: OrderPaidEvent) {
  try {
    await this.orderAccountingService.processOrderPayment(...);
  } catch (error) {
    // اضافه به صف retry
    await this.queue.add('process-order-accounting', event, {
      attempts: 3,
      backoff: 5000,
    });
  }
}
```

### 4. Logging
همه عملیات log می‌شوند برای debug.

---

## 📊 گزارشات

```typescript
// گزارش فروش روزانه
const report = await orderAccountingService.getDailySalesReport(new Date());

// گزارش سود و زیان
const profitLoss = await reportService.getProfitLossReport(
  new Date('2024-01-01'),
  new Date('2024-12-31'),
);
```

---

## ✅ چک‌لیست یکپارچه‌سازی

- [ ] EventEmitterModule نصب و فعال شد
- [ ] AccountingModule به app.module اضافه شد
- [ ] حساب پیش‌فرض ایجاد شد
- [ ] انبار پیش‌فرض ایجاد شد
- [ ] Event ها در OrderService/PaymentService اضافه شدند
- [ ] تست پرداخت موفق
- [ ] تست مرجوعی
- [ ] بررسی لاگ‌ها

---

**آماده است! فقط Event ها را emit کنید، بقیه خودکار!** 🚀
