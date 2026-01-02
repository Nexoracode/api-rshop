import { Injectable, Logger } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { Request } from "express";

import { Payment } from "../entities/payment.entity";
import { Order } from "../../order/entities/order.entity";
import { PaymentLog } from "../entities/payment-logs.entity";

import { OrderStatus } from "../../order/enums/order-status.enum";
import { PaymentLogStatus, PaymentStatus } from "../enums/payment-status.enum";

import { PaymentResponseMapper } from "../mappers/payment-response.mapper";
import { CardStatusService } from "../../card/card-status.service";

@Injectable()
export class UserCancellationHandler {
  private readonly logger = new Logger(UserCancellationHandler.name);

  constructor(
    private readonly cardStatusService: CardStatusService,
  ) { }

  /**
   * مدیریت لغو پرداخت توسط کاربر
   * 
   * ✅ منطق جدید (مثل دیجیکالا):
   * - Order همچنان AWAITING_PAYMENT می‌مونه
   * - کاربر می‌تونه دوباره پرداخت کنه
   * - فقط Order های EXPIRED واقعاً لغو می‌شن
   */
  async handle(
    manager: EntityManager,
    order: Order,
    payment: Payment,
    authority: string,
    req: Request,
  ) {
    const paymentRepo = manager.getRepository(Payment);
    const paymentLogRepo = manager.getRepository(PaymentLog);

    this.logger.warn(`Payment cancelled by user for order ${order.id}`);
    // تغییر وضعیت پرداخت به لغو شده
    payment.status = PaymentStatus.CANCELLED;
    payment.message = 'پرداخت توسط کاربر لغو شد.';
    await paymentRepo.save(payment);

    // ثبت لاگ لغو
    await paymentLogRepo.save({
      order,
      user: order.user,
      payment,
      authority,
      status: PaymentLogStatus.USER_CANCELLED,
      message: 'پرداخت توسط کاربر لغو شد.',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // ✅ باز کردن قفل سبد خرید
    // await this.cardStatusService.unlockCart(order.user.id, manager);
    return PaymentResponseMapper.userCancelled(order, payment, '');
  }
}
