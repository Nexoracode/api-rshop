import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { DataSource, In } from "typeorm";
import { Request } from "express";
import { EventEmitter2 } from "@nestjs/event-emitter"; // ✅ اضافه شد

import { Payment } from "./entities/payment.entity";
import { Order } from "../order/entities/order.entity";

import { OrderStatus } from "../order/enums/order-status.enum";
import { PaymentGateway, PaymentLogStatus, PaymentStatus } from "./enums/payment-status.enum";
import { ZarinpalErrorMessage } from "./enums/zarinpal-message.enum";

import { InvoiceService } from "../invoice/invoice.service";
import { ZarinpalException } from "src/common/exceptions/zarinpal-exception";

import { runInTransaction } from "src/common/helpers/transaction.helper";
import { Card, CardStatus } from "../card/entities/card.entity";
import { CardItem } from "../card/entities/card-item.entity";
import { PaymentLog } from "./entities/payment-logs.entity";

import { PaymentResponseMapper } from "./mappers/payment-response.mapper";
import { getRefId } from "./helpers/zarinpal.helper";
import { IncrementPromotionUsageUseCase } from "../promotion/application/usecases/increment-promotion-usage.usecase";

// ✅ اضافه: Event برای یکپارچه‌سازی حسابداری
import { OrderPaidEvent } from "../accounting/listeners/order-accounting.listener";
import { CardStatusService } from "../card/card-status.service";
import ZarinPal from "zarinpal-node-sdk";

const relations = [
  'user',
  'address',
  'items',
  'items.product',
  'items.product.mediaPinned',
  'items.variant',
  'items.variant.attributes',
  'items.variant.attributes.attribute',
  'items.variant.attributes.value'
];

