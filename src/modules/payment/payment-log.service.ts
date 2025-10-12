import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import { Order } from "../order/entities/order.entity";
import { User } from "../user/entities/user.entity";
import { PaymentLog, PaymentLogStatus } from "./entities/payment-logs.entity";
import { Payment } from "./entities/payment.entity";

@Injectable()
export class PaymentLogService {
    constructor(@InjectDataSource() private readonly dataSource: DataSource) { }

    async createLog(params: {
        order: Order;
        user: User;
        authority: string;
        status: PaymentLogStatus;
        errorCode?: number;
        errorMessage?: string;
        refId?: string;
        ip?: string;
        userAgent?: string;
        payment: Payment,
    }) {
        const repo = this.dataSource.getRepository(PaymentLog);
        const log = repo.create({
            order: params.order,
            user: params.user,
            authority: params.authority,
            status: params.status,
            errorCode: params.errorCode,
            errorMessage: params.errorMessage,
            refId: params.refId,
            ip: params.ip,
            userAgent: params.userAgent,
            payment: params.payment,
        });
        return repo.save(log);
    }

    async getAllLogs() {
        return this.dataSource.getRepository(PaymentLog).find({
            relations: ["user", "order"],
            order: { createdAt: "DESC" },
        });
    }

    async getLogByOrder(orderId: number) {
        return this.dataSource.getRepository(PaymentLog).find({
            where: { order: { id: orderId } },
            relations: ["user", "order"],
            order: { createdAt: "DESC" },
        });
    }
}
