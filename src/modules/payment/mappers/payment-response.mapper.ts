// هیچ تغییری در نام فیلدهای خروجی نداده‌ام؛ فقط آن‌ها را یک‌دست می‌کنم.

import { Order } from 'src/modules/order/entities/order.entity';
import { Payment } from '../entities/payment.entity';
import { OrderMapper } from 'src/modules/order/mappers/order.mapper';

export class PaymentResponseMapper {
    // createPayment -> بازگشت لینک درگاه
    static createPayment(order: Order, authority: string) {
        return {
            code: 100,
            success: true,
            message: 'کاربر به درگاه پرداخت منتقل می‌شود.',
            authority,
            paymentUrl: `${process.env.ZARINPAL_PAYMENT_URL}/${authority}`,
            amount: order.total,
            orderId: order.id,
            orderStatus: order.status,
        };
    }

    // verifyPayment -> پرداخت قبلاً تایید شده
    static alreadyVerified(verification: any | null) {
        return {
            code: 101,
            success: true,
            status: verification.status,
            message: 'این پرداخت قبلاً تایید شده است.',
            refId: verification.refId ?? undefined,
        };
    }

    // verifyPayment -> کاربر لغو کرده
    static userCancelled(orderStatus: string) {
        return {
            code: -50,
            success: false,
            message: 'پرداخت توسط کاربر لغو شد.',
            orderStatus,
        };
    }

    // verifyPayment -> موفق + اینوویس موفق
    static verifiedWithInvoice(order: Order, payment: Payment, refId: string | undefined, invoiceDate: Date) {
        return {
            code: 102,
            success: true,
            message: 'پرداخت با موفقیت انجام شد.',
            refId,
            invoiceDate,
            order: OrderMapper.toAllResponse(order),
            payment,
        };
    }

    // verifyPayment -> موفق ولی اینوویس صادر نشد
    static verifiedNoInvoice(order: Order, refId: string | undefined) {
        return {
            code: 103,
            success: true,
            message: 'پرداخت تایید شد اما فاکتور صادر نشد.',
            refId,
            order: OrderMapper.toAllResponse(order),
        };
    }

    // verifyPayment -> ناموفق (غیر از لغو کاربر)
    static failed(orderStatus: string) {
        return {
            code: -51,
            success: false,
            message: 'پرداخت ناموفق بود.',
            orderStatus,
        };
    }
}
