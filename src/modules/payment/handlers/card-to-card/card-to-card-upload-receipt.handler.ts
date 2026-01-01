import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { Payment } from '../../entities/payment.entity';
import { PaymentLog } from '../../entities/payment-logs.entity';
import { Order } from '../../../order/entities/order.entity';
import { User } from '../../../user/entities/user.entity';

import { OrderStatus } from '../../../order/enums/order-status.enum';
import { CardToCardStatus, PaymentMethod, PaymentStatus, PaymentLogStatus } from '../../enums/payment-status.enum';

import { UploadReceiptDto } from '../../dto/card-to-card/upload-receipt.dto';

@Injectable()
export class CardToCardUploadReceiptHandler {
  private readonly logger = new Logger(CardToCardUploadReceiptHandler.name);

  /**
   * آپلود رسید پرداخت
   * 
   * گام‌ها:
   * 1. بررسی Payment
   * 2. بروزرسانی اطلاعات رسید
   * 3. تغییر وضعیت به UPLOADED
   * 4. تغییر وضعیت Order به PAYMENT_CONFIRMATION_PENDING
   * 5. ثبت Log
   */
  async handle(
    manager: EntityManager,
    user: User,
    paymentId: number,
    receiptImageId: number | undefined,
    dto: UploadReceiptDto,
  ): Promise<Payment> {
    const paymentRepo = manager.getRepository(Payment);
    const paymentLogRepo = manager.getRepository(PaymentLog);
    const orderRepo = manager.getRepository(Order);

    // ✅ 1. بررسی Payment
    const payment = await paymentRepo.findOne({
      where: {
        id: paymentId,
        user: { id: user.id },
        paymentMethod: PaymentMethod.CARD_TO_CARD,
      },
      relations: ['order', 'receiptImage'],
    });

    if (!payment) {
      throw new NotFoundException('پرداخت یافت نشد');
    }

    if (payment.cardToCardStatus === CardToCardStatus.APPROVED) {
      throw new BadRequestException('این پرداخت قبلاً تایید شده است');
    }

    const order = await orderRepo.findOne({
      where: { id: payment.orderId, user: { id: user.id } },
    });

    if (!order) {
      throw new NotFoundException('سفارش یافت نشد');
    }

    // ✅ 2. بروزرسانی اطلاعات رسید
    if (receiptImageId) {
      payment.receiptImageId = receiptImageId;
    }

    if (dto.senderCardNumber) {
      payment.senderCardNumber = dto.senderCardNumber;
    }

    if (dto.trackingCode) {
      payment.trackingCode = dto.trackingCode;
    }

    payment.depositDate = dto.depositDate ? new Date(dto.depositDate) : new Date();

    // ✅ 3. تغییر وضعیت به UPLOADED
    payment.cardToCardStatus = CardToCardStatus.UPLOADED;
    payment.status = PaymentStatus.PENDING;

    // پیام بر اساس نوع ثبت
    if (receiptImageId && (dto.senderCardNumber || dto.trackingCode)) {
      payment.message = 'رسید و اطلاعات دستی ثبت شد، منتظر تایید ادمین';
    } else if (receiptImageId) {
      payment.message = 'تصویر رسید آپلود شد، منتظر تایید ادمین';
    } else {
      payment.message = 'اطلاعات واریز ثبت شد، منتظر تایید ادمین';
    }

    const saved = await paymentRepo.save(payment);

    // ✅ 4. تغییر وضعیت Order
    order.status = OrderStatus.PAYMENT_CONFIRMATION_PENDING;
    await orderRepo.save(order);

    // ✅ 5. ثبت Log
    await paymentLogRepo.save({
      order,
      payment: saved,
      user,
      authority: saved.authority,
      status: PaymentLogStatus.CALLBACK_RECEIVED,
      message: 'رسید آپلود شد، در انتظار بررسی ادمین',
      payload: {
        hasImage: !!receiptImageId,
        hasCardNumber: !!dto.senderCardNumber,
        hasTrackingCode: !!dto.trackingCode,
        depositDate: dto.depositDate,
      },
    });

    this.logger.log(`Receipt uploaded for payment ${saved.id}`);

    // بارگذاری مجدد با relation
    return await paymentRepo.findOne({
      where: { id: saved.id },
      relations: ['order', 'receiptImage'],
    }) as Payment;
  }
}
