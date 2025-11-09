import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { Request } from "express";

import { Invoice } from "../invoice/entities/invoice.entity";
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

// ✅ اضافه: مپر خروجی‌ها
import { PaymentResponseMapper } from "./mappers/payment-response.mapper";
// ✅ اضافه: refId هِلپر
import { getRefId } from "./helpers/zarinpal.helper";

// ⚠️ یکدست: address هم به relations افزوده شد تا دیتای کامل باشد
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

const zarinpal = require("zarinpal-checkout").create(
  process.env.ZARINPAL_MERCHANT_ID,
  true
);

@Injectable()
export class PaymentService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly invoiceService: InvoiceService,
  ) { }

  // ────────────────────────────────────────────────
  // 💰 مرحله 1: ایجاد درخواست پرداخت در زرین‌پال
  // ────────────────────────────────────────────────
  async createPayment(callbackUrl: string, orderId: number, req: Request) {
    return runInTransaction(this.dataSource, async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const paymentRepo = manager.getRepository(Payment);
      const paymentLogRepo = manager.getRepository(PaymentLog);
      const cardRepo = manager.getRepository(Card);

      const order = await orderRepo.findOne({
        where: { id: orderId },
        relations: ['user', 'address'],
      });
      if (!order) throw new NotFoundException('سفارش یافت نشد.');

      if (order.status === OrderStatus.PAYMENT_CONFIRMATION_PENDING) {
        throw new BadRequestException('این سفارش در انتظار تایید پرداخت است.');
      }

      if (
        ![
          OrderStatus.AWAITING_PAYMENT,
          OrderStatus.PAYMENT_FAILED,
          OrderStatus.PENDING_APPROVAL,
        ].includes(order.status)
      ) {
        throw new BadRequestException('این سفارش قابل پرداخت نیست.');
      }

      const card = await cardRepo.findOne({
        where: { user: { id: order.user.id }, status: CardStatus.OPEN },
      });
      if (card) {
        card.status = CardStatus.LOCKED;
        await cardRepo.save(card);
      }

      let requestResult: any;
      try {
        requestResult = await zarinpal.PaymentRequest({
          Amount: order.total,
          CallbackURL: callbackUrl,
          Description: `پرداخت سفارش شماره ${order.id}`,
          Email: order.user?.email ?? undefined,
          Mobile: order.user?.phone ?? undefined,
        });
      } catch (e: any) {
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

      if (requestResult.status !== 100) {
        await paymentLogRepo.save({
          order,
          user: order.user,
          authority: requestResult.authority ?? '',
          status: PaymentLogStatus.FAILED,
          message: `درخواست پرداخت رد شد (${requestResult.status})`,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          payload: requestResult,
        });
        throw new ZarinpalException(
          requestResult.status,
          ZarinpalErrorMessage[requestResult.status],
        );
      }

      // ⬇️ مستقیم روی IN_PROGRESS ذخیره می‌کنیم؛ ستِ مجدد حذف شد
      await paymentRepo.save({
        user: order.user,
        order,
        authority: requestResult.authority,
        amount: order.total,
        status: PaymentStatus.IN_PROGRESS,
        message: 'در انتظار پرداخت کاربر...',
        gateway: PaymentGateway.ZARINPAL,
      });

      order.status = OrderStatus.PAYMENT_CONFIRMATION_PENDING;
      await orderRepo.save(order);

      await paymentLogRepo.save({
        order,
        user: order.user,
        authority: requestResult.authority,
        status: PaymentLogStatus.INITIATED,
        message: 'لینک پرداخت ایجاد شد، در انتظار پرداخت کاربر',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        payload: requestResult,
      });

      // ✅ خروجی از طریق Mapper (شکل خروجی دقیقاً مثل قبل نگه داشته شده)
      return PaymentResponseMapper.createPayment(order, requestResult.url, requestResult.authority);
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
      if (!payment) throw new NotFoundException('تراکنش یافت نشد.');

      const order = await orderRepo.findOne({
        where: { id: payment.order.id },
        relations,
      });
      if (!order) throw new NotFoundException('سفارش یافت نشد.');

      if (payment.status === PaymentStatus.SUCCESS) {
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

      const card = await cardRepo.findOne({
        where: { user: { id: order.user.id }, status: CardStatus.LOCKED },
        relations: ['items'],
      });

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
        order.status = OrderStatus.PAYMENT_FAILED;
        await orderRepo.save(order);

        if (card) {
          card.status = CardStatus.OPEN;
          await cardRepo.save(card);
        }

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

        return PaymentResponseMapper.userCancelled(order.status);
      }

      try {
        const verification = await zarinpal.PaymentVerification({
          Amount: order.total,
          Authority: authority,
        });

        if (verification.status === 100) {
          order.status = OrderStatus.PREPARING;
          payment.status = PaymentStatus.SUCCESS;
          payment.refId = getRefId(verification);
          payment.message = 'پرداخت با موفقیت تایید شد.';
          await orderRepo.save(order);
          await paymentRepo.save(payment);

          if (card) {
            await cardItemRepo.delete({ cardId: card.id });
            card.itemsCount = 0;
            card.totalQuantity = 0;
            card.subtotal = 0;
            card.discountTotal = 0;
            card.total = 0;
            card.status = CardStatus.ABANDONED;
            await cardRepo.save(card);
          }

          await paymentLogRepo.save({
            order,
            user: order.user,
            payment,
            authority,
            status: PaymentLogStatus.VERIFIED,
            message: 'پرداخت با موفقیت تایید شد.',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            payload: verification,
          });

          try {
            const invoice = await this.invoiceService.createFromOrder(
              manager,
              order.id,
              order.user,
            );
            return PaymentResponseMapper.verifiedWithInvoice(
              order,
              payment,
              payment.refId ?? getRefId(verification),
              invoice!.createdAt
            );
          } catch (e) {
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
              payment.refId ?? getRefId(verification)
            );
          }
        }

        if (verification.status === 101) {
          return PaymentResponseMapper.alreadyVerified(verification ?? null);
        }

        order.status = OrderStatus.PAYMENT_FAILED;
        payment.status = PaymentStatus.FAILED;
        payment.message = `تراکنش با وضعیت ${verification.status} بازگشت داده شد.`;
        await orderRepo.save(order);
        await paymentRepo.save(payment);

        await paymentLogRepo.save({
          order,
          user: order.user,
          payment,
          authority,
          status: PaymentLogStatus.FAILED,
          message: `پرداخت ناموفق (${verification.status})`,
          payload: verification,
        });

        return PaymentResponseMapper.failed(order.status);
      } catch (e) {
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