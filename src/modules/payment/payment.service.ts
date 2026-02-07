import { Injectable, Logger } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { Request } from "express";

import { runInTransaction } from "src/common/helpers/transaction.helper";

import { PaymentCreationHandler } from "./handlers/payment-creation.handler";
import { PaymentVerificationHandler } from "./handlers/payment-verification.handler";
import { paginate, PaginateQuery } from "nestjs-paginate";
import { InjectRepository } from "@nestjs/typeorm";
import { Payment } from "./entities/payment.entity";

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly paymentCreationHandler: PaymentCreationHandler,
    private readonly paymentVerificationHandler: PaymentVerificationHandler,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) { }

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

  async getAllPayment(query: PaginateQuery) {
    const payments = await paginate(query, this.paymentRepository, {
      sortableColumns: ["id", "amount", "status", "createdAt"],
      relations: ['order', 'user', 'logs'],
      defaultSortBy: [["createdAt", "DESC"]],
      searchableColumns: ["orderId", "authority"],
    });

    return {
      items: payments.data,
      meta: payments.meta,
      links: payments.links,
    }
  }
}
