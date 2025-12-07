import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderAccountingService } from '../services/order-accounting.service';

/**
 * Event های سفارش
 */
export class OrderPaidEvent {
  constructor(
    public readonly orderId: number,
    public readonly paymentId: number,
    public readonly userId: number,
  ) {}
}

export class OrderCancelledEvent {
  constructor(
    public readonly orderId: number,
    public readonly userId: number,
  ) {}
}

export class OrderReturnedEvent {
  constructor(
    public readonly orderId: number,
    public readonly userId: number,
  ) {}
}

/**
 * Listener برای رویدادهای سفارش
 * این listener به صورت خودکار تراکنش‌ها و موجودی را مدیریت می‌کند
 */
@Injectable()
export class OrderAccountingListener {
  private readonly logger = new Logger(OrderAccountingListener.name);

  constructor(
    private readonly orderAccountingService: OrderAccountingService,
  ) {}

  /**
   * زمانی که سفارش پرداخت شد
   */
  @OnEvent('order.paid')
  async handleOrderPaid(event: OrderPaidEvent) {
    this.logger.log(
      `رویداد پرداخت سفارش دریافت شد - Order: ${event.orderId}`,
    );

    try {
      await this.orderAccountingService.processOrderPayment(
        event.orderId,
        event.paymentId,
        event.userId,
      );

      this.logger.log(
        `سفارش ${event.orderId} با موفقیت در سیستم حسابداری ثبت شد`,
      );
    } catch (error) {
      this.logger.error(
        `خطا در پردازش سفارش ${event.orderId}: ${error.message}`,
        error.stack,
      );
      // در صورت خطا، می‌توانید یک رویداد دیگر emit کنید
      // یا در صف retry قرار دهید
    }
  }

  /**
   * زمانی که سفارش کنسل شد
   */
  @OnEvent('order.cancelled')
  async handleOrderCancelled(event: OrderCancelledEvent) {
    this.logger.log(`رویداد کنسل سفارش دریافت شد - Order: ${event.orderId}`);

    // اگر پرداخت شده بود، باید refund کرد
    try {
      // TODO: پیاده‌سازی لاجیک کنسل و refund
      this.logger.log(`سفارش ${event.orderId} کنسل شد`);
    } catch (error) {
      this.logger.error(
        `خطا در کنسل سفارش ${event.orderId}: ${error.message}`,
      );
    }
  }

  /**
   * زمانی که سفارش مرجوع شد
   */
  @OnEvent('order.returned')
  async handleOrderReturned(event: OrderReturnedEvent) {
    this.logger.log(`رویداد مرجوعی سفارش دریافت شد - Order: ${event.orderId}`);

    try {
      await this.orderAccountingService.processOrderReturn(
        event.orderId,
        event.userId,
      );

      this.logger.log(`مرجوعی سفارش ${event.orderId} ثبت شد`);
    } catch (error) {
      this.logger.error(
        `خطا در مرجوعی سفارش ${event.orderId}: ${error.message}`,
      );
    }
  }
}
