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
export class FailedPaymentHandler {
  private readonly logger = new Logger(FailedPaymentHandler.name);

  constructor(
    private readonly cardStatusService: CardStatusService,
  ) { }

  /**
   * مدیریت پرداخت ناموفق
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

    this.logger.warn(
      `Payment verification failed with code ${verification.data.code} for order ${order.id}`,
    );
    // تغییر وضعیت پرداخت به ناموفق
    payment.status = PaymentStatus.FAILED;
    payment.message = `تراکنش با وضعیت ${verification.data.code} بازگشت داده شد.`;
    await paymentRepo.save(payment);

    // ثبت لاگ ناموفق
    await paymentLogRepo.save({
      order,
      user: order.user,
      payment,
      authority,
      status: PaymentLogStatus.FAILED,
      message: `پرداخت ناموفق (${verification.data.code})`,
      payload: verification.data,
    });

    // ✅ باز کردن قفل سبد خرید
    // await this.cardStatusService.unlockCart(order.user.id, manager);

    return PaymentResponseMapper.failed(order.status);
  }
}
