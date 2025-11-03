import { Order } from 'src/modules/order/entities/order.entity';
import { Payment } from '../entities/payment.entity';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentGateway } from '../enums/payment-status.enum';
import { User } from 'src/modules/user/entities/user.entity';
import { buildPriceObject } from 'src/common/helpers/price.helper';

export class PaymentMapper {
    /**
     * ✅ خروجی کلی برای نمایش در پاسخ API
     */
    static toResponse(payment: Payment, order: Order, user: User) {
        if (!payment || !order || !user) return null;

        return {
            user: PaymentMapper.mapUser(user),
            order: PaymentMapper.mapOrder(order),
            payment: PaymentMapper.mapPayment(payment),
        };
    }

    /**
     * 🧑‍💼 اطلاعات کاربر
     */
    private static mapUser(user: User) {
        return {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            phone: user.phone,
            email: user.email,
        };
    }

    /**
     * 📦 اطلاعات سفارش
     */
    private static mapOrder(order: Order) {
        const priceData = buildPriceObject({
            price: order.subtotal,
            discountAmount: order.discountTotal,
            discountPercent: 0,
        });

        return {
            id: order.id,
            status: order.status,
            subtotal: Number(order.subtotal),
            discountTotal: Number(order.discountTotal),
            total: Number(order.total),
            finalPrice: priceData.finalPrice,
            createdAt: order.createdAt,
            items: (order.items || []).map((item) => ({
                id: item.id,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                lineTotal: Number(item.lineTotal),
                product: item.product
                    ? {
                        id: item.product.id,
                        name: item.product.name,
                        image: item.product.mediaPinned?.url || null,
                    }
                    : null,
                variant: item.variant
                    ? {
                        id: item.variant.id,
                        sku: item.variant.sku,
                        attributes: item.variant.attributes?.map((a) => ({
                            name: a.attribute.name,
                            value: a.value.value,
                            displayColor: a.value.displayColor || null,
                        })),
                    }
                    : null,
            })),
        };
    }

    /**
     * 💳 اطلاعات پرداخت
     */
    private static mapPayment(payment: Payment) {
        return {
            id: payment.id,
            refId: payment.refId ?? null,
            amount: Number(payment.amount),
            status: payment.status as PaymentStatus,
            message: payment.message,
            gateway: payment.gateway as PaymentGateway,
            authority: payment.authority,
            paidAt: payment.createdAt,
        };
    }
}
