import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Request } from 'express';

import { Payment } from './entities/payment.entity';
import { User } from '../user/entities/user.entity';

import { CardToCardStatus, PaymentMethod } from './enums/payment-status.enum';

import { InitiateCardToCardDto } from './dto/card-to-card/initiate-card-to-card.dto';
import { UploadReceiptDto } from './dto/card-to-card/upload-receipt.dto';
import { ReviewReceiptDto } from './dto/card-to-card/review-receipt.dto';

import { runInTransaction } from 'src/common/helpers/transaction.helper';

import { CardToCardInitiationHandler } from './handlers/card-to-card/card-to-card-initiation.handler';
import { CardToCardUploadReceiptHandler } from './handlers/card-to-card/card-to-card-upload-receipt.handler';
import { CardToCardRejectionHandler } from './handlers/card-to-card/card-to-card-rejection.handler';
import { CardToCardApprovalHandler } from './handlers/card-to-card/card-to-card-approval.handler';

@Injectable()
export class CardToCardService {
  private readonly logger = new Logger(CardToCardService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly dataSource: DataSource,
    private readonly initiationHandler: CardToCardInitiationHandler,
    private readonly uploadReceiptHandler: CardToCardUploadReceiptHandler,
    private readonly rejectionHandler: CardToCardRejectionHandler,
    private readonly approvalHandler: CardToCardApprovalHandler,
  ) {}

  // ────────────────────────────────────────────────
  // 💳 کاربر: ایجاد پرداخت کارت به کارت
  // ────────────────────────────────────────────────
  async initiate(user: User, dto: InitiateCardToCardDto, req: Request) {
    this.logger.log(`Initiating card-to-card payment for order ${dto.orderId} by user ${user.id}`);

    return await runInTransaction(this.dataSource, async (manager) => {
      return await this.initiationHandler.handle(manager, user, dto, req);
    });
  }

  // ────────────────────────────────────────────────
  // 📤 کاربر: آپلود رسید
  // ────────────────────────────────────────────────
  async uploadReceipt(
    user: User,
    paymentId: number,
    receiptImageId: number | undefined,
    dto: UploadReceiptDto,
  ) {
    this.logger.log(`Uploading receipt for payment ${paymentId} by user ${user.id}`);

    return await runInTransaction(this.dataSource, async (manager) => {
      return await this.uploadReceiptHandler.handle(
        manager,
        user,
        paymentId,
        receiptImageId,
        dto,
      );
    });
  }

  // ────────────────────────────────────────────────
  // 👨‍💼 ادمین: بررسی و تایید/رد رسید
  // ────────────────────────────────────────────────
  async reviewReceipt(admin: User, paymentId: number, dto: ReviewReceiptDto) {
    this.logger.log(`Reviewing payment ${paymentId} by admin ${admin.id}`);

    return await runInTransaction(this.dataSource, async (manager) => {
      // بارگذاری Payment
      const payment = await manager.findOne(Payment, {
        where: {
          id: paymentId,
          paymentMethod: PaymentMethod.CARD_TO_CARD,
        },
        relations: ['order', 'order.user', 'user', 'receiptImage'],
      });

      if (!payment) {
        throw new NotFoundException('پرداخت یافت نشد');
      }

      if (payment.cardToCardStatus !== CardToCardStatus.UPLOADED) {
        throw new BadRequestException(
          `این پرداخت در وضعیت مناسب برای بررسی نیست. وضعیت فعلی: ${payment.cardToCardStatus}`
        );
      }

      // رد شد → RejectionHandler
      if (dto.status === CardToCardStatus.REJECTED) {
        return await this.rejectionHandler.handle(manager, admin, payment, dto);
      }

      // تایید شد → ApprovalHandler
      if (dto.status === CardToCardStatus.APPROVED) {
        return await this.approvalHandler.handle(manager, admin, payment, dto);
      }

      throw new BadRequestException('وضعیت نامعتبر است');
    });
  }

  // ────────────────────────────────────────────────
  // 📋 Query: دریافت لیست پرداخت‌ها
  // ────────────────────────────────────────────────
  /**
   * دریافت لیست پرداخت‌های کارت به کارت (ادمین)
   */
  async findAllForAdmin(status?: CardToCardStatus) {
    const where: any = {
      paymentMethod: PaymentMethod.CARD_TO_CARD,
    };

    if (status) {
      where.cardToCardStatus = status;
    }

    return await this.paymentRepo.find({
      where,
      relations: ['user', 'order', 'receiptImage', 'reviewedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * دریافت پرداخت‌های کاربر
   */
  async findAllByUser(user: User) {
    return await this.paymentRepo.find({
      where: {
        user: { id: user.id },
        paymentMethod: PaymentMethod.CARD_TO_CARD,
      },
      relations: ['order', 'receiptImage'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * دریافت جزئیات یک پرداخت
   */
  async findOne(id: number, user?: User) {
    const where: any = {
      id,
      paymentMethod: PaymentMethod.CARD_TO_CARD,
    };

    if (user) {
      where.user = { id: user.id };
    }

    const payment = await this.paymentRepo.findOne({
      where,
      relations: ['user', 'order', 'receiptImage', 'reviewedBy'],
    });

    if (!payment) {
      throw new NotFoundException('پرداخت یافت نشد');
    }

    return payment;
  }
}
