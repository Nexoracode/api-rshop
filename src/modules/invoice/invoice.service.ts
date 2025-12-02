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

    /**
     * ایجاد فاکتور از سفارش
     * این متد اطلاعات کامل سفارش شامل تخفیف‌های Promotion و Gift Wrapping را در Invoice ذخیره می‌کند
     */
    async createFromOrder(manager: EntityManager, orderId: number, user: User) {
        const order = await manager.findOne(Order, {
            where: { id: orderId, user: { id: user.id } },
            relations: ['giftWrapping'],
        });
        if (!order) throw new NotFoundException("سفارش یافت نشد.");

        const status =
            order.status === OrderStatus.DELIVERED
                ? InvoiceStatus.PAID
                : InvoiceStatus.PENDING;

        const totalPayable = order.total;

        const invoice = manager.create(Invoice, {
            orderId: order.id,
            userId: user.id,
            subtotal: Number(order.subtotal),
            discountTotal: Number(order.discountTotal),
            total: Number(order.total),
            totalPayable: Number(totalPayable),
            status,

            // اطلاعات Promotion
            promotionCode: order.promotionCode || undefined,
            promotionDiscountAmount: Number(order.promotionDiscountAmount || 0),
            promotionDetails: order.promotionDetails || undefined,

            // اطلاعات حمل و نقل
            shippingCost: Number(order.shippingCost || 0),

            // 🎁 اطلاعات Gift Wrapping
            isGift: order.isGift || false,
            giftWrappingId: order.giftWrappingId || undefined,
            giftWrappingCost: Number(order.giftWrappingCost || 0),
            giftMessage: order.giftMessage || undefined,
        });

        const invoiceSave = await manager.save(Invoice, invoice);
        const returnedInvoice = await manager.findOne(Invoice, {
            where: { id: invoiceSave.id },
            relations: ["order", "order.items", "order.items.product", "order.address", "giftWrapping", "giftWrapping.image"],
        });
        return returnedInvoice;
    }

    /**
     * مشاهده فاکتورهای کاربر
     */
    async getUserInvoices(user: User) {
        return this.dataSource.getRepository(Invoice).find({
            where: { user: { id: user.id } },
            order: { createdAt: "DESC" },
            relations: ["order", "order.address", "giftWrapping"],
        });
    }

    /**
     * جزئیات فاکتور
     */
    async getInvoice(user: User, id: number) {
        const invoice = await this.dataSource.getRepository(Invoice).findOne({
            where: { id, user: { id: user.id } },
            relations: [
                "order",
                "order.items",
                "order.items.product",
                "order.items.product.mediaPinned",
                "order.items.variant",
                "order.address",
                "giftWrapping",
                "giftWrapping.image"
            ],
        });
        if (!invoice) throw new NotFoundException("فاکتور یافت نشد.");
        return invoice;
    }

    /**
     * دریافت تمام فاکتورها (ادمین)
     */
    async getAllInvoices() {
        return this.dataSource.getRepository(Invoice).find({
            order: { createdAt: "DESC" },
            relations: ["order", "user", "order.address", "giftWrapping"],
        });
    }

    /**
     * بروزرسانی وضعیت فاکتور بعد از پرداخت
     */
    async updateInvoiceStatus(
        manager: EntityManager,
        orderId: number,
        status: InvoiceStatus,
        paymentErrorMessage?: string,
        paymentErrorCode?: string
    ): Promise<Invoice | null> {
        const invoice = await manager.findOne(Invoice, {
            where: { order: { id: orderId } },
        });

        if (!invoice) {
            return null;
        }

        invoice.status = status;

        if (paymentErrorMessage) {
            invoice.paymentErrorMessage = paymentErrorMessage;
        }

        if (paymentErrorCode) {
            invoice.paymentErrorCode = paymentErrorCode;
        }

        return await manager.save(Invoice, invoice);
    }
}
