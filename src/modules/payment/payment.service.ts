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


// Exceptions
import { ZarinpalException } from "src/common/exceptions/zarinpal-exception";


// Utils
import { runInTransaction } from "src/common/helpers/transaction.helper";
import { Card, CardStatus } from "../card/entities/card.entity";
import { CardItem } from "../card/entities/card-item.entity";
import { PaymentLog } from "./entities/payment-logs.entity";

const relations = ['user', 'items', 'items.product', 'items.product.mediaPinned', 'items.variant', 'items.variant.attributes', 'items.variant.attributes.attribute', 'items.variant.attributes.value'];

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
  async createPayment(callbackUrl: string, orderId: number, req: Request) {
    return runInTransaction(this.dataSource, async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const paymentRepo = manager.getRepository(Payment);
      const paymentLogRepo = manager.getRepository(PaymentLog);
      const cardRepo = manager.getRepository(Card);

      // 🔹 ۱. دریافت سفارش و بررسی وضعیت
      const order = await orderRepo.findOne({
        where: { id: orderId },
        relations: ['user', 'user.addresses'],
      });
      if (!order) throw new NotFoundException('سفارش یافت نشد.');

      if (
        ![
          OrderStatus.AWAITING_PAYMENT,
          OrderStatus.PAYMENT_FAILED,
          OrderStatus.PENDING_APPROVAL,
        ].includes(order.status)
      ) {
        throw new BadRequestException('این سفارش قابل پرداخت نیست.');
      }

      // 🔹 ۲. قفل کردن کارت خرید در صورت وجود
      const card = await cardRepo.findOne({
        where: { user: { id: order.user.id }, status: CardStatus.OPEN },
      });
      if (card) {
        card.status = CardStatus.LOCKED;
        await cardRepo.save(card);
      }

      // 🔹 ۳. ارسال درخواست به زرین‌پال
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
        // ثبت لاگ خطا در درگاه
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

      // 🔹 ۴. بررسی پاسخ زرین‌پال
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

      // 🔹 ۵. ساخت رکورد پرداخت در دیتابیس
      const payment = await paymentRepo.save({
        user: order.user,
        order,
        authority: requestResult.authority,
        amount: order.total,
        status: PaymentStatus.IN_PROGRESS,
        message: 'در انتظار پرداخت کاربر...',
        gateway: PaymentGateway.ZARINPAL,
      });

      // 🔹 ۶. به‌روزرسانی وضعیت سفارش
      order.status = OrderStatus.PAYMENT_CONFIRMATION_PENDING;
      await orderRepo.save(order);

      // 🔹 ۷. ثبت لاگ موفق ساخت لینک پرداخت
      await paymentLogRepo.save({
        order,
        user: order.user,
        payment,
        authority: payment.authority,
        status: PaymentLogStatus.INITIATED,
        message: 'لینک پرداخت ایجاد شد، در انتظار پرداخت کاربر',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        payload: requestResult,
      });

      // 🔹 ۸. بازگرداندن پاسخ برای انتقال به درگاه
      // نگه داشتن وضعیت PENDING مطابق با نوع فیلد وضعیت در موجودیت پرداخت
      payment.status = PaymentStatus.IN_PROGRESS;
      await paymentRepo.save(payment);

      return {
        success: true,
        message: 'کاربر به درگاه پرداخت منتقل می‌شود.',
        authority: requestResult.authority,
        paymentUrl: requestResult.url,
        amount: order.total,
        orderId: order.id,
        orderStatus: order.status,
      };
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

      // 🔹 مرحله ۱: واکشی اطلاعات تراکنش
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

      // 🚫 جلوگیری از verify تکراری
      if (payment.status === PaymentStatus.SUCCESS) {
        return {
          success: true,
          message: 'این پرداخت قبلاً تایید شده است.',
          refId: payment.refId,
        };
      }

      // 🔹 بررسی وضعیت مجاز سفارش برای پرداخت
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

      // 🔹 قفل کارت خرید در صورت وجود
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

      // 🚫 اگر کاربر پرداخت را لغو کرده
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

        return {
          success: false,
          message: 'پرداخت توسط کاربر لغو شد.',
          orderStatus: order.status,
        };
      }

      // ──────────────────────────────
      // ✅ مرحله ۲: تأیید تراکنش با زرین‌پال
      // ──────────────────────────────
      try {
        const verification = await zarinpal.PaymentVerification({
          Amount: order.total,
          Authority: authority,
        });

        if (verification.status === 100) {
          // 🔹 پرداخت موفق جدید
          order.status = OrderStatus.PREPARING;
          payment.status = PaymentStatus.SUCCESS;
          payment.refId = verification.RefID || verification.refId;
          payment.message = 'پرداخت با موفقیت تایید شد.';
          await orderRepo.save(order);
          await paymentRepo.save(payment);

          // 🔹 پاک‌سازی کارت خرید
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

          // 🔹 ثبت لاگ موفق
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

          // 🔹 ساخت فاکتور (با کنترل خطا)
          try {
            const invoice = await this.invoiceService.createFromOrder(
              manager,
              order.id,
              order.user,
            );
            return {
              success: true,
              message: 'پرداخت با موفقیت انجام شد.',
              refId: verification.refId,
              invoiceDate: invoice!.createdAt,
              order,
            };
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
            return {
              success: true,
              message: 'پرداخت تایید شد اما فاکتور صادر نشد.',
              refId: verification.refId,
              order,
            };
          }
        }

        // 🔸 اگر تراکنش قبلاً تایید شده (کد 101)
        if (verification.status === 101) {
          return {
            success: true,
            message: 'این تراکنش قبلاً تایید شده است.',
            refId: payment.refId,
          };
        }

        // 🔻 وضعیت‌های دیگر: پرداخت ناموفق
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

        return {
          success: false,
          message: 'پرداخت ناموفق بود.',
          orderStatus: order.status,
        };
      } catch (e) {
        // 🔴 خطا هنگام تماس با زرین‌پال
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
        // 🔹 آزادسازی کارت در صورت قفل‌شده
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