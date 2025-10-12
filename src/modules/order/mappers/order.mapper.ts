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
                addresses: order.user.addresses.length
                    ? order.user.addresses.map(address => ({
                        province: address.province ?? '',
                        city: address.city ?? ''
                    }))
                    : [],
            }
        }
    }
}