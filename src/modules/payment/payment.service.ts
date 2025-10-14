import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { Request } from "express";

// Entities
import { Invoice } from "../invoice/entities/invoice.entity";
import { Payment } from "./entities/payment.entity";
import { Order } from "../order/entities/order.entity";


// Enums
import { OrderStatus } from "../order/enums/order-status.enum";
import { PaymentGateway, PaymentLogStatus, PaymentStatus } from "./enums/payment-status.enum";
import { ZarinpalErrorMessage } from "./enums/zarinpal-message.enum";


// Services
import { InvoiceService } from "../invoice/invoice.service";
import { PaymentLogService } from "./payment-log.service";


// Exceptions
import { ZarinpalException } from "src/common/exceptions/zarinpal-exception";


// Utils
import { runInTransaction } from "src/common/helpers/transaction.helper";
import { Card, CardStatus } from "../card/entities/card.entity";
import { CardItem } from "../card/entities/card-item.entity";
import { PaymentLog } from "./entities/payment-logs.entity";

// Third-party SDK
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
  async createPayment(orderId: number, req: Request) {
    return runInTransaction(this.dataSource, async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const paymentRepo = manager.getRepository(Payment);
      const paymentLogRepo = manager.getRepository(PaymentLog);

      const order = await orderRepo.findOne({
        where: { id: orderId },
        relations: ["user"],
      });
      if (!order) throw new NotFoundException("سفارش یافت نشد.");

      // اگر قبلاً پرداخت شده
      if (order.status === OrderStatus.PAID)
        throw new BadRequestException("این سفارش قبلاً پرداخت شده است.");

      // ✅ ارسال درخواست پرداخت به زرین‌پال
      let requestResult: any;
      try {
        requestResult = await zarinpal.PaymentRequest({
          Amount: order.total,
          CallbackURL: `${process.env.FRONTEND_URL}/payment/verify?order_id=${order.id}`,
          Description: `پرداخت سفارش شماره ${order.id}`,
          Email: order.user?.email ?? undefined,
          Mobile: order.user?.phone ?? undefined,
        });
      } catch (e: any) {
        const code = e.errors?.code ?? -50;
        throw new ZarinpalException(code, e.errors?.message);
      }

      // بررسی پاسخ زرین‌پال
      if (requestResult.status !== 100) {
        throw new ZarinpalException(
          requestResult.status,
          ZarinpalErrorMessage[requestResult.status],
        );
      }

      // 💳 ساخت رکورد اولیه پرداخت در دیتابیس
      const payment = await paymentRepo.save({
        user: order.user,
        order,
        authority: requestResult.authority,
        amount: order.total,
        status: PaymentStatus.PENDING,
        message: "در انتظار پرداخت کاربر...",
        gateway: PaymentGateway.ZARINPAL
      });

      await paymentLogRepo.save({
        order,
        user: order.user,
        payment,
        authority: payment.authority,
        status: PaymentLogStatus.INITIATED,
        message: "لینک پرداخت ساخته شد، در انتظار پرداخت کاربر",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        payload: requestResult,
      });

      // بازگرداندن لینک درگاه
      return {
        authority: requestResult.authority,
        paymentUrl: requestResult.url,
        amount: order.total,
        orderId: order.id,
        message: "کاربر به درگاه پرداخت منتقل می‌شود.",
      };
    })
  }

  // ────────────────────────────────────────────────
  // 💳 مرحله 2: تأیید پرداخت (بازگشت از درگاه)
  // ────────────────────────────────────────────────
  async verifyPayment(
    orderId: number,
    authority: string,
    status: string,
    req: Request,
  ) {
    await runInTransaction(this.dataSource, async (manager) => {
      const cardRepo = manager.getRepository(Card);
      const cardItemRepo = manager.getRepository(CardItem);
      const paymentRepo = manager.getRepository(Payment);
      const paymentLogRepo = manager.getRepository(PaymentLog);

      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ["user"],
      });
      if (!order) throw new NotFoundException("سفارش یافت نشد.");

      if (order.status === OrderStatus.PAID)
        throw new BadRequestException("این سفارش قبلاً پرداخت شده است.");

      const card = await cardRepo.findOne({
        where: { user: { id: order.user.id } },
        relations: ["items"],
      });

      const payment = await paymentRepo.findOne({
        where: { authority },
        relations: ['order', 'user'],
      });
      if (!payment) throw new NotFoundException('تراکنش یافت نشد.');

      await paymentLogRepo.save({
        order,
        user: order.user,
        payment,
        authority,
        status: PaymentLogStatus.CALLBACK_RECEIVED,
        message: "در انتظار احراز تراکنش",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        payload: { status },
      });

      // 🚫 اگر کاربر پرداخت را لغو کرده باشد
      if (status !== "OK") {
        order.status = OrderStatus.FAILED;
        await manager.save(order);
        if (card) {
          card.status = CardStatus.OPEN;
          await cardRepo.save(card);
        }
        payment.status = PaymentStatus.FAILED;
        payment.message = "پرداخت توسط کاربر لغو شد.";
        await paymentRepo.save(payment);
        await paymentLogRepo.save({
          order,
          user: order.user,
          payment,
          authority,
          status: PaymentLogStatus.USER_CANCELLED,
          message: "پرداخت توسط کاربر لغو شد.",
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          payload: { status },
        });
        return {
          order,
          success: false,
          message: "پرداخت توسط کاربر لغو شد.",
          status: PaymentLogStatus.FAILED,
        };
      }

      // ✅ تأیید با زرین‌پال
      try {
        const verification = await zarinpal.PaymentVerification({
          Amount: order.total,
          Authority: authority,
        });
        // ✅ پرداخت موفق
        if ([100, 101].includes(verification.status)) {
          order.status = OrderStatus.PAID;
          await manager.save(order);
          if (card) {
            await cardItemRepo.delete({ cardId: card.id });
            card.itemsCount = 0;
            card.totalQuantity = 0;
            card.subtotal = 0;
            card.discountTotal = 0;
            card.total = 0;
            card.status = CardStatus.ABANDONED;
            card.items = [];
            await cardRepo.save(card);
          }
          payment.status = PaymentStatus.SUCCESS;
          payment.refId = verification.refId;
          payment.message = "پرداخت با موفقیت انجام شد.";
          await paymentRepo.save(payment);
          await paymentLogRepo.save({
            order: order,
            user: order.user,
            payment,
            authority,
            status: PaymentLogStatus.VERIFIED,
            message: "پرداخت با موفقیت انجام شد.",
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            payload: verification,
          });
          await this.invoiceService.createFromOrder(manager, order.id, order.user);
          return {
            order,
            success: true,
            refId: verification.refId,
            message: "پرداخت با موفقیت انجام شد.",
          };
        } else {
          order.status = OrderStatus.FAILED;
          await manager.save(order);
        }
      } catch (e) {
        (req as any).order = order;
        (req as any).user = order.user;
        await paymentLogRepo.save({
          order: order,
          user: order.user,
          payment,
          authority,
          status: PaymentLogStatus.FAILED,
          message: "خطای درگاه پرداخت",
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          payload: { e },
        });
        console.log(e);
        throw new ZarinpalException(e.errors.code, e.errors.message);
      }
    });
  }
}