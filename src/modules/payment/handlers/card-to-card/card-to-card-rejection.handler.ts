import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { Payment } from '../../entities/payment.entity';
import { PaymentLog } from '../../entities/payment-logs.entity';
import { Order } from '../../../order/entities/order.entity';
import { User } from '../../../user/entities/user.entity';

import { OrderStatus } from '../../../order/enums/order-status.enum';
import { CardToCardStatus, PaymentMethod, PaymentStatus, PaymentLogStatus } from '../../enums/payment-status.enum';

import { CardStatusService } from '../../../card/card-status.service';
import { ReviewReceiptDto } from '../../dto/card-to-card/review-receipt.dto';

@Injectable()
export class CardToCardRejectionHandler {
  private readonly logger = new Logger(CardToCardRejectionHandler.name);

  constructor(
    private readonly cardStatusService: CardStatusService,
  ) {}

  /**
   * رد کردن رسید توسط ادمین
   * 
   * گام‌ها:
   * 1. بررسی Payment
   * 2. بروزرسانی وضعیت Payment
   * 3. تغییر وضعیت Order به AWAITING_PAYMENT (مثل لغو کاربر!)
   * 4. Unlock کردن Cart
   * 5. ثبت Log
   * 
   * ✅ توجه: Order به AWAITING_PAYMENT می‌ره تا کاربر بتونه دوباره تلاش کنه
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

    if (!dto.adminNote || dto.adminNote.trim().length === 0) {
      throw new BadRequestException('لطفاً دلیل رد را وارد کنید');
    }

    // ✅ 1. بروزرسانی Payment
    payment.cardToCardStatus = CardToCardStatus.REJECTED;
    payment.status = PaymentStatus.FAILED;
    payment.message = 'رسید رد شد';
    payment.adminNote = dto.adminNote;
    payment.reviewedById = admin.id;
    payment.reviewedAt = new Date();
    await paymentRepo.save(payment);

    // ✅ 2. تغییر وضعیت Order به AWAITING_PAYMENT
    // (مثل لغو کاربر - می‌تونه دوباره تلاش کنه)
    const order = await orderRepo.findOne({
      where: { id: payment.order.id },
    });

    if (order) {
      order.status = OrderStatus.AWAITING_PAYMENT;  // ✅ نه REJECTED!
      await orderRepo.save(order);
    }

    // ✅ 3. Unlock کردن Cart
    await this.cardStatusService.unlockCart(payment.user.id, manager);

    // ✅ 4. ثبت Log
    await paymentLogRepo.save({
      order: payment.order,
      payment,
      user: payment.user,
      authority: payment.authority,
      status: PaymentLogStatus.FAILED,
      message: `رسید توسط ادمین رد شد: ${dto.adminNote}`,
      payload: { adminId: admin.id, reason: dto.adminNote },
    });

    this.logger.warn(`Payment ${payment.id} rejected by admin ${admin.id}: ${dto.adminNote}`);

    return payment;
  }
}
