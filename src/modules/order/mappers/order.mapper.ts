import { OrderItem } from "../entities/order-item.entity";
import { Order } from "../entities/order.entity";
import { iAllOrderResponse } from "../interfaces/order.interface";

export class OrderMapper {
    static toAllResponse(order: Order): iAllOrderResponse {
        return {
            id: order.id,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            status: order.status,
            total: order.total,
            items: order.items.length ? order.items.map((item) => ({
                id: item.id,
                order: item.order,
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    price: item.product.price,
                }
            })) : null,
            user: {
                id: order.user.id,
                firstName: order.user.firstName,
                lastName: order.user.lastName,
                avatarUrl: order.user.avatarUrl,
                phone: order.user.phone,
                email: order.user.email || null,
                addresses: order.user.addresses.length
                    ? order.user.addresses.map(address => ({
                        id: address.id,
                        province: address.province ?? '',
                        city: address.city ?? ''
                    }))
                    : [],
            }
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
    static toDetail(order: Order) {
        return {
            id: order.id,
            status: order.status,
            subtotal: Number(order.subtotal),
            discountTotal: Number(order.discountTotal),
            total: Number(order.total),
            paymentMethod: order.paymentGatewayRef || null,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            items: order.items?.map((item) => this.mapItem(item)) || [],
            user: {
                id: order.user.id,
                firstName: order.user.firstName,
                lastName: order.user.lastName,
                avatarUrl: order.user.avatarUrl,
                phone: order.user.phone,
                email: order.user.email || null,
                addresses: order.user.addresses.length
                    ? order.user.addresses.map(address => ({
                        id: address.id,
                        province: address.province ?? '',
                        city: address.city ?? ''
                    }))
                    : [],
            }
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
