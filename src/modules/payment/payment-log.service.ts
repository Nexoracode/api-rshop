import { Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { Order } from "../order/entities/order.entity";
import { User } from "../user/entities/user.entity";
import { PaymentLog } from "./entities/payment-logs.entity";
import { Payment } from "./entities/payment.entity";
import { PaymentLogStatus } from "./enums/payment-status.enum";

@Injectable()
export class PaymentLogService {
    constructor(
        @InjectRepository(PaymentLog)
        private readonly paymentLogRepo: Repository<PaymentLog>
    ) { }

    async createLog(params: {
        order: Order;
        user: User;
        authority?: string;
        status: PaymentLogStatus;
        errorCode?: number;
        message?: string;
        refId?: string;
        ip?: string;
        userAgent?: string;
        payment: Payment,
        payload: any;
    }) {
        const log = this.paymentLogRepo.create({
            order: params.order,
            user: params.user,
            payment: params.payment,
            payload: params.payload,
            authority: params.authority,
            status: params.status,
            errorCode: params.errorCode,
            message: params.message,
            refId: params.refId,
            ip: params.ip,
            userAgent: params.userAgent,
        });
        return this.paymentLogRepo.save(log);
    }

    async getAllLogs() {
        return this.paymentLogRepo.find({
            relations: ["user", "order"],
            order: { createdAt: "DESC" },
        });
    }

    async getLogByOrder(orderId: number) {
        return this.paymentLogRepo.find({
            where: { order: { id: orderId } },
            relations: ["user", "order"],
            order: { createdAt: "DESC" },
        });
    }
}
