import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { runInTransaction } from "src/common/helpers/transaction.helper";

import { Invoice, InvoiceStatus } from "./entities/invoice.entity";
import { Order } from "../order/entities/order.entity";
import { User } from "../user/entities/user.entity";

@Injectable()
export class InvoiceService {
    constructor(@InjectDataSource() private readonly dataSource: DataSource) { }

    // 🧾 ایجاد فاکتور از سفارش
    async createFromOrder(orderId: number, user: User) {
        return runInTransaction(this.dataSource, async (manager) => {
            const order = await manager.findOne(Order, {
                where: { id: orderId, user: { id: user.id } },
            });
            if (!order) throw new NotFoundException("سفارش یافت نشد.");

            const invoice = manager.create(Invoice, {
                order,
                user,
                subtotal: order.subtotal,
                discountTotal: order.discountTotal,
                total: order.total,
                couponCode: order.couponCode,
                couponDiscountAmount: order.couponDiscountAmount,
                totalPayable: order.total,
                status: InvoiceStatus.UNPAID,
            });

            const invoiceSave = await manager.save(Invoice, invoice);
            const returnedInvoice = await manager.findOne(Invoice, {
                where: { id: invoiceSave.id },
                relations: ["order"],
            });
            return returnedInvoice;
        });
    }

    // 📄 مشاهده فاکتور کاربر
    async getUserInvoices(user: User) {
        return this.dataSource.getRepository(Invoice).find({
            where: { user: { id: user.id } },
            order: { createdAt: "DESC" },
            relations: ["order"],
        });
    }

    // 🔍 جزئیات فاکتور
    async getInvoice(user: User, id: number) {
        const invoice = await this.dataSource.getRepository(Invoice).findOne({
            where: { id, user: { id: user.id } },
            relations: ["order"],
        });
        if (!invoice) throw new NotFoundException("فاکتور یافت نشد.");
        return invoice;
    }
}
