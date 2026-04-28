import { Injectable, NotFoundException, Logger, BadRequestException } from "@nestjs/common";
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
import { OrderItem } from "src/modules/order/entities/order-item.entity";
import { VariantProduct } from "src/modules/variant-product/entities/variant-product.entity";
import { Product } from "src/modules/product/entities/product.entity";
import { ProductCacheService } from "src/modules/product/cache";

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
    private readonly productCacheService: ProductCacheService
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

      console.log(e.response.data.errors);

      throw new ZarinpalException(
        e.response.data.errors.code ?? -1,
        e.response.data.errors.message ?? 'خطای نامشخص در درگاه پرداخت',
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

    await this.decreaseStock(manager, order.items);

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

  private async decreaseStock(manager: any, items: OrderItem[]): Promise<void> {
    for (const item of items) {
      if (item.variant) {
        const variant = await manager.findOne(VariantProduct, {
          where: { id: item.variant.id },
        });

        if (!variant) {
          throw new BadRequestException(
            `واریانت با شناسه ${item.variant.id} یافت نشد`
          );
        }

        if (variant.stock < item.quantity) {
          throw new BadRequestException(
            `موجودی واریانت ${variant.sku} کافی نیست. موجودی فعلی: ${variant.stock}`
          );
        }

        variant.stock -= item.quantity;
        await manager.save(VariantProduct, variant);
      } else if (item.product) {
        const product = await manager.findOne(Product, {
          where: { id: item.product.id },
        });

        if (!product) {
          throw new BadRequestException(
            `محصول با شناسه ${item.product.id} یافت نشد`
          );
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `موجودی محصول "${product.name}" کافی نیست. موجودی فعلی: ${product.stock}`
          );
        }

        product.stock -= item.quantity;
        await manager.save(Product, product);
        await this.productCacheService.clearProductCache(product.id);
      }
    }
  }
}
