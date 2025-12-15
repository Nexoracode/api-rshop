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
            items.map(item => {
                if (item.product && item.product.preparationDays > pr) {
                    pr = item.product.preparationDays;
                }
            });
            return pr;
        }

        // 💰 محاسبه breakdown تخفیف‌ها
        const discountBreakdown = this.calculateDiscountBreakdown(order);

        return {
            id: order.id,
            status: order.status,

            // 💵 مبالغ اصلی
            subtotal: Number(order.subtotal),
            discountTotal: Number(order.discountTotal),
            total: Number(order.total),
            shippingCost: Number(order.shippingCost),
            giftWrappingCost: Number(order.giftWrappingCost),

            // 💰 تفکیک کامل تخفیف‌ها
            discountBreakdown,

            // 🎫 پرومو��ن‌ها
            promotionCode: order.promotionCode || null,
            promotions: order.promotionDetails || null,

            // 🎁 هدیه
            isGift: order.isGift,
            giftWrapping: order.isGift ? {
                id: order.giftWrappingId,
                name: order.giftWrapping!.name,
                image: order.giftWrapping!.image,
                price: order.giftWrapping!.price,
                description: order.giftWrapping!.description,
            } : null,
            giftMessage: order.giftMessage || null,

            // 🛠️ تخفیف دستی (Manual)
            isManual: order.isManual,
            manualDiscountType: order.manualDiscountType || null,
            manualDiscountValue: Number(order.manualDiscountValue),
            manualDiscountApplied: Number(order.manualDiscountApplied),

            // 📦 اطلاعات تحویل
            preparationDays: findMax(order.items || []),
            totalWeight: order.items?.reduce((sum, item) => {
                const weight = item.product?.weight || 0;
                return sum + weight * item.quantity;
            }, 0) || 0,

            // 📝 سایر
            paymentMethod: order.paymentGatewayRef || null,
            customerNote: order.note || null,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,

            // 👤 کاربر و آدرس
            user: {
                id: order.user.id,
                firstName: order.user.firstName,
                lastName: order.user.lastName,
                avatarUrl: order.user.avatarUrl,
                phone: order.user.phone,
                email: order.user.email || null,
            },
            address: order.address,

            // 🛒 آیتم‌ها
            items: order.items?.map((item) => this.mapItem(item)) || [],

            // 💳 پرداخت
            payment: payment || null,
        };
    }

    /**
     * 💰 محاسبه و تفکیک کامل تخفیف‌ها
     */
    private static calculateDiscountBreakdown(order: Order) {
        const breakdown = {
            // 🏷️ تخفیف محصولات (Product/Variant Discounts)
            productDiscounts: {
                total: 0,
            },

            // 🎫 تخفیف پروموشن‌ها
            promotionDiscounts: {
                total: Number(order.promotionDiscountAmount) || 0,
            },

            // 🛠️ تخفیف دستی (Manual by Admin)
            manualDiscount: {
                total: Number(order.manualDiscountApplied) || 0,
                type: order.manualDiscountType || null,
                value: Number(order.manualDiscountValue) || 0,
            },

            // 📊 خلاصه
            summary: {
                totalProductDiscounts: 0,
                totalPromotionDiscounts: Number(order.promotionDiscountAmount) || 0,
                totalManualDiscount: Number(order.manualDiscountApplied) || 0,
                grandTotalDiscount: Number(order.discountTotal),
            }
        };

        // محاسبه تخفیف محصولات از OrderItems
        if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
                const itemDiscount = Number(item.discount) || 0;

                if (itemDiscount > 0) {
                    const totalItemDiscount = itemDiscount * item.quantity;

                    // تشخیص منبع تخفیف
                    let source: 'product' | 'variant' | 'category' = 'product';

                    // اگر variant داره و variant تخفیف داره
                    if (item.variant) {
                        source = 'variant';
                    } else if (item.product?.category) {
                        // بررسی اینکه آیا تخفیف از دسته‌بندی اومده
                        // اگر محصول خودش تخفیف نداشت ولی discount داره، احتمالاً از دسته‌بندی اومده
                        const productHasDiscount =
                            (Number(item.product.discountPercent) > 0) ||
                            (Number(item.product.discountAmount) > 0);

                        if (!productHasDiscount) {
                            source = 'category';
                        }
                    }
                    breakdown.productDiscounts.total += totalItemDiscount;
                }
            });
        }

        // بروزرسانی خلاصه
        breakdown.summary.totalProductDiscounts = breakdown.productDiscounts.total;

        return breakdown;
    }

    // 🔹 آیتم‌های سفارش با جزئیات تخفیف
    private static mapItem(item: OrderItem) {
        const variantAttributes =
            item.variant?.attributes?.map((attr) => ({
                name: attr.attribute?.name,
                value: attr.value?.value,
                displayColor: attr.value?.displayColor || null,
            })) || [];

        // تشخیص منبع تخفیف برای هر آیتم
        const discountSource = this.detectDiscountSource(item);

        return {
            id: item.id,
            quantity: item.quantity,
            discount: Number(item.discount),
            lineTotal: Number(item.lineTotal),

            product: {
                id: item.product.id,
                name: item.product.name,
                image: item.product.mediaPinned?.url || null,
                price: Number(item.product.price),
                productDiscount: {
                    percent: Number(item.product.discountPercent) || 0,
                    amount: Number(item.product.discountAmount) || 0,
                }
            },

            variant: item.variant
                ? {
                    id: item.variant.id,
                    sku: item.variant.sku,
                    price: Number(item.variant.price),
                    variantDiscount: {
                        percent: Number(item.variant.discountPercent) || 0,
                        amount: Number(item.variant.discountAmount) || 0,
                    },
                    attributes: variantAttributes,
                }
                : null,
        };
    }

    /**
     * تشخیص منبع تخفیف یک آیتم
     */
    private static detectDiscountSource(item: OrderItem): 'none' | 'product' | 'variant' | 'category' {
        const itemDiscount = Number(item.discount) || 0;

        if (itemDiscount === 0) {
            return 'none';
        }

        // اگر variant داره
        if (item.variant) {
            return 'variant';
        }

        // بررسی تخفیف محصول
        const productHasDiscount =
            (Number(item.product?.discountPercent) > 0) ||
            (Number(item.product?.discountAmount) > 0);

        if (productHasDiscount) {
            return 'product';
        }

        // اگر هیچ‌کدام نبود، احتمالاً از دسته‌بندی اومده
        return 'category';
    }
}
