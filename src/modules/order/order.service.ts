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
import { FilterOperator, paginate, PaginateQuery } from "nestjs-paginate";
import { OrderStatus } from "./enums/order-status.enum";
import { OrderMapper, OrderMapperNew } from "./mappers/order.mapper";
import { CreateManualOrderDto } from "./dto/create-order.dto";
import { Product } from "../product/entities/product.entity";
import { RequestUser } from "src/common/interfaces/request-user.interface";
import { Address } from "../address/entities/address.entity";
import { Payment } from "../payment/entities/payment.entity";
import { ManualDiscountType } from "src/common/enums/discount.enum";
import { CheckPromotionUseCase } from "../promotion/application/usecases/check-promotion.usecase";
import { VariantProduct } from "../variant-product/entities/variant-product.entity";
import { PromotionRepository } from "../promotion/domain/interfaces/promotion-repository.interface";
import { GiftWrapping } from "../gift-wrapping/entities/gift-wrapping.entity";
import { GiftWrappingStatus } from "../gift-wrapping/enums/gift-wrapping-status.enum";

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
    "giftWrapping",
    "giftWrapping.image",
];

@Injectable()
export class OrderService {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,
        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,
        private readonly promotionCheck: CheckPromotionUseCase,
        private readonly promotionRepo: PromotionRepository,
    ) { }

    /**
     * کم کردن موجودی محصولات/واریانت‌ها
     */
    private async decreaseStock(manager: any, items: OrderItem[]): Promise<void> {
        for (const item of items) {
            if (item.variant) {
                const variant = await manager.findOne(VariantProduct, {
                    where: { id: item.variant.id },
                });

                if (!variant) {
                    throw new BadRequestException(
                        `واریانت با شناسه ${item.variant.id} یافت نشد`
                    );
                }

                if (variant.stock < item.quantity) {
                    throw new BadRequestException(
                        `موجودی واریانت ${variant.sku} کافی نیست. موجودی فعلی: ${variant.stock}`
                    );
                }

                variant.stock -= item.quantity;
                await manager.save(VariantProduct, variant);
            } else if (item.product) {
                const product = await manager.findOne(Product, {
                    where: { id: item.product.id },
                });

                if (!product) {
                    throw new BadRequestException(
                        `محصول با شناسه ${item.product.id} یافت نشد`
                    );
                }

                if (product.stock < item.quantity) {
                    throw new BadRequestException(
                        `موجودی محصول "${product.name}" کافی نیست. موجودی فعلی: ${product.stock}`
                    );
                }

                product.stock -= item.quantity;
                await manager.save(Product, product);
            }
        }
    }

    /**
     * افزایش usage count پروموشن‌ها بعد از پرداخت موفق
     */
    private async incrementPromotionUsage(promotionIds: number[]): Promise<void> {
        for (const id of promotionIds) {
            await this.promotionRepo.incrementUsageCount(id);
        }
    }

    /**
     * اعتبارسنجی و محاسبه هزینه Gift Wrapping
     */
    private async validateAndCalculateGiftWrapping(
        manager: any,
        giftWrappingId?: number,
    ): Promise<{ giftWrapping: GiftWrapping | null; cost: number }> {
        if (!giftWrappingId) {
            return { giftWrapping: null, cost: 0 };
        }

        const giftWrapping = await manager.findOne(GiftWrapping, {
            where: { id: giftWrappingId },
        });

        if (!giftWrapping) {
            throw new NotFoundException(
                `بسته‌بندی با شناسه ${giftWrappingId} یافت نشد`
            );
        }

        if (giftWrapping.status !== GiftWrappingStatus.ACTIVE) {
            throw new BadRequestException(
                `بسته‌بندی "${giftWrapping.name}" غیرفعال است`
            );
        }

        return {
            giftWrapping,
            cost: Number(giftWrapping.price),
        };
    }

    // 🧾 دریافت تمام سفارش‌ها (ادمین)
    async getAllOrders(query: PaginateQuery) {
        const orders = await paginate(query, this.orderRepo, {
            sortableColumns: ["id", "createdAt", "total"],
            relations: ["user", "address", "items", "items.product", "items.product.mediaPinned", "giftWrapping"],
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
                isGift: [FilterOperator.EQ],
                "user.addresses.city": [FilterOperator.EQ],
                createdAt: [FilterOperator.GTE, FilterOperator.LTE],
            },
        });
        return {
            message: "سفارش‌ها با موفقیت دریافت شد.",
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

            let total = subtotal - discountTotal;
            let manualDiscountApplied = 0;

            if (dto.manualDiscountValue && dto.manualDiscountValue > 0) {
                if (dto.manualDiscountType === ManualDiscountType.PERCENT) {
                    manualDiscountApplied = (total * dto.manualDiscountValue) / 100;
                } else {
                    manualDiscountApplied = dto.manualDiscountValue;
                }

                total -= manualDiscountApplied;
                discountTotal += manualDiscountApplied;
            }

            const order = manager.create(Order, {
                user,
                address,
                status: dto.status,
                subtotal,
                discountTotal,
                total,
                isManual: true,
                items: orderItems,
                manualDiscountType: dto.manualDiscountType ?? undefined,
                manualDiscountValue: dto.manualDiscountValue ?? 0,
                manualDiscountApplied,
            });

            await manager.save(order);
            return order;
        });
    }

    // 🛒 ساخت سفارش از سبد خرید
    private async calculateShippingCost(user: User, address: Address, items: CardItem[]) {
        return 35000;
    }

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

            // بررسی موجودی
            for (const ci of card.items) {
                if (ci.variant) {
                    const variant = await manager.findOne(VariantProduct, {
                        where: { id: ci.variant.id },
                    });
                    if (!variant || variant.stock < ci.quantity) {
                        throw new BadRequestException(
                            `موجودی واریانت ${variant?.sku || ci.variant.id} کافی نیست`
                        );
                    }
                } else {
                    const product = await manager.findOne(Product, {
                        where: { id: ci.product.id },
                    });
                    if (!product || product.stock < ci.quantity) {
                        throw new BadRequestException(
                            `موجودی محصول "${product?.name || ci.product.id}" کافی نیست`
                        );
                    }
                }
            }

            // 🎁 اعتبارسنجی و محاسبه Gift Wrapping
            const { giftWrapping, cost: giftWrappingCost } =
                await this.validateAndCalculateGiftWrapping(manager, dto.giftWrappingId);

            const existingOrder = await orderRepo.findOne({
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

            const shippingCost = await this.calculateShippingCost(user, address, card.items);

            const previousOrders = await orderRepo.count({
                where: { user: { id: user.id } }
            });

            const isFirstOrder = previousOrders === 0;

            // چک پروموشن‌ها
            const promotionResult = await this.promotionCheck.execute({
                userId: user.id,
                code: dto.promotionCode,
                isFirstOrder,
                subtotal: card.subtotal,
                items: card.items.map(ci => ({
                    productId: ci.product.id,
                    variantId: ci.variant?.id,
                    categoryId: ci.product.categoryId,
                    quantity: ci.quantity,
                    unitPrice: ci.unitPrice,
                })),
            });

            const promotionDetails = promotionResult.appliedPromotions?.map(ap => ({
                promotionId: ap.promotion.id!,
                name: ap.promotion.name,
                type: ap.promotion.type,
                amount: ap.discountAmount,
            })) ?? [];

            const promotionDiscountAmount = promotionDetails.reduce((a, b) => a + b.amount, 0);
            const finalShippingCost = promotionResult.freeShipping ? 0 : shippingCost;
            const productDiscount = card.discountTotal;
            const discountTotal = productDiscount + promotionDiscountAmount;

            // 🎁 محاسبه مبلغ نهایی با Gift Wrapping
            const finalTotal = card.subtotal - discountTotal + finalShippingCost + giftWrappingCost;

            if (existingOrder) {
                existingOrder.subtotal = card.subtotal;
                existingOrder.discountTotal = discountTotal;
                existingOrder.total = finalTotal;
                existingOrder.promotionCode = dto.promotionCode ?? null;
                existingOrder.promotionDiscountAmount = promotionDiscountAmount;
                existingOrder.promotionDetails = promotionDetails;
                existingOrder.shippingCost = finalShippingCost;
                existingOrder.note = dto.note;
                existingOrder.address = address;

                // 🎁 Gift Wrapping
                existingOrder.isGift = dto.isGift ?? false;
                existingOrder.giftWrappingId = dto.giftWrappingId ?? null;
                existingOrder.giftWrappingCost = giftWrappingCost;
                existingOrder.giftMessage = dto.giftMessage ?? null;

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

            // سفارش جدید
            const newOrder = orderRepo.create({
                user,
                address,
                status: OrderStatus.AWAITING_PAYMENT,
                subtotal: card.subtotal,
                discountTotal,
                total: finalTotal,
                note: dto.note,
                promotionCode: dto.promotionCode ?? null,
                promotionDiscountAmount,
                promotionDetails,
                shippingCost: finalShippingCost,

                // 🎁 Gift Wrapping
                isGift: dto.isGift ?? false,
                giftWrappingId: dto.giftWrappingId ?? null,
                giftWrappingCost,
                giftMessage: dto.giftMessage ?? null,
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

    /**
     * تایید نهایی سفارش و کم کردن موجودی بعد از پرداخت موفق
     */
    async confirmOrderPayment(orderId: number): Promise<Order> {
        return runInTransaction(this.dataSource, async (manager) => {
            const order = await manager.findOne(Order, {
                where: { id: orderId },
                relations: ['items', 'items.product', 'items.variant'],
            });

            if (!order) {
                throw new NotFoundException('سفارش یافت نشد');
            }

            if (order.status !== OrderStatus.AWAITING_PAYMENT &&
                order.status !== OrderStatus.PAYMENT_CONFIRMATION_PENDING) {
                throw new BadRequestException('وضعیت سفارش برای تایید پرداخت مناسب نیست');
            }

            await this.decreaseStock(manager, order.items);

            if (order.promotionDetails && order.promotionDetails.length > 0) {
                const promotionIds = order.promotionDetails.map(p => p.promotionId);
                await this.incrementPromotionUsage(promotionIds);
            }

            order.status = OrderStatus.AWAITING_PAYMENT;
            await manager.save(Order, order);

            return order;
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
