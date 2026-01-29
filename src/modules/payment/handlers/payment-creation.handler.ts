import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { EntityManager, In } from "typeorm";
import { Request } from "express";
import ZarinPal from "zarinpal-node-sdk";

import { Payment } from "../entities/payment.entity";
import { Order } from "../../order/entities/order.entity";
import { PaymentLog } from "../entities/payment-logs.entity";

import { OrderStatus } from "../../order/enums/order-status.enum";
import { PaymentGateway, PaymentLogStatus, PaymentStatus } from "../enums/payment-status.enum";
import { ZarinpalErrorMessage } from "../enums/zarinpal-message.enum";
import { ZarinpalException } from "src/common/exceptions/zarinpal-exception";

import { PaymentResponseMapper } from "../mappers/payment-response.mapper";
import { CardStatusService } from "../../card/card-status.service";
import { OrderStatusService } from "src/modules/order/order.status.service";
import { toInteger } from "lodash";

const zarinpal = new ZarinPal({
  merchantId: process.env.ZARINPAL_MERCHANT_ID || '',
  sandbox: process.env.ZARINPAL_SANDBOX === 'true',
});

@Injectable()
export class PaymentCreationHandler {
  private readonly logger = new Logger(PaymentCreationHandler.name);

  constructor(
    private readonly cardStatusService: CardStatusService,
    private readonly OrderStatusService: OrderStatusService,
  ) { }

  /**
   * ایجاد درخواست پرداخت در زرین‌پال
   * 
   * ✅ منطق جدید:
   * - اگه Payment معلق (IN_PROGRESS) داره → همون رو برگردون
   * - اگه نداره → Payment جدید بساز
   */
  async handle(
    manager: EntityManager,
    callbackUrl: string,
    orderId: number,
    req: Request,
  ) {
    const orderRepo = manager.getRepository(Order);
    const paymentRepo = manager.getRepository(Payment);
    const paymentLogRepo = manager.getRepository(PaymentLog);

    // پیدا کردن سفارش
    const order = await orderRepo.findOne({
      where: {
        id: orderId,
        status: In([
          OrderStatus.PAYMENT_FAILED,
          OrderStatus.START_ORDER,
          OrderStatus.AWAITING_PAYMENT,
        ]),
      },
      relations: ['user', 'address', 'items'],
    });

    if (!order) {
      throw new NotFoundException('سفارش مورد نظر پیدا نشد یا قابل پرداخت نیست.');
    }
    // قفل کردن سبد خرید (فقط یکبار)

    let requestResult: any;
    const amount = toInteger(order.total + '0');

    try {
      // ارسال درخواست به زرین‌پال
      requestResult = await zarinpal.payments.create({
        amount,
        callback_url: callbackUrl,
        description: `پرداخت سفارش شماره ${order.id}`,
        mobile: order.user?.phone ?? null,
        email: order.user?.email ?? null,
      });
      // تغییر وضعیت سفارش
      await this.cardStatusService.lockCart(order.user.id, manager);
      await this.OrderStatusService.updateOrderStatus(order, OrderStatus.AWAITING_PAYMENT, manager);
    } catch (e: any) {
      this.logger.error(`Zarinpal request failed for order ${orderId}`, e.data);

      // ✅ در صورت خطا، unlock کردن سبد
      await this.cardStatusService.unlockCart(order.user.id, manager);

      // ثبت لاگ خطا
      await paymentLogRepo.save({
        order,
        user: order.user,
        authority: '',
        status: PaymentLogStatus.FAILED,
        message: 'خطا در ایجاد درخواست پرداخت',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        payload: { e },
      });

      throw new ZarinpalException(
        e.errors.code ?? -1,
        e.errors.message ?? 'خطای نامشخص در درگاه پرداخت',
      );
    }

    // بررسی نتیجه درخواست
    if (requestResult.data.code !== 100) {
      this.logger.warn(
        `Zarinpal request rejected with code ${requestResult.data.code} for order ${orderId}`,
      );

      // ✅ در صورت رد شدن، unlock کردن سبد
      await this.cardStatusService.unlockCart(order.user.id, manager);

      // ثبت لاگ رد شدن
      await paymentLogRepo.save({
        order,
        user: order.user,
        authority: requestResult.data.authority ?? '',
        status: PaymentLogStatus.FAILED,
        message: `درخواست پرداخت رد شد: ${requestResult.data.message}`,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        payload: requestResult,
      });

      throw new ZarinpalException(
        requestResult.data.code,
        ZarinpalErrorMessage[requestResult.data.code] || 'خطای نامشخص در درگاه پرداخت',
      );
    }

    // ذخیره اطلاعات پرداخت جدید
    await paymentRepo.save({
      user: order.user,
      order,
      authority: requestResult.data.authority,
      amount: order.total,
      status: PaymentStatus.IN_PROGRESS,
      message: 'در انتظار پرداخت کاربر...',
      gateway: PaymentGateway.ZARINPAL,
    });

    // ثبت لاگ موفقیت
    await paymentLogRepo.save({
      order,
      user: order.user,
      authority: requestResult.data.authority,
      status: PaymentLogStatus.INITIATED,
      message: 'لینک پرداخت ایجاد شد، در انتظار پرداخت کاربر',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      payload: requestResult,
    });

    this.logger.log(
      `Payment request created for order ${orderId}, authority: ${requestResult.data.authority}`,
    );

    return PaymentResponseMapper.createPayment(order, requestResult.data.authority);
  }
}
