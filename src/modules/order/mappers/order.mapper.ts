import { Payment } from "src/modules/payment/entities/payment.entity";
import { OrderItem } from "../entities/order-item.entity";
import { Order } from "../entities/order.entity";
import { iAllOrderResponse } from "../interfaces/order.interface";
import { Product } from "src/modules/product/entities/product.entity";

export class OrderMapper {
    static toAllResponse(order: Order): iAllOrderResponse {
        return {
            id: order.id,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            status: order.status,
            total: order.total,
            user: {
                id: order.user.id,
                firstName: order.user.firstName,
                lastName: order.user.lastName,
                avatarUrl: order.user.avatarUrl,
                phone: order.user.phone,
                email: order.user.email || null,
            },
            address: order.address,
            items: order.items.length ? order.items.map((item) => ({
                id: item.id,
                order: item.order,
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    price: item.product.price,
                    image: item.product.mediaPinned.url,
                }
            })) : null,
        }
    }
}


export class OrderMapperNew {
    // 🔹 سطح خلاصه (برای لیست سفارش‌ها)
    static toSummary(order: Order) {
        return {
            id: order.id,
            status: order.status,
            total: Number(order.subtotal),
            discount: Number(order.discountTotal),
            createdAt: order.createdAt,
            itemCount: order.items?.length || 0,
            firstItem: order.items?.[0]
                ? {
                    productId: order.items[0].productId,
                    productName: order.items[0].product?.name,
                    image: order.items[0].product?.mediaPinned?.url,
                }
                : null,
        };
    }

    // 🔹 سطح جزئیات (برای مشاهده یک سفارش)
    static toDetail(order: Order, payment?: Payment | null) {
        const findMax = (items: any[]) => {
            var pr = 0;
            items.forEach(item => {
                if (item.product && item.product.preparationDays > pr) {
                    pr = item.product.preparationDays;
                }
            });
            return pr;
        }
        return {
            id: order.id,
            status: order.status,
            subtotal: Number(order.subtotal),
            discountTotal: Number(order.discountTotal),
            total: Number(order.total),
            paymentMethod: order.paymentGatewayRef || null,
            shippingCost: Number(order.shippingCost),
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            customerNote: order.note || null,
            promotionsDiscount: Number(order.promotionDiscountAmount),
            promotionCode: order.promotionCode || null,
            promotions: order.promotionDetails || null,
            isGift: order.isGift,
            giftWrapping: order.isGift ? {
                id: order.giftWrapping!.id,
                name: order.giftWrapping!.name,
                image: order.giftWrapping!.image,
                price: order.giftWrapping!.price,
                description: order.giftWrapping!.description,
            } : null,
            giftMessage: order.giftMessage || null,
            giftWrappingCost: Number(order.giftWrappingCost),
            isManual: order.isManual,
            manualDiscountType: order.manualDiscountType || null,
            manualDiscountValue: Number(order.manualDiscountValue),
            manualDiscountApplied: Number(order.manualDiscountApplied),
            preparationDays: findMax(order.items),
            totalWeight: order.items?.reduce((sum, item) => {
                const weight = item.product?.weight || 0;
                return sum + weight * item.quantity;
            }, 0) || 0,
            items: order.items?.map((item) => this.mapItem(item)) || [],
            user: {
                id: order.user.id,
                firstName: order.user.firstName,
                lastName: order.user.lastName,
                avatarUrl: order.user.avatarUrl,
                phone: order.user.phone,
                email: order.user.email || null,
            },
            address: order.address,
            payment: payment || null,
        };
    }

    // 🔹 آیتم‌های سفارش
    private static mapItem(item: OrderItem) {
        const variantAttributes =
            item.variant?.attributes?.map((attr) => ({
                name: attr.attribute?.name,
                value: attr.value?.value,
                displayColor: attr.value?.displayColor || null,
            })) || [];

        return {
            id: item.id,
            quantity: item.quantity,
            discount: item.discount,
            unitPrice: Number(item.unitPrice),
            lineTotal: Number(item.lineTotal),
            product: {
                id: item.product.id,
                name: item.product.name,
                image: item.product.mediaPinned?.url || null,
            },
            variant: item.variant
                ? {
                    id: item.variant.id,
                    sku: item.variant.sku,
                    price: Number(item.variant.price),
                    attributes: variantAttributes,
                }
                : null,
        };
    }
}
