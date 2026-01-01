import { Injectable, Logger } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { Request } from "express";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { Payment } from "../entities/payment.entity";
import { Order } from "../../order/entities/order.entity";
import { PaymentLog } from "../entities/payment-logs.entity";

import { OrderStatus } from "../../order/enums/order-status.enum";
import { PaymentLogStatus, PaymentStatus } from "../enums/payment-status.enum";

import { InvoiceService } from "../../invoice/invoice.service";
import { PaymentResponseMapper } from "../mappers/payment-response.mapper";
import { CardStatusService } from "../../card/card-status.service";
import { getRefId } from "../helpers/zarinpal.helper";
import { IncrementPromotionUsageUseCase } from "../../promotion/application/usecases/increment-promotion-usage.usecase";
import { OrderPaidEvent } from "../../accounting/listeners/order-accounting.listener";

// Relations لازم برای invoice
const INVOICE_RELATIONS = [
  'user',
  'address',
  'items',
  'items.product',
  'items.product.mediaPinned',
  'items.variant',
  'items.variant.attributes',
  'items.variant.attributes.attribute',
  'items.variant.attributes.value',
];

@Injectable()
export class SuccessfulPaymentHandler {
  private readonly logger = new Logger(SuccessfulPaymentHandler.name);

  constructor(
    private readonly cardStatusService: CardStatusService,
    private readonly invoiceService: InvoiceService,
    private readonly incrementPromotionUsage: IncrementPromotionUsageUseCase,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * مدیریت پرداخت موفق و تمام فرآیندهای مرتبط
   */
  async handle(
    manager: EntityManager,
    order: Order,
    payment: Payment,
    authority: string,
    verification: any,
    req: Request,
  ) {
    const orderRepo = manager.getRepository(Order);
    const paymentRepo = manager.getRepository(Payment);
    const paymentLogRepo = manager.getRepository(PaymentLog);

    const refId = getRefId(verification.data);
    this.logger.log(`Payment verified successfully for order ${order.id}, refId: ${refId}`);

    // تغییر وضعیت سفارش و پرداخت
    order.status = OrderStatus.PREPARING;
    payment.status = PaymentStatus.SUCCESS;
    payment.refId = refId;
    payment.message = 'پرداخت با موفقیت تایید شد.';

    await orderRepo.save(order);
    await paymentRepo.save(payment);

    // ✅ Abandon کردن سبد خرید با error handling
    try {
      await this.cardStatusService.abandonCart(order.user.id, manager);
    } catch (error) {
      // ⚠️ فقط لاگ میکنیم، transaction را fail نمیکنیم
      this.logger.error(
        `Failed to abandon cart for user ${order.user.id}`,
        error.stack,
      );
    }

    // ثبت لاگ موفقیت
    await paymentLogRepo.save({
      order,
      user: order.user,
      payment,
      authority,
      status: PaymentLogStatus.VERIFIED,
      message: 'پرداخت با موفقیت تایید شد.',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      payload: verification.data,
    });

    // ✅ افزایش شمارنده استفاده از پروموشن‌ها
    await this.handlePromotionIncrement(order);

    // ✅ ارسال Event برای یکپارچه‌سازی با حسابداری و انبارداری
    await this.emitOrderPaidEvent(order, payment);

    // ✅ صدور فاکتور
    return await this.handleInvoiceCreation(
      manager,
      order,
      payment,
      authority,
      refId || '',
    );
  }

  /**
   * افزایش شمارنده استفاده از پروموشن‌ها
   */
  private async handlePromotionIncrement(order: Order): Promise<void> {
    if (!order.promotionDetails || order.promotionDetails.length === 0) {
      return;
    }

    const promotionIds = order.promotionDetails.map((p) => p.promotionId);

    try {
      await this.incrementPromotionUsage.executeMultiple(promotionIds);
      this.logger.log(
        `Incremented usage count for ${promotionIds.length} promotion(s) in order ${order.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to increment promotion usage for order ${order.id}`,
        error.stack,
      );
    }
  }

  /**
   * ارسال Event برای یکپارچه‌سازی با حسابداری و انبارداری
   */
  private async emitOrderPaidEvent(order: Order, payment: Payment): Promise<void> {
    try {
      this.eventEmitter.emit(
        'order.paid',
        new OrderPaidEvent(order.id, payment.id, order.user.id),
      );
      this.logger.log(`🎉 Event 'order.paid' emitted for order ${order.id}`);
    } catch (error) {
      // اگر Event Listener مشکل داشت، پرداخت باز هم موفق است
      this.logger.error(
        `Failed to emit order.paid event for order ${order.id}`,
        error.stack,
      );
    }
  }

  /**
   * صدور فاکتور برای سفارش
   */
  private async handleInvoiceCreation(
    manager: EntityManager,
    order: Order,
    payment: Payment,
    authority: string,
    refId: string,
  ) {
    const orderRepo = manager.getRepository(Order);
    const paymentRepo = manager.getRepository(Payment);
    const paymentLogRepo = manager.getRepository(PaymentLog);

    try {
      // ✅ Load کردن relation های لازم فقط برای invoice
      const orderWithItems = await orderRepo.findOne({
        where: { id: order.id },
        relations: INVOICE_RELATIONS,
      });

      const invoice = await this.invoiceService.createFromOrder(
        manager,
        order.id,
        order.user,
      );

      return PaymentResponseMapper.verifiedWithInvoice(
        orderWithItems!,
        payment,
        refId,
        invoice!.createdAt,
      );
    } catch (e) {
      this.logger.error(`Failed to create invoice for order ${order.id}`, e);

      // اگر فاکتور صادر نشد، پرداخت همچنان موفق است
      payment.status = PaymentStatus.VERIFIED;
      payment.message = 'پرداخت تایید شد ولی صدور فاکتور با خطا مواجه شد.';
      await paymentRepo.save(payment);

      await paymentLogRepo.save({
        order,
        user: order.user,
        payment,
        authority,
        status: PaymentLogStatus.FAILED,
        message: 'خطا در صدور فاکتور پس از پرداخت موفق',
        payload: { e },
      });

      return PaymentResponseMapper.verifiedNoInvoice(order, refId);
    }
  }
}
