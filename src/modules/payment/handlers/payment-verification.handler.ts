import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { Request } from "express";
import ZarinPal from "zarinpal-node-sdk";

import { Payment } from "../entities/payment.entity";
import { PaymentLog } from "../entities/payment-logs.entity";

import { OrderStatus } from "../../order/enums/order-status.enum";
import { PaymentLogStatus, PaymentStatus } from "../enums/payment-status.enum";
import { ZarinpalException } from "src/common/exceptions/zarinpal-exception";

import { PaymentResponseMapper } from "../mappers/payment-response.mapper";
import { CardStatusService } from "../../card/card-status.service";

import { UserCancellationHandler } from "./user-cancellation.handler";
import { SuccessfulPaymentHandler } from "./successful-payment.handler";
import { FailedPaymentHandler } from "./failed-payment.handler";
import { Order } from "../../order/entities/order.entity";
import { OrderStatusService } from "src/modules/order/order.status.service";
import { toInteger } from "lodash";

const zarinpal = new ZarinPal({
  merchantId: process.env.ZARINPAL_MERCHANT_ID || '',
  sandbox: process.env.ZARINPAL_SANDBOX === 'true',
});

@Injectable()
export class PaymentVerificationHandler {
  private readonly logger = new Logger(PaymentVerificationHandler.name);

  constructor(
    private readonly userCancellationHandler: UserCancellationHandler,
    private readonly successfulPaymentHandler: SuccessfulPaymentHandler,
    private readonly failedPaymentHandler: FailedPaymentHandler,
    private readonly orderStatusService: OrderStatusService,

  ) { }

  /**
   * تأیید پرداخت و هدایت به handler مناسب
   */
  async handle(
    manager: EntityManager,
    authority: string,
    status: string,
    req: Request,
  ) {
    const paymentRepo = manager.getRepository(Payment);
    const paymentLogRepo = manager.getRepository(PaymentLog);

    // پیدا کردن پرداخت با relation های لازم
    const payment = await paymentRepo.findOne({
      where: { authority },
      relations: [
        'order',
        'order.user',
        'order.items',
        'order.items.product',
        'order.items.product.mediaPinned',
      ],
    });

    if (!payment) {
      this.logger.warn(`Payment not found for authority: ${authority}`);
      throw new NotFoundException('تراکنش یافت نشد.');
    }

    const order = payment.order;

    // ✅ بررسی پرداخت قبلاً تأیید شده
    if (payment.status === PaymentStatus.SUCCESS) {
      this.logger.debug(`Payment already verified for authority: ${authority}`);
      return PaymentResponseMapper.alreadyVerified(payment.refId ?? null);
    }

    // ✅ بررسی وضعیت سفارش
    if (
      ![
        OrderStatus.AWAITING_PAYMENT,
        OrderStatus.PAYMENT_FAILED,
        OrderStatus.PENDING_APPROVAL,
        OrderStatus.PAYMENT_CONFIRMATION_PENDING,
      ].includes(order.status)
    ) {
      throw new BadRequestException('این سفارش قابل پرداخت نیست.');
    }

    // ثبت لاگ دریافت callback
    await paymentLogRepo.save({
      order,
      user: order.user,
      payment,
      authority,
      status: PaymentLogStatus.CALLBACK_RECEIVED,
      message: 'در انتظار احراز تراکنش',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      payload: { status },
    });

    // ✅ اگر کاربر لغو کرده
    if (status !== 'OK') {
      await this.orderStatusService.sendPaymentReminderSms(order);
      return await this.userCancellationHandler.handle(
        manager,
        order,
        payment,
        authority,
        req,
      );
    }

    // ✅ تأیید پرداخت از زرین‌پال
    return await this.verifyWithZarinpal(
      manager,
      order,
      payment,
      authority,
      req,
    );
  }

  /**
   * تأیید پرداخت از زرین‌پال و هدایت به handler مناسب
   */
  private async verifyWithZarinpal(
    manager: EntityManager,
    order: Order,
    payment: Payment,
    authority: string,
    req: Request,
  ) {
    const orderRepo = manager.getRepository(Order);
    const paymentRepo = manager.getRepository(Payment);
    const paymentLogRepo = manager.getRepository(PaymentLog);

    try {
      // ✅ ارسال درخواست verify به زرین‌پال
      const amount = toInteger(order.total + '0');
      const verification = await zarinpal.verifications.verify({
        amount,
        authority: authority,
      });

      this.logger.debug(`Verification response for order ${order.id}:`, verification.data);

      // تغییر وضعیت به در انتظار تأیید
      order.status = OrderStatus.PAYMENT_CONFIRMATION_PENDING;
      await orderRepo.save(order);

      // ✅ پرداخت موفق (کد 100)
      if (verification.data.code === 100) {
        return await this.successfulPaymentHandler.handle(
          manager,
          order,
          payment,
          authority,
          verification,
          req,
        );
      }

      // ✅ پرداخت قبلاً تأیید شده (کد 101)
      if (verification.data.code === 101) {
        this.logger.debug(`Payment already verified (code 101) for authority: ${authority}`);
        return PaymentResponseMapper.alreadyVerified(verification.data ?? null);
      }

      // ✅ پرداخت ناموفق (سایر کدها)
      return await this.failedPaymentHandler.handle(
        manager,
        order,
        payment,
        authority,
        verification,
        req,
      );
    } catch (e: any) {
      // ✅ ارسال پیامک برای یاداوری پرداخت (غیرهمزمان - Non-blocking)
      await this.orderStatusService.sendPaymentReminderSms(order);
      this.logger.error(`Zarinpal verification error for order ${order.id}`, e);

      // تغییر وضعیت پرداخت به ناموفق
      payment.status = PaymentStatus.FAILED;
      payment.message = 'خطا در ارتباط با درگاه پرداخت.';
      await paymentRepo.save(payment);

      // ثبت لاگ خطا
      await paymentLogRepo.save({
        order,
        user: order.user,
        payment,
        authority,
        status: PaymentLogStatus.FAILED,
        message: 'خطا هنگام verify درگاه پرداخت',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        payload: { data: e.data },
      });

      throw new ZarinpalException(
        e.errors?.code ?? -99,
        e.errors?.message ?? 'Zarinpal verification error',
      );
    }
  }
}
