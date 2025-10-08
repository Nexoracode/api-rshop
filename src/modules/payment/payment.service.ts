import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { runInTransaction } from "src/common/helpers/transaction.helper";
import * as ZarinpalCheckout from "zarinpal-checkout";

import { Order } from "../order/entities/order.entity";
import { InvoiceService } from "../invoice/invoice.service";
import { PaymentStatus } from "./enums/payment-status.enum";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { OrderStatus } from "../order/enums/order-status.enum";
import { ZarinpalException } from "src/common/exceptions/zarinpal-exception";

@Injectable()
export class PaymentService {
  private zarinpal;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly invoiceService: InvoiceService
  ) {
    this.zarinpal = ZarinpalCheckout.create(
      process.env.ZARINPAL_MERCHANT_ID,
      true // sandbox mode = true
    );
  }

  /**
   * 🟢 ایجاد لینک پرداخت برای سفارش
   */
  async createPayment(dto: CreatePaymentDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: dto.orderId },
        relations: ["user"],
      });

      if (!order) throw new NotFoundException("سفارش یافت نشد.");

      if (order.status !== OrderStatus.PENDING)
        throw new BadRequestException("سفارش در وضعیت پرداخت در انتظار نیست.");

      const callbackUrl = `${dto.callback}?orderId=${order.id}`;

      const response = await this.zarinpal.PaymentRequest({
        Amount: order.total,
        CallbackURL: callbackUrl,
        Description: `پرداخت سفارش #${order.id}`,
        Email: order.user?.email || "",
        Mobile: order.user?.phone || "",
      });

      if (response.status !== 100) {
        throw new ZarinpalException(response.status, "درخواست پرداخت");
      }

      return {
        authority: response.authority,
        gatewayUrl: response.url,
        message: "در حال هدایت به درگاه پرداخت...",
      };
    });
  }

  /**
   * 🔵 تأیید پرداخت بعد از بازگشت از درگاه زرین‌پال
   */
  async verifyPayment(orderId: number, authority: string, status: string) {
    const result = await runInTransaction(this.dataSource, async (manager) => {
      const order = await manager.findOne(Order, { where: { id: orderId }, relations: ["user"] });
      if (!order) throw new NotFoundException("سفارش یافت نشد.");

      if (status !== "OK") {
        order.status = OrderStatus.FAILED;
        await manager.save(order);
        return { order, success: false, message: "پرداخت لغو شد." };
      }

      const verification = await this.zarinpal.PaymentVerification({
        Amount: order.total,
        Authority: authority,
      });

      if (verification.status === 100 || verification.status === 101) {
        order.status = OrderStatus.PAID;
        await manager.save(order);
        return { order, success: true, refId: verification.ref_id };
      }

      order.status = OrderStatus.FAILED;
      await manager.save(order);
      throw new ZarinpalException(verification.status, "تأیید پرداخت");
    });

    // ✅ ساخت فاکتور را بیرون از تراکنش انجام بده
    if (result.success) {
      await this.invoiceService.createFromOrder(result.order.id, result.order.user);
      return {
        paymentStatus: PaymentStatus.SUCCESS,
        refId: result.refId,
        message: "پرداخت با موفقیت انجام شد.",
      };
    } else {
      return {
        paymentStatus: PaymentStatus.FAILED,
        message: result.message,
      };
    }
  }

}
