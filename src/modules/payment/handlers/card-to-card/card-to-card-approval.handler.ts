import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { Payment } from '../../entities/payment.entity';
import { PaymentLog } from '../../entities/payment-logs.entity';
import { Order } from '../../../order/entities/order.entity';
import { User } from '../../../user/entities/user.entity';
import { Product } from '../../../product/entities/product.entity';
import { VariantProduct } from '../../../variant-product/entities/variant-product.entity';
import { Promotion } from '../../../promotion/domain/entities/promotion.entity';

import { OrderStatus } from '../../../order/enums/order-status.enum';
import { CardToCardStatus, PaymentMethod, PaymentStatus, PaymentLogStatus } from '../../enums/payment-status.enum';
import { InvoiceStatus } from '../../../invoice/enums/invoice-status.enum';

import { InvoiceService } from '../../../invoice/invoice.service';
import { CardStatusService } from '../../../card/card-status.service';
import { ReviewReceiptDto } from '../../dto/card-to-card/review-receipt.dto';

@Injectable()
export class CardToCardApprovalHandler {
  private readonly logger = new Logger(CardToCardApprovalHandler.name);

  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly cardStatusService: CardStatusService,
  ) { }

  /**
   * تایید رسید توسط ادمین
   * 
   * گام‌ها:
   * 1. بررسی Payment و Order
   * 2. کم کردن موجودی
   * 3. افزایش شمارنده Promotion
   * 4. تغییر وضعیت Order به PROCESSING
   * 5. بروزرسانی Payment
   * 6. Abandon کردن Cart
   * 7. ایجاد Invoice
   * 8. ثبت Log
   */
  async handle(
    manager: EntityManager,
    admin: User,
    payment: Payment,
    dto: ReviewReceiptDto,
  ): Promise<Payment> {
    const paymentRepo = manager.getRepository(Payment);
    const paymentLogRepo = manager.getRepository(PaymentLog);
    const orderRepo = manager.getRepository(Order);

    // ✅ 1. بررسی Order
    const order = await orderRepo.findOne({
      where: { id: payment.order.id },
      relations: ['items', 'items.product', 'items.variant'],
    });

    if (!order) {
      throw new NotFoundException('سفارش یافت نشد');
    }

    if (order.status !== OrderStatus.PAYMENT_CONFIRMATION_PENDING) {
      throw new BadRequestException(
        `وضعیت سفارش برای تایید پرداخت مناسب نیست. وضعیت فعلی: ${order.status}`
      );
    }

    // ✅ 2. کم کردن موجودی
    await this.decreaseStock(manager, order);

    // ✅ 3. افزایش شمارنده Promotion
    if (order.promotionDetails && order.promotionDetails.length > 0) {
      const promotionIds = order.promotionDetails.map(p => p.promotionId);
      await this.incrementPromotionUsage(manager, promotionIds);
    }

    // ✅ 4. تغییر وضعیت Order به PROCESSING
    order.status = OrderStatus.PROCESSING;
    await orderRepo.save(order);

    // ✅ 5. بروزرسانی Payment
    payment.cardToCardStatus = CardToCardStatus.APPROVED;
    payment.status = PaymentStatus.SUCCESS;
    payment.message = 'پرداخت تایید شد';
    payment.adminNote = dto.adminNote || 'تایید شده';
    payment.reviewedById = admin.id;
    payment.reviewedAt = new Date();
    payment.refId = payment.trackingCode || `C2C-${payment.id}-${order.id}`;
    await paymentRepo.save(payment);

    // ✅ 6. Abandon کردن Cart
    try {
      await this.cardStatusService.abandonCart(payment.user.id, manager);
    } catch (error) {
      // ⚠️ فقط لاگ میکنیم، transaction را fail نمیکنیم
      this.logger.error(
        `Failed to abandon cart for user ${payment.user.id}`,
        error.stack,
      );
    }

    // ✅ 7. ایجاد Invoice
    const invoice = await this.invoiceService.createFromOrder(
      manager,
      order.id,
      payment.user,
    );

    // بروزرسانی وضعیت Invoice به PAID
    if (invoice) {
      await this.invoiceService.updateInvoiceStatus(
        manager,
        order.id,
        InvoiceStatus.PAID,
      );
    }

    // ✅ 8. ثبت Log
    await paymentLogRepo.save({
      order,
      payment,
      user: payment.user,
      authority: payment.authority,
      status: PaymentLogStatus.VERIFIED,
      message: 'پرداخت توسط ادمین تایید شد و فاکتور صادر شد',
      payload: {
        adminId: admin.id,
        invoiceId: invoice?.id,
        refId: payment.refId,
        adminNote: dto.adminNote,
      },
    });

    this.logger.log(
      `Payment ${payment.id} approved by admin ${admin.id}, invoice ${invoice?.id} created`
    );

    return payment;
  }

  /**
   * کم کردن موجودی محصولات/واریانت‌ها
   */
  private async decreaseStock(manager: EntityManager, order: Order): Promise<void> {
    const orderWithItems = await manager.findOne(Order, {
      where: { id: order.id },
      relations: ['items', 'items.product', 'items.variant'],
    });

    if (!orderWithItems || !orderWithItems.items) {
      throw new BadRequestException('آیتم‌های سفارش یافت نشد');
    }

    for (const item of orderWithItems.items) {
      if (item.variant) {
        // کم کردن موجودی واریانت
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
        // کم کردن موجودی محصول
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
      }
    }
  }

  /**
   * افزایش تعداد استفاده از پروموشن
   */
  private async incrementPromotionUsage(
    manager: EntityManager,
    promotionIds: number[]
  ): Promise<void> {
    for (const promotionId of promotionIds) {
      const promotion = await manager.findOne(Promotion, {
        where: { id: promotionId },
      });

      if (promotion) {
        promotion.usedCount = (promotion.usedCount || 0) + 1;
        await manager.save(Promotion, promotion);
      }
    }
  }
}
