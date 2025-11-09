import { deflate } from "zlib";
import { OrderItem } from "../entities/order-item.entity";

// 🔹 آیتم‌های سفارش
export default function mapItem(item: OrderItem) {
    const variantAttributes =
        item.variant?.attributes?.map((attr: any) => ({
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
