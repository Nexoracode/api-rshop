import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { Order } from "./entities/order.entity";
import { OrderItem } from "./entities/order-item.entity";
import { Card, CardStatus } from "../card/entities/card.entity";
import { CardItem } from "../card/entities/card-item.entity";
import { User } from "../user/entities/user.entity";
import { runInTransaction } from "src/common/helpers/transaction.helper";
import { CreateOrderFromCardDto } from "./dto/create-from-card.dto";
import { CouponService } from "../coupon/coupon.service";
import { FilterOperator, paginate, PaginateQuery } from "nestjs-paginate";
import { OrderStatus } from "./enums/order-status.enum";
import { OrderMapper } from "./mappers/order.mapper";
import { CreateManualOrderDto } from "./dto/create-order.dto";
import { Product } from "../product/entities/product.entity";
import { VariantProduct } from "../variant-product/entities/variant-product.entity";

@Injectable()
export class OrderService {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,
        private readonly couponService: CouponService
    ) { }

    // 🧾 دریافت تمام سفارش‌ها (ادمین)
    async getAllOrders(query: PaginateQuery) {
        const orders = await paginate(query, this.orderRepo, {
            sortableColumns: ['id', 'createdAt', 'total'],
            relations: ['user', 'user.addresses', 'items', 'items.product'],
            defaultSortBy: [['id', 'DESC']],
            searchableColumns: ['id', 'user.id', 'user.firstName', 'user.lastName', 'items.product.name'],
            filterableColumns: {
                status: [FilterOperator.EQ],
                'user.addresses.city': [FilterOperator.EQ],
                createdAt: [FilterOperator.GTE, FilterOperator.LTE]
            },
        });
        return {
            message: 'محصولات با موفقیت دریافت شد.',
            data: {
                items: orders.data.map((order) => OrderMapper.toAllResponse(order)),
                meta: orders.meta,
                links: orders.links,
            }
        };
    }

    async createManualOrder(dto: CreateManualOrderDto) {
        return await runInTransaction(this.dataSource, async (manager) => {
            const user = await manager.findOne(User, { where: { id: dto.userId } });
            if (!user) throw new NotFoundException("کاربر یافت نشد.");

            let subtotal = 0;
            let discountTotal = 0;
            const orderItems: OrderItem[] = [];

            for (const productItem of dto.items) {
                const product = await manager.findOne(Product, {
                    where: { id: productItem.productId },
                    relations: ["variants"],
                });
                if (!product) throw new NotFoundException(`محصول ${productItem.productId} یافت نشد.`);

                const basePrice = Number(product.price) || 0;
                const discountPercent = Number(product.discountPercent) || 0;
                const discountAmount = Number(product.discountAmount) || 0;

                // 🧩 حالت ۱: محصول بدون واریانت
                if (!productItem.variantIds || productItem.variantIds.length === 0) {
                    const unitPrice = basePrice;

                    // تخفیف از محصول
                    let discount = 0;
                    if (discountPercent && discountPercent > 0)
                        discount = (unitPrice * discountPercent) / 100;
                    else if (discountAmount && discountAmount > 0)
                        discount = discountAmount;

                    const finalUnitPrice = unitPrice - discount;
                    const lineTotal = finalUnitPrice * 1; // مقدار quantity پیش‌فرض ۱ اگر فرانت نده

                    subtotal += unitPrice;
                    discountTotal += discount;

                    orderItems.push(
                        manager.create(OrderItem, {
                            quantity: 1,
                            unitPrice,
                            discount,
                            lineTotal,
                            productId: product.id,
                            variant: null,
                        }),
                    );
                } else {
                    // 🧩 حالت ۲: محصول با واریانت‌ها
                    for (const variantObj of productItem.variantIds) {
                        const variant = product.variants.find(v => v.id === variantObj.id);
                        if (!variant) throw new BadRequestException(`واریانت ${variantObj.id} یافت نشد.`);

                        const unitPrice = variant.price ?? product.price;

                        let discount = 0;
                        if (product.discountPercent && product.discountPercent > 0)
                            discount = (unitPrice * product.discountPercent) / 100;
                        else if (product.discountAmount && product.discountAmount > 0)
                            discount = product.discountAmount;

                        const finalUnitPrice = unitPrice - discount;
                        const lineTotal = finalUnitPrice * variantObj.quantity;

                        subtotal += unitPrice * variantObj.quantity;
                        discountTotal += discount * variantObj.quantity;

                        orderItems.push(
                            manager.create(OrderItem, {
                                quantity: variantObj.quantity,
                                unitPrice,
                                discount,
                                lineTotal,
                                productId: product.id,
                                variantId: variant.id,
                            }),
                        );
                    }
                }
            }

            const total = subtotal - discountTotal;

            const order = manager.create(Order, {
                user,
                status: dto.status,
                subtotal,
                discountTotal,
                total,
                isManual: true,
                items: orderItems,
            });

            await manager.save(order);
            return order;
        });
    }



    // 🛒 ساخت سفارش از سبد خرید
    async createFromCard(userReq: User, dto: CreateOrderFromCardDto) {
        return runInTransaction(this.dataSource, async (manager) => {
            const cardRepo = manager.getRepository(Card);
            const cardItemRepo = manager.getRepository(CardItem);
            const orderRepo = manager.getRepository(Order);
            const orderItemRepo = manager.getRepository(OrderItem);

            const user = await manager.findOne(User, { where: { id: userReq.id } });
            if (!user) throw new NotFoundException('کاربر یافت نشد');

            // 1️⃣ پیدا کردن سبد خرید کاربر
            const card = await cardRepo.findOne({
                where: { user: { id: user.id }, status: CardStatus.OPEN },
                relations: ["items", "items.product", "items.variant"],
                lock: { mode: "pessimistic_write" },
            });
            console.log(card);
            if (!card || !card.items?.length)
                throw new BadRequestException("سبد خرید خالی است.");

            // 3️⃣ محاسبه مبلغ نهایی و بررسی کوپن (اختیاری)
            let couponCode: string | undefined = undefined;
            let couponDiscountAmount = 0;
            let totalPayable = card.total;

            if (dto.couponCode) {
                try {
                    const applyResult = await this.couponService.apply({
                        code: dto.couponCode,
                        userId: user.id,
                        totalAmount: card.total,
                    });

                    couponCode = applyResult.couponCode;
                    couponDiscountAmount = applyResult.discount;
                    totalPayable = applyResult.payable;
                } catch (err) {
                    throw new BadRequestException(
                        err.message || "کد تخفیف معتبر نیست."
                    );
                }
            }

            // 4️⃣ ایجاد سفارش جدید
            const order = orderRepo.create({
                user: user,
                status: OrderStatus.AWAITING_PAYMENT,
                subtotal: card.subtotal,
                discountTotal: card.discountTotal,
                note: dto.note,
                total: totalPayable,
                couponCode: couponCode,
                couponDiscountAmount: couponDiscountAmount,
            });

            await orderRepo.save(order);

            // 5️⃣ انتقال آیتم‌ها از card → orderItem
            for (const ci of card.items) {
                const orderItem = orderItemRepo.create({
                    order,
                    product: ci.product,
                    variant: ci.variant || null,
                    quantity: ci.quantity,
                    unitPrice: ci.unitPrice,
                    discount: ci.discount,
                    lineTotal: ci.lineTotal,
                });
                await orderItemRepo.save(orderItem);
            }

            // ⚠️ ❌ در اینجا دیگر cart را خالی نکن
            // فقط LOCK می‌ماند تا وضعیت پرداخت مشخص شود

            return order;
        });
    }


    // 🧍 سفارش‌های کاربر
    async getUserOrders(user: User) {
        return this.dataSource.getRepository(Order).find({
            where: { user: { id: user.id } },
            order: { createdAt: "DESC" },
        });
    }

    // 🔍 جزئیات سفارش خاص
    async getOrderById(id: number) {
        const order = await this.dataSource.getRepository(Order).findOne({
            where: { id },
            relations: ["user", 'items', 'items.variant'],
        });
        if (!order) throw new NotFoundException("سفارش یافت نشد.");
        return order;
    }

    // 💳 تغییر وضعیت سفارش (ادمین)
    async updateStatus(id: number, status: OrderStatus) {
        return runInTransaction(this.dataSource, async (manager) => {
            const order = await manager.findOne(Order, { where: { id } });
            if (!order) throw new NotFoundException("سفارش یافت نشد.");
            order.status = status;
            return manager.save(order);
        });
    }

    // 🗑 حذف سفارش (ادمین)
    async remove(id: number) {
        return runInTransaction(this.dataSource, async (manager) => {
            const order = await manager.findOne(Order, { where: { id } });
            if (!order) throw new NotFoundException("سفارش یافت نشد.");
            await manager.remove(Order, order);
            return { success: true };
        });
    }
}
