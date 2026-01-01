import { Injectable, Logger } from "@nestjs/common";
import { DataSource } from "typeorm";
import { Request } from "express";

import { runInTransaction } from "src/common/helpers/transaction.helper";

import { PaymentCreationHandler } from "./handlers/payment-creation.handler";
import { PaymentVerificationHandler } from "./handlers/payment-verification.handler";

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly paymentCreationHandler: PaymentCreationHandler,
    private readonly paymentVerificationHandler: PaymentVerificationHandler,
  ) {}

  // ────────────────────────────────────────────────
  // 💰 مرحله 1: ایجاد درخواست پرداخت در زرین‌پال
  // ────────────────────────────────────────────────
  async createPayment(callbackUrl: string, orderId: number, req: Request) {
    this.logger.log(`Creating payment request for order ${orderId}`);

    return runInTransaction(this.dataSource, async (manager) => {
      return await this.paymentCreationHandler.handle(
        manager,
        callbackUrl,
        orderId,
        req,
      );
    });
  }

  // ────────────────────────────────────────────────
  // 💳 مرحله 2: تأیید پرداخت (بازگشت از درگاه)
  // ────────────────────────────────────────────────
  async verifyPayment(authority: string, status: string, req: Request) {
    this.logger.log(`Verifying payment for authority: ${authority}`);

    return runInTransaction(this.dataSource, async (manager) => {
      return await this.paymentVerificationHandler.handle(
        manager,
        authority,
        status,
        req,
      );
    });
  }
}
