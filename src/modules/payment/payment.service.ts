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
import { PaymentLogStatus } from "./entities/payment-logs.entity";
import { OrderStatus } from "../order/enums/order-status.enum";
import { PaymentStatus } from "./enums/payment-status.enum";
import { ZarinpalErrorMessage } from "./enums/zarinpal-message.enum";


// Services
import { InvoiceService } from "../invoice/invoice.service";
import { PaymentLogService } from "./payment-log.service";


// Exceptions
import { ZarinpalException } from "src/common/exceptions/zarinpal-exception";


// Utils
import { runInTransaction } from "src/common/helpers/transaction.helper";

// Third-party SDK
const zarinpal = require("zarinpal-checkout").create(
  process.env.ZARINPAL_MERCHANT_ID,
  false
);

@Injectable()
export class PaymentService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly invoiceService: InvoiceService,
    private readonly paymentLogService: PaymentLogService,
  ) { }

  // ────────────────────────────────────────────────
  // 💰 مرحله 1: ایجاد درخواست پرداخت در زرین‌پال
  // ────────────────────────────────────────────────
  async createPayment(orderId: number) {
    const orderRepo = this.dataSource.getRepository(Order);

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
    await this.dataSource.getRepository(Payment).save({
      user: order.user,
      order,
      authority: requestResult.authority,
      amount: order.total,
      status: PaymentStatus.PENDING,
      message: "در انتظار پرداخت کاربر...",
    });

    // بازگرداندن لینک درگاه
    return {
      authority: requestResult.authority,
      paymentUrl: requestResult.url,
      amount: order.total,
      orderId: order.id,
      message: "کاربر به درگاه پرداخت منتقل می‌شود.",
    };
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
    const result = await runInTransaction(this.dataSource, async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ["user"],
      });
      if (!order) throw new NotFoundException("سفارش یافت نشد.");

      if (order.status === OrderStatus.PAID)
        throw new BadRequestException("این سفارش قبلاً پرداخت شده است.");

      // 🚫 اگر کاربر پرداخت را لغو کرده باشد
      if (status !== "OK") {
        order.status = OrderStatus.FAILED;
        await manager.save(order);

        return {
          order,
          success: false,
          message: "پرداخت توسط کاربر لغو شد.",
          reason: PaymentLogStatus.USER_CANCELLED,
        };
      }

      // ✅ تأیید با زرین‌پال
      let verification: any;
      try {
        verification = await zarinpal.PaymentVerification({
          Amount: order.total,
          Authority: authority,
        });
      } catch (e: any) {
        const code = e.errors?.code ?? -50;

        (req as any).order = order;
        (req as any).user = order.user;

        throw new ZarinpalException(code, e.errors?.message);
      }

      // ✅ پرداخت موفق
      if ([100, 101].includes(verification.status)) {
        order.status = OrderStatus.PAID;
        await manager.save(order);

        return {
          order,
          success: true,
          refId: verification.RefID ?? verification.refId,
          message: "پرداخت با موفقیت انجام شد.",
        };
      }

      // ❌ خطای درگاه
      order.status = OrderStatus.FAILED;
      await manager.save(order);

      (req as any).order = order;
      (req as any).user = order.user;

      throw new ZarinpalException(
        verification.status,
        ZarinpalErrorMessage[verification.status],
      );
    });

    // 🧾 ساخت فاکتور فقط در صورت موفقیت
    let invoice: Invoice | null = null;
    if (result.success) {
      invoice = await this.invoiceService.createFromOrder(
        result.order.id,
        result.order.user,
      );
    }

    // 💳 ثبت Payment
    const payment = await this.dataSource.getRepository(Payment).save({
      user: result.order.user,
      order: result.order,
      invoice,
      authority,
      refId: result.refId,
      amount: result.order.total,
      status: result.success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
      message: result.message,
    });

    // ⚠️ فقط در حالت شکست، Log ثبت می‌کنیم
    if (!result.success) {
      await this.paymentLogService.createLog({
        order: result.order,
        user: result.order.user,
        payment,
        authority,
        status: result.reason as PaymentLogStatus,
        errorMessage: result.message,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });
    }

    // 📤 خروجی نهایی
    return result.success
      ? {
        paymentStatus: PaymentStatus.SUCCESS,
        refId: result.refId,
        message: "پرداخت با موفقیت انجام شد.",
      }
      : {
        paymentStatus: PaymentStatus.FAILED,
        message: result.message,
      };
  }
}