const zarinpal = new ZarinPal({
  merchantId: process.env.ZARINPAL_MERCHANT_ID || '',
  sandbox: process.env.ZARINPAL_SANDBOX === 'true',
})

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly invoiceService: InvoiceService,
    private readonly incrementPromotionUsage: IncrementPromotionUsageUseCase,
    private readonly eventEmitter: EventEmitter2, // ✅ اضافه شد
    private readonly cardStatusService: CardStatusService, // ✅ اضافه شد
  ) { }

  // ────────────────────────────────────────────────
  // 💰 مرحله 1: ایجاد درخواست پرداخت در زرین‌پال
  // ────────────────────────────────────────────────
  async createPayment(callbackUrl: string, orderId: number, req: Request) {
    console.log('sand box -> ', process.env.ZARINPAL_SANDBOX);
    return runInTransaction(this.dataSource, async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const paymentRepo = manager.getRepository(Payment);
      const paymentLogRepo = manager.getRepository(PaymentLog);
      const cardRepo = manager.getRepository(Card);

      const order = await orderRepo.findOne({
        where: { id: orderId, status: In([OrderStatus.START_ORDER, OrderStatus.AWAITING_PAYMENT]) },
        relations: ['user', 'address'],
      });
      if (!order) throw new NotFoundException('سفارش یافت نشد.');
      await this.cardStatusService.lockCart(order.user.id);

      let requestResult: any;
      try {
        await this.cardStatusService.lockCart(order.user.id);
        order.status = OrderStatus.AWAITING_PAYMENT;
        await orderRepo.save(order);
        requestResult = await zarinpal.payments.create({
          amount: order.total,
          callback_url: callbackUrl,
          description: `پرداخت سفارش شماره ${order.id}`,
          mobile: order.user?.phone ?? null,
          email: order.user?.email ?? null,
          referrer_id: order.user?.phone ?? null,
        });
      } catch (e: any) {
        this.logger.error(`Zarinpal request failed for order ${orderId}`, e);
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
        throw new ZarinpalException(e.errors?.code ?? -50, e.errors?.message);
      }

      if (requestResult.data.code !== 100) {
        this.logger.warn(`Zarinpal request rejected with status ${requestResult.status} for order ${orderId}`);
        await paymentLogRepo.save({
          order,
          user: order.user,
          authority: requestResult.data.authority ?? '',
          status: PaymentLogStatus.FAILED,
          message: `درخواست پرداخت رد شد : (${requestResult.data.message})`,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          payload: requestResult,
        });
        throw new ZarinpalException(
          requestResult.data.code,
          ZarinpalErrorMessage[requestResult.data.code] || 'خطای نامشخص در درگاه پرداخت',
        );
      }

      await paymentRepo.save({
        user: order.user,
        order,
        authority: requestResult.data.authority,
        amount: order.total,
        status: PaymentStatus.IN_PROGRESS,
        message: 'در انتظار پرداخت کاربر...',
        gateway: PaymentGateway.ZARINPAL,
      });

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

      this.logger.log(`Payment request created for order ${orderId}, authority: ${requestResult.authority}`);

      await this.cardStatusService.lockCart(order.user.id, manager);
      return PaymentResponseMapper.createPayment(order, requestResult.data.authority);
    });
  }

  // ────────────────────────────────────────────────
  // 💳 مرحله 2: تأیید پرداخت (بازگشت از درگاه)
  // ────────────────────────────────────────────────
  async verifyPayment(
    authority: string,
    status: string,
    req: Request,
  ) {
    return runInTransaction(this.dataSource, async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const cardRepo = manager.getRepository(Card);
      const cardItemRepo = manager.getRepository(CardItem);
      const paymentRepo = manager.getRepository(Payment);
      const paymentLogRepo = manager.getRepository(PaymentLog);

      const payment = await paymentRepo.findOne({
        where: { authority },
        relations: ['order', 'user'],
      });
      if (!payment) {
        this.logger.warn(`Payment not found for authority: ${authority}`);
        throw new NotFoundException('تراکنش یافت نشد.');
      }

      const order = await orderRepo.findOne({
        where: { id: payment.order.id },
        relations,
      });
      if (!order) throw new NotFoundException('سفارش یافت نشد.');

      if (payment.status === PaymentStatus.SUCCESS) {
        this.logger.debug(`Payment already verified for authority: ${authority}`);
        return PaymentResponseMapper.alreadyVerified(payment.refId ?? null);
      }

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

      if (status !== 'OK') {
        this.logger.warn(`Payment cancelled by user for order ${order.id}`);
        order.status = OrderStatus.PAYMENT_FAILED;
        await orderRepo.save(order);

        payment.status = PaymentStatus.CANCELLED;
        payment.message = 'پرداخت توسط کاربر لغو شد.';
        await paymentRepo.save(payment);

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

        return PaymentResponseMapper.userCancelled(order, payment, ''); // اصلاح شده
      }

      try {
        const verification = await zarinpal.verifications.verify({
          amount: order.total,
          authority: authority,
        });

        console.log('verification -> ', verification);

        order.status = OrderStatus.PAYMENT_CONFIRMATION_PENDING;
        await orderRepo.save(order);

        if (verification.data.code === 100) {
          this.logger.log(`Payment verified successfully for order ${order.id}, refId: ${getRefId(verification.data)}`);

          order.status = OrderStatus.PREPARING;
          payment.status = PaymentStatus.SUCCESS;
          payment.refId = getRefId(verification.data);
          payment.message = 'پرداخت با موفقیت تایید شد.';
          await orderRepo.save(order);
          await paymentRepo.save(payment);

          await this.cardStatusService.abandonCart(order.user.id, manager);

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
          if (order.promotionDetails && order.promotionDetails.length > 0) {
            const promotionIds = order.promotionDetails.map(p => p.promotionId);
            try {
              await this.incrementPromotionUsage.executeMultiple(promotionIds);
              this.logger.log(`Incremented usage count for ${promotionIds.length} promotion(s) in order ${order.id}`);
            } catch (error) {
              this.logger.error(`Failed to increment promotion usage for order ${order.id}`, error.stack);
            }
          }

          // ✅✅✅ یکپارچه‌سازی با حسابداری و انبارداری - فقط یک خط!
          try {
            this.eventEmitter.emit(
              'order.paid',
              new OrderPaidEvent(order.id, payment.id, order.user.id),
            );
            this.logger.log(`🎉 Event 'order.paid' emitted for order ${order.id}`);
          } catch (error) {
            // اگر Event Listener مشکل داشت، پرداخت باز هم موفق است
            this.logger.error(`Failed to emit order.paid event for order ${order.id}`, error.stack);
          }

          try {
            const invoice = await this.invoiceService.createFromOrder(
              manager,
              order.id,
              order.user,
            );
            return PaymentResponseMapper.verifiedWithInvoice(
              order,
              payment,
              payment.refId ?? getRefId(verification.data),
              invoice!.createdAt
            );
          } catch (e) {
            this.logger.error(`Failed to create invoice for order ${order.id}`, e);
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
            return PaymentResponseMapper.verifiedNoInvoice(
              order,
              payment.refId ?? getRefId(verification.data)
            );
          }
        }

        if (verification.data.code === 101) {
          this.logger.debug(`Payment already verified (101) for authority: ${authority}`);
          return PaymentResponseMapper.alreadyVerified(verification ?? null);
        }

        this.logger.warn(`Payment verification failed with status ${verification.data.code} for order ${order.id}`);
        order.status = OrderStatus.PAYMENT_FAILED;
        payment.status = PaymentStatus.FAILED;
        payment.message = `تراکنش با وضعیت ${verification.data.code} بازگشت داده شد.`;
        await orderRepo.save(order);
        await paymentRepo.save(payment);

        await paymentLogRepo.save({
          order,
          user: order.user,
          payment,
          authority,
          status: PaymentLogStatus.FAILED,
          message: `پرداخت ناموفق (${verification.data.code})`,
          payload: verification.data,
        });

        return PaymentResponseMapper.failed(order.status);
      } catch (e) {
        this.logger.error(`Zarinpal verification error for order ${order.id}`, e);
        payment.status = PaymentStatus.FAILED;
        payment.message = 'خطا در ارتباط با درگاه پرداخت.';
        await paymentRepo.save(payment);

        await paymentLogRepo.save({
          order,
          user: order.user,
          payment,
          authority,
          status: PaymentLogStatus.FAILED,
          message: 'خطا هنگام verify درگاه پرداخت',
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          payload: { e },
        });

        throw new ZarinpalException(e.errors?.code ?? -99, e.errors?.message ?? 'Zarinpal verification error');
      } finally {
        const lockedCard = await cardRepo.findOne({
          where: { user: { id: order.user.id }, status: CardStatus.LOCKED },
        });
        if (lockedCard) {
          lockedCard.status = CardStatus.OPEN;
          await cardRepo.save(lockedCard);
        }
      }
    });
  }
}
