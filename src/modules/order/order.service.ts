import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";

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

            for (const item of dto.items) {
                // 🧱 دریافت محصول و واریانت (در صورت وجود)
                const product = await manager.findOne(Product, {
                    where: { id: item.productId },
                    relations: ["variants"],
                });
                if (!product) throw new NotFoundException(`محصول ${item.productId} یافت نشد.`);

                let unitPrice = product.price;
                let variant: VariantProduct | null = null;

                if (item.variantId) {
                    variant = product.variants.find(v => v.id === item.variantId) ?? null;
                    if (!variant) throw new BadRequestException(`واریانت ${item.variantId} یافت نشد.`);
                    unitPrice = variant.price ?? product.price;
                }

                // 🧮 محاسبه تخفیف
                let itemDiscount = 0;

                if (product.discountPercent && product.discountPercent > 0)
                    itemDiscount = (unitPrice * product.discountPercent) / 100;
                else if (product.discountAmount && product.discountAmount > 0)
                    itemDiscount = product.discountAmount;

                const finalUnitPrice = unitPrice - itemDiscount;
                const lineTotal = finalUnitPrice * item.quantity;

                subtotal += unitPrice * item.quantity;
                discountTotal += itemDiscount * item.quantity;

                // ایجاد OrderItem
                const orderItem = manager.create(OrderItem, {
                    product,
                    quantity: item.quantity,
                    unitPrice,
                    discount: itemDiscount,
                    lineTotal,
                    variantId: item.variantId ?? null,
                });
                orderItems.push(orderItem);
            }

            const total = subtotal - discountTotal;

            // 🧾 ذخیره سفارش
            const order = manager.create(Order, {
                user,
                status: dto.status,
                subtotal,
                discountTotal,
                total,
                isManual: true, // اضافه‌شده برای تشخیص نوع سفارش
                items: orderItems,
            });

            await manager.save(order);
            return order;
        });
    }




    // 🛒 ساخت سفارش از سبد خرید
    async createFromCard(user: User, dto: CreateOrderFromCardDto) {
        return runInTransaction(this.dataSource, async (manager) => {
            const cardRepo = manager.getRepository(Card);
            const cardItemRepo = manager.getRepository(CardItem);
            const orderRepo = manager.getRepository(Order);
            const orderItemRepo = manager.getRepository(OrderItem);

            // 1️⃣ پیدا کردن سبد خرید کاربر
            const card = await cardRepo.findOne({
                where: { user: { id: user.id } },
                relations: ["items", "items.product", "items.variant"],
                lock: { mode: "pessimistic_write" },
            });
            if (!card || !card.items?.length)
                throw new BadRequestException("سبد خرید خالی است.");
            if (card.status === CardStatus.ABANDONED)
                throw new BadRequestException("سبد خرید منقضی شده است.");

            // 2️⃣ قفل کردن سبد تا عملیات نهایی انجام شود
            card.status = CardStatus.LOCKED;
            await cardRepo.save(card);

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
                status: OrderStatus.PENDING,
                subtotal: card.subtotal,
                discountTotal: card.discountTotal,
                total: card.total,
                couponCode: couponCode,
                couponDiscountAmount: couponDiscountAmount,
            });

            order.total = totalPayable;
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

            // 6️⃣ پاکسازی سبد خرید
            await cardItemRepo.delete({ card: { id: card.id } as any });
            card.itemsCount = 0;
            card.totalQuantity = 0;
            card.subtotal = 0;
            card.discountTotal = 0;
            card.total = 0;
            card.status = CardStatus.ABANDONED;
            await cardRepo.save(card);

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
    async getOrderById(user: User, id: number) {
        const order = await this.dataSource.getRepository(Order).findOne({
            where: { id, user: { id: user.id } },
            relations: ["user"],
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
