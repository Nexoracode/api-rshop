import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, EntityManager } from "typeorm";
import { runInTransaction } from "src/common/helpers/transaction.helper";

import { Invoice } from "./entities/invoice.entity";
import { Order } from "../order/entities/order.entity";
import { User } from "../user/entities/user.entity";
import { InvoiceStatus } from "./enums/invoice-status.enum";
import { OrderStatus } from "../order/enums/order-status.enum";

@Injectable()
export class InvoiceService {
    constructor(@InjectDataSource() private readonly dataSource: DataSource) { }

    // 🧾 ایجاد فاکتور از سفارش
    async createFromOrder(manager: EntityManager, orderId: number, user: User) {
        const order = await manager.findOne(Order, {
            where: { id: orderId, user: { id: user.id } },
        });
        if (!order) throw new NotFoundException("سفارش یافت نشد.");

        const status =
            order.status === OrderStatus.DELIVERED
                ? InvoiceStatus.PAID
                : InvoiceStatus.PENDING;

        const invoice = manager.create(Invoice, {
            order,
            user,
            subtotal: order.subtotal,
            discountTotal: order.discountTotal,
            total: order.total,
            totalPayable: order.total,
            status,
        });

        const invoiceSave = await manager.save(Invoice, invoice);
        const returnedInvoice = await manager.findOne(Invoice, {
            where: { id: invoiceSave.id },
            relations: ["order"],
        });
        return returnedInvoice;
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
