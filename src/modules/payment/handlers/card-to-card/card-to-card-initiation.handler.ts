import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { Request } from 'express';

import { Payment } from '../../entities/payment.entity';
import { PaymentLog } from '../../entities/payment-logs.entity';
import { Order } from '../../../order/entities/order.entity';
import { User } from '../../../user/entities/user.entity';

import { OrderStatus } from '../../../order/enums/order-status.enum';
import { CardToCardStatus, PaymentMethod, PaymentStatus, PaymentLogStatus } from '../../enums/payment-status.enum';

import { CardStatusService } from '../../../card/card-status.service';
import { InitiateCardToCardDto } from '../../dto/card-to-card/initiate-card-to-card.dto';

@Injectable()
export class CardToCardInitiationHandler {
  private readonly logger = new Logger(CardToCardInitiationHandler.name);

  constructor(
    private readonly cardStatusService: CardStatusService,
  ) { }

  /**
   * ایجاد پرداخت کارت به کارت
   * 
   * گام‌ها:
   * 1. بررسی Order
   * 2. بررسی Payment های موجود
   * 3. Lock کردن Cart
   * 4. ایجاد Payment جدید
   * 5. ثبت Log
   */
  async handle(
    manager: EntityManager,
    user: User,
    dto: InitiateCardToCardDto,
    req: Request,
  ): Promise<Payment> {
    const paymentRepo = manager.getRepository(Payment);
    const paymentLogRepo = manager.getRepository(PaymentLog);
    const orderRepo = manager.getRepository(Order);

    // ✅ 1. بررسی Order
    const order = await orderRepo.findOne({
      where: {
        id: dto.orderId,
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

    // ✅ 2. بررسی Payment های موجود
    // اگه Payment با وضعیت PENDING داره، برگردون
    const existingPayment = await paymentRepo.findOne({
      where: {
        order: { id: order.id },
        paymentMethod: PaymentMethod.CARD_TO_CARD,
        cardToCardStatus: CardToCardStatus.PENDING,
      },
    });

    if (existingPayment) {
      this.logger.debug(`Returning existing pending payment ${existingPayment.id} for order ${order.id}`);
      return existingPayment;
    }

    // اگه Payment با وضعیت UPLOADED داره، برگردون
    const uploadedPayment = await paymentRepo.findOne({
      where: {
        order: { id: order.id },
        paymentMethod: PaymentMethod.CARD_TO_CARD,
        cardToCardStatus: CardToCardStatus.UPLOADED,
      },
      relations: ['order', 'receiptImage'],
    });

    if (uploadedPayment) {
      this.logger.debug(`Returning existing uploaded payment ${uploadedPayment.id} for order ${order.id}`);
      return uploadedPayment;
    }

    // ✅ 3. Lock کردن Cart
    await this.cardStatusService.lockCart(user.id, manager);

    // ✅ 4. ایجاد Payment جدید
    const payment = paymentRepo.create({
      order,
      user,
      amount: Number(order.total),
      authority: `C2C-${Date.now()}-${order.id}`,
      status: PaymentStatus.PENDING,
      message: 'منتظر آپلود رسید',
      paymentMethod: PaymentMethod.CARD_TO_CARD,
      cardToCardStatus: CardToCardStatus.PENDING,
    });

    const savedPayment = await paymentRepo.save(payment);

    // ✅ 5. ثبت Log
    await paymentLogRepo.save({
      order,
      payment: savedPayment,
      user,
      ip: req.ip,
      authority: savedPayment.authority,
      status: PaymentLogStatus.INITIATED,
      userAgent: req.headers['user-agent'],
      message: 'پرداخت کارت به کارت ایجاد شد، در انتظار آپلود رسید',
      payload: { orderId: order.id, amount: order.total },
    });

    this.logger.log(`Card-to-card payment ${savedPayment.id} initiated for order ${order.id}`);

    return savedPayment;
  }
}
