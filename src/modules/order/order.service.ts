import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";

import { Order, OrderStatus } from "./entities/order.entity";
import { OrderItem } from "./entities/order-item.entity";
import { Card, CardStatus } from "../card/entities/card.entity";
import { CardItem } from "../card/entities/card-item.entity";
import { User } from "../user/entities/user.entity";
import { runInTransaction } from "src/common/helpers/transaction.helper";
import { CreateOrderFromCardDto } from "./dto/create-from-card.dto";
import { CouponService } from "../coupon/coupon.service";
import { paginate, PaginateQuery } from "nestjs-paginate";

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
            sortableColumns: ['id'],
            relations: ['user', 'user.addresses', 'items'],
            filterableColumns: {},
            defaultSortBy: [['id', 'DESC']],
            searchableColumns: ['user.id'],
            // select: [
            //     'id',
            //     'status',
            //     'updatedAt',
            //     'user',
            //     'user.phone',
            //     'user.(firstName',
            //     'user.lastName)',
            //     'user.addresses.province',
            //     'user.addresses.city',
            //     'items.product',
            //     'items.product.name',
            // ]
        });
        return {
            message: 'محصولات با موفقیت دریافت شد.',
            data: {
                items: orders.data,
                meta: orders.meta,
                links: orders.links,
            }
        };
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
