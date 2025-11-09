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
import { OrderMapper, OrderMapperNew } from "./mappers/order.mapper";
import { CreateManualOrderDto } from "./dto/create-order.dto";
import { Product } from "../product/entities/product.entity";
import { RequestUser } from "src/common/interfaces/request-user.interface";
import { Address } from "../address/entities/address.entity";
import { Payment } from "../payment/entities/payment.entity";

const relations = [
    "user",
    "address",
    "user.addresses",
    "items",
    "items.product",
    "items.product.mediaPinned",
    "items.variant",
    "items.variant.attributes",
    "items.variant.attributes.attribute",
    "items.variant.attributes.value",
];

@Injectable()
export class OrderService {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,
        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,
        private readonly couponService: CouponService
    ) { }

    // 🧾 دریافت تمام سفارش‌ها (ادمین)
    async getAllOrders(query: PaginateQuery) {
        const orders = await paginate(query, this.orderRepo, {
            sortableColumns: ["id", "createdAt", "total"],
            relations: ["user", "address", "items", "items.product"],
            defaultSortBy: [["id", "DESC"]],
            searchableColumns: [
                "id",
                "user.id",
                "user.firstName",
                "user.lastName",
                "items.product.name",
            ],
            filterableColumns: {
                status: [FilterOperator.EQ],
                "user.addresses.city": [FilterOperator.EQ],
                createdAt: [FilterOperator.GTE, FilterOperator.LTE],
            },
        });
        return {
            message: "محصولات با موفقیت دریافت شد.",
            data: {
                items: orders.data.map((order) => OrderMapper.toAllResponse(order)),
                meta: orders.meta,
                links: orders.links,
            },
        };
    }

    async createManualOrder(dto: CreateManualOrderDto) {
        return await runInTransaction(this.dataSource, async (manager) => {
            const user = await manager.findOne(User, { where: { id: dto.userId } });
            if (!user) throw new NotFoundException("کاربر یافت نشد.");

            const address = await manager.findOne(Address, {
                where: { id: dto.addressId, user: { id: user.id } },
            });
            if (!address) throw new NotFoundException("آدرس انتخابی یافت نشد.");

            let subtotal = 0;
            let discountTotal = 0;
            const orderItems: OrderItem[] = [];

            for (const productItem of dto.items) {
                const product = await manager.findOne(Product, {
                    where: { id: productItem.productId },
                    relations: ["variants"],
                });
                if (!product)
                    throw new NotFoundException(`محصول ${productItem.productId} یافت نشد.`);

                const basePrice = Number(product.price) || 0;
                const discountPercent = Number(product.discountPercent) || 0;
                const discountAmount = Number(product.discountAmount) || 0;

                if (!productItem.variantIds || productItem.variantIds.length === 0) {
                    const unitPrice = basePrice;
                    let discount = 0;
                    if (discountPercent && discountPercent > 0)
                        discount = (unitPrice * discountPercent) / 100;
                    else if (discountAmount && discountAmount > 0)
                        discount = discountAmount;

                    const finalUnitPrice = unitPrice - discount;
                    const lineTotal = finalUnitPrice * 1;

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
                        })
                    );
                } else {
                    for (const variantObj of productItem.variantIds) {
                        const variant = product.variants.find((v) => v.id === variantObj.id);
                        if (!variant)
                            throw new BadRequestException(`واریانت ${variantObj.id} یافت نشد.`);

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
                            })
                        );
                    }
                }
            }

            const total = subtotal - discountTotal;

            const order = manager.create(Order, {
                user,
                address: address || null,
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
            if (!user) throw new NotFoundException("کاربر یافت نشد");

            const address = await manager.findOne(Address, {
                where: { id: dto.addressId, user: { id: user.id } },
            });
            if (!address) throw new NotFoundException("آدرس انتخابی معتبر نیست.");

            const card = await cardRepo.findOne({
                where: { user: { id: user.id }, status: CardStatus.OPEN },
                relations: ["items", "items.product", "items.variant"],
                lock: { mode: "pessimistic_write" },
            });
            if (!card || !card.items?.length)
                throw new BadRequestException("سبد خرید خالی است.");

            // ✅ بررسی سفارش باز قبلی (پرداخت نشده)
            let existingOrder = await orderRepo.findOne({
                where: {
                    user: { id: user.id },
                    status: In([
                        OrderStatus.AWAITING_PAYMENT,
                        OrderStatus.PAYMENT_FAILED,
                        OrderStatus.PAYMENT_CONFIRMATION_PENDING,
                    ]),
                },
                relations: ['user', 'address', "items"],
            });

            let couponCode: string | undefined;
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
                    throw new BadRequestException(err.message || "کد تخفیف معتبر نیست.");
                }
            }

            // 🧩 اگر سفارش باز وجود داشت → آپدیتش کن
            if (existingOrder) {
                existingOrder.subtotal = card.subtotal;
                existingOrder.discountTotal = card.discountTotal;
                existingOrder.total = totalPayable;
                existingOrder.couponCode = couponCode;
                existingOrder.couponDiscountAmount = couponDiscountAmount;
                existingOrder.note = dto.note;
                existingOrder.address = address;

                // حذف آیتم‌های قبلی و جایگزینی با آیتم‌های فعلی کارت
                await orderItemRepo.delete({ order: { id: existingOrder.id } });
                for (const ci of card.items) {
                    const item = orderItemRepo.create({
                        order: existingOrder,
                        product: ci.product,
                        variant: ci.variant || null,
                        quantity: ci.quantity,
                        unitPrice: ci.unitPrice,
                        discount: ci.discount,
                        lineTotal: ci.lineTotal,
                    });
                    await orderItemRepo.save(item);
                }

                return OrderMapperNew.toDetail(existingOrder);
            }

            // 🆕 اگر سفارش باز وجود نداشت → سفارش جدید بساز
            const newOrder = orderRepo.create({
                user,
                address,
                status: OrderStatus.AWAITING_PAYMENT,
                subtotal: card.subtotal,
                discountTotal: card.discountTotal,
                note: dto.note,
                total: totalPayable,
                couponCode,
                couponDiscountAmount,
            });

            await orderRepo.save(newOrder);

            for (const ci of card.items) {
                const item = orderItemRepo.create({
                    order: newOrder,
                    product: ci.product,
                    variant: ci.variant || null,
                    quantity: ci.quantity,
                    unitPrice: ci.unitPrice,
                    discount: ci.discount,
                    lineTotal: ci.lineTotal,
                });
                await orderItemRepo.save(item);
            }

            return OrderMapperNew.toDetail(newOrder);
        });
    }


    // 🧍 سفارش‌های کاربر
    async findAllByUser(userId: number) {
        const orders = await this.dataSource.getRepository(Order).find({
            where: { user: { id: userId } },
            relations,
            order: { createdAt: "DESC" },
        });
        return orders.map((order) => OrderMapperNew.toDetail(order));
    }

    // 🔍 جزئیات سفارش خاص
    async findOneById(id: number) {
        const order = await this.orderRepo.findOne({
            where: { id },
            relations,
        });
        if (!order) throw new NotFoundException("سفارش یافت نشد.");
        const payment = await this.paymentRepo.findOne({
            where: { order: { id: order.id } }
        })
        if (!payment) throw new NotFoundException("اطلاعات پرداخت یافت نشد.");
        return OrderMapperNew.toDetail(order, payment);
    }

    // 📦 جزئیات سفارش
    async findOneByUser(user: RequestUser, id: number) {
        const order = await this.orderRepo.findOne({
            where: { id, user: { id: user.id } },
            relations,
        });
        if (!order) throw new NotFoundException("سفارش یافت نشد");
        const payment = await this.paymentRepo.findOne({
            where: { order: { id: order.id } }
        })
        if (!payment) throw new NotFoundException("اطلاعات پرداخت یافت نشد.");
        return OrderMapperNew.toDetail(order, payment);
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
