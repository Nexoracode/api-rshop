import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentLog } from './entities/payment-logs.entity';
import { Order } from '../order/entities/order.entity';
import { User } from '../user/entities/user.entity';
import { CardToCardStatus, PaymentMethod, PaymentStatus, PaymentLogStatus } from './enums/payment-status.enum';
import { InitiateCardToCardDto } from './dto/card-to-card/initiate-card-to-card.dto';
import { UploadReceiptDto } from './dto/card-to-card/upload-receipt.dto';
import { ReviewReceiptDto } from './dto/card-to-card/review-receipt.dto';
import { OrderStatus } from '../order/enums/order-status.enum';
import { InvoiceService } from '../invoice/invoice.service';
import { InvoiceStatus } from '../invoice/enums/invoice-status.enum';
import { runInTransaction } from 'src/common/helpers/transaction.helper';
import { Product } from '../product/entities/product.entity';
import { VariantProduct } from '../variant-product/entities/variant-product.entity';
import { Promotion } from '../promotion/domain/entities/promotion.entity';
import { CardStatusService } from '../card/card-status.service';

@Injectable()
export class CardToCardService {
    private readonly logger = new Logger(CardToCardService.name);

    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,
        @InjectRepository(PaymentLog)
        private readonly paymentLogRepo: Repository<PaymentLog>,
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,
        @InjectDataSource()
        private readonly dataSource: DataSource,
        private readonly invoiceService: InvoiceService,
        private readonly cardStatusService: CardStatusService, // ✅ اضافه شد
    ) { }

    /**
     * ایجاد پرداخت کارت به کارت
     */
    async initiate(user: User, dto: InitiateCardToCardDto) {
        return await runInTransaction(this.dataSource, async (manager) => {
            const order = await manager.findOne(Order, {
                where: { id: dto.orderId, user: { id: user.id } },
            });

            if (!order) {
                throw new NotFoundException('سفارش یافت نشد');
            }

            if (order.status !== OrderStatus.AWAITING_PAYMENT) {
                throw new BadRequestException('وضعیت سفارش برای پرداخت مناسب نیست');
            }

            // بررسی پرداخت pending
            const existingPayment = await manager.findOne(Payment, {
                where: {
                    order: { id: order.id },
                    paymentMethod: PaymentMethod.CARD_TO_CARD,
                    cardToCardStatus: CardToCardStatus.PENDING,
                },
            });

            if (existingPayment) {
                return existingPayment;
            }

            // بررسی پرداخت uploaded
            const uploadedPayment = await manager.findOne(Payment, {
                where: {
                    order: { id: order.id },
                    paymentMethod: PaymentMethod.CARD_TO_CARD,
                    cardToCardStatus: CardToCardStatus.UPLOADED,
                },
                relations: ['order', 'receiptImage'],
            });

            if (uploadedPayment) {
                return uploadedPayment;
            }

            // ✅ 2. لاک کردن Cart با استفاده از CardStatusService
            await this.cardStatusService.lockCart(user.id, manager);

            // ✅ 3. ایجاد پرداخت جدید
            const payment = manager.create(Payment, {
                order,
                user,
                amount: Number(order.total),
                authority: `C2C-${Date.now()}-${order.id}`,
                status: PaymentStatus.PENDING,
                message: 'منتظر آپلود رسید',
                paymentMethod: PaymentMethod.CARD_TO_CARD,
                cardToCardStatus: CardToCardStatus.PENDING,
            });

            const savedPayment = await manager.save(Payment, payment);

            // ✅ 4. ثبت لاگ
            await this.paymentLogRepo.save({
                order,
                payment: savedPayment,
                user,
                authority: savedPayment.authority,
                status: PaymentLogStatus.INITIATED,
                message: 'پرداخت کارت به کارت ایجاد شد، در انتظار آپلود رسید',
                payload: { orderId: order.id, amount: order.total },
            });

            this.logger.log(`Card-to-card payment initiated for order ${order.id}`);

            return savedPayment;
        });
    }

    /**
     * آپلود رسید (با تصویر یا اطلاعات دستی)
     */
    async uploadReceipt(
        user: User,
        paymentId: number,
        receiptImageId: number | undefined,
        dto: UploadReceiptDto,
    ) {
        return await runInTransaction(this.dataSource, async (manager) => {
            const paymentRepo = manager.getRepository(Payment);
            const orderRepo = manager.getRepository(Order);


            const payment = await paymentRepo.findOne({
                where: {
                    id: paymentId,
                    user: { id: user.id },
                    paymentMethod: PaymentMethod.CARD_TO_CARD,
                },
                relations: ['order', 'receiptImage'],
            });

            if (!payment) {
                throw new NotFoundException('پرداخت یافت نشد');
            }
            const order = await manager.findOne(Order, {
                where: { id: payment.orderId, user: { id: user.id } },
            });

            if (!order) {
                throw new NotFoundException('سفارش یافت نشد');
            }

            if (payment.cardToCardStatus === CardToCardStatus.APPROVED) {
                throw new BadRequestException('این پرداخت قبلاً تایید شده است');
            }

            // بروزرسانی اطلاعات
            if (receiptImageId) {
                payment.receiptImageId = receiptImageId;
            }

            if (dto.senderCardNumber) {
                payment.senderCardNumber = dto.senderCardNumber;
            }

            if (dto.trackingCode) {
                payment.trackingCode = dto.trackingCode;
            }

            payment.depositDate = dto.depositDate ? new Date(dto.depositDate) : new Date();
            payment.cardToCardStatus = CardToCardStatus.UPLOADED;

            // پیام بر اساس نوع ثبت
            if (receiptImageId && (dto.senderCardNumber || dto.trackingCode)) {
                payment.message = 'رسید و اطلاعات دستی ثبت شد، منتظر تایید ادمین';
            } else if (receiptImageId) {
                payment.message = 'تصویر رسید آپلود شد، منتظر تایید ادمین';
            } else {
                payment.message = 'اطلاعات واریز ثبت شد، منتظر تایید ادمین';
            }

            payment.status = PaymentStatus.PENDING;

            const saved = await paymentRepo.save(payment);

            // ✅ 1. تغییر وضعیت Order
            order.status = OrderStatus.PAYMENT_CONFIRMATION_PENDING;
            await orderRepo.save(order);

            // ✅ 2. ثبت لاگ
            await this.paymentLogRepo.save({
                order,
                payment: saved,
                user,
                authority: saved.authority,
                status: PaymentLogStatus.CALLBACK_RECEIVED,
                message: 'رسید آپلود شد، در انتظار بررسی ادمین',
                payload: {
                    hasImage: !!receiptImageId,
                    hasCardNumber: !!dto.senderCardNumber,
                    hasTrackingCode: !!dto.trackingCode,
                    depositDate: dto.depositDate,
                },
            });

            this.logger.log(`Receipt uploaded for payment ${saved.id}`);

            // بارگذاری مجدد با relation
            return await paymentRepo.findOne({
                where: { id: saved.id },
                relations: ['order', 'receiptImage'],
            });
        })
    }

    /**
     * کم کردن موجودی محصولات/واریانت‌ها
     */
    private async decreaseStock(manager: any, order: Order): Promise<void> {
        const orderWithItems = await manager.findOne(Order, {
            where: { id: order.id },
            relations: ['items', 'items.product', 'items.variant'],
        });

        if (!orderWithItems || !orderWithItems.items) {
            throw new BadRequestException('آیتم‌های سفارش یافت نشد');
        }

        for (const item of orderWithItems.items) {
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
     * افزایش تعداد استفاده از پروموشن
     */
    private async incrementPromotionUsage(manager: any, promotionIds: number[]): Promise<void> {
        for (const promotionId of promotionIds) {
            const promotion = await manager.findOne(Promotion, {
                where: { id: promotionId },
            });

            if (promotion) {
                promotion.usageCount = (promotion.usageCount || 0) + 1;
                await manager.save(Promotion, promotion);
            }
        }
    }

    /**
     * بررسی و تایید/رد رسید توسط ادمین
     */
    async reviewReceipt(
        admin: User,
        paymentId: number,
        dto: ReviewReceiptDto,
    ) {
        return await runInTransaction(this.dataSource, async (manager) => {
            const payment = await manager.findOne(Payment, {
                where: {
                    id: paymentId,
                    paymentMethod: PaymentMethod.CARD_TO_CARD,
                },
                relations: ['order', 'order.user', 'user', 'receiptImage'],
            });

            if (!payment) {
                throw new NotFoundException('پرداخت یافت نشد');
            }

            if (payment.cardToCardStatus !== CardToCardStatus.UPLOADED) {
                throw new BadRequestException(
                    'این پرداخت در وضعیت مناسب برای بررسی نیست. وضعیت فعلی: ' + payment.cardToCardStatus
                );
            }

            // اگر رد شد
            if (dto.status === CardToCardStatus.REJECTED) {
                if (!dto.adminNote || dto.adminNote.trim().length === 0) {
                    throw new BadRequestException('لطفاً دلیل رد را وارد کنید');
                }

                // ✅ 1. بروزرسانی Payment
                payment.cardToCardStatus = CardToCardStatus.REJECTED;
                payment.status = PaymentStatus.FAILED;
                payment.message = 'رسید رد شد';
                payment.adminNote = dto.adminNote;
                payment.reviewedById = admin.id;
                payment.reviewedAt = new Date();
                await manager.save(Payment, payment);

                // ✅ 2. تغییر وضعیت Order
                const order = await manager.findOne(Order, {
                    where: { id: payment.order.id },
                });

                if (order) {
                    order.status = OrderStatus.REJECTED;
                    await manager.save(Order, order);
                }

                // ✅ 3. آزاد کردن Cart با CardStatusService
                await this.cardStatusService.unlockCart(payment.user.id, manager);

                // ✅ 4. ثبت لاگ
                await this.paymentLogRepo.save({
                    order: payment.order,
                    payment,
                    user: payment.user,
                    authority: payment.authority,
                    status: PaymentLogStatus.FAILED,
                    message: `رسید توسط ادمین رد شد: ${dto.adminNote}`,
                    payload: { adminId: admin.id, reason: dto.adminNote },
                });

                this.logger.warn(`Payment ${payment.id} rejected by admin ${admin.id}`);

                return payment;
            }

            // اگر تایید شد
            if (dto.status === CardToCardStatus.APPROVED) {
                const order = await manager.findOne(Order, {
                    where: { id: payment.order.id },
                    relations: ['items', 'items.product', 'items.variant'],
                });

                if (!order) {
                    throw new NotFoundException('سفارش یافت نشد');
                }

                if (order.status !== OrderStatus.PAYMENT_CONFIRMATION_PENDING) {
                    throw new BadRequestException(
                        'وضعیت سفارش برای تایید پرداخت مناسب نیست. وضعیت فعلی: ' + order.status
                    );
                }

                // ✅ 1. کم کردن موجودی
                await this.decreaseStock(manager, order);

                // ✅ 2. افزایش تعداد استفاده از Promotion
                if (order.promotionDetails && order.promotionDetails.length > 0) {
                    const promotionIds = order.promotionDetails.map(p => p.promotionId);
                    await this.incrementPromotionUsage(manager, promotionIds);
                }

                // ✅ 3. بروزرسانی وضعیت سفارش به PROCESSING
                order.status = OrderStatus.PROCESSING;
                await manager.save(Order, order);

                // ✅ 4. بروزرسانی پرداخت
                payment.cardToCardStatus = CardToCardStatus.APPROVED;
                payment.status = PaymentStatus.SUCCESS;
                payment.message = 'پرداخت تایید شد';
                payment.adminNote = dto.adminNote || 'تایید شده';
                payment.reviewedById = admin.id;
                payment.reviewedAt = new Date();
                payment.refId = payment.trackingCode || `C2C-${payment.id}`;
                await manager.save(Payment, payment);

                // ✅ 5. Cart باید LOCKED بمونه (تا تحویل)
                // بعد از DELIVERED با OrderService.markAsDelivered به ABANDONED تبدیل می‌شه
                await this.cardStatusService.abandonCart(payment.user.id, manager);


                // ✅ 6. ایجاد Invoice
                const invoice = await this.invoiceService.createFromOrder(
                    manager,
                    order.id,
                    payment.user,
                );

                // ✅ 7. بروزرسانی وضعیت invoice به PAID
                if (invoice) {
                    await this.invoiceService.updateInvoiceStatus(
                        manager,
                        order.id,
                        InvoiceStatus.PAID,
                    );
                }

                // ✅ 8. ثبت لاگ
                await this.paymentLogRepo.save({
                    order,
                    payment,
                    user: payment.user,
                    authority: payment.authority,
                    status: PaymentLogStatus.VERIFIED,
                    message: 'پرداخت توسط ادمین تایید شد و فاکتور صادر شد',
                    payload: {
                        adminId: admin.id,
                        invoiceId: invoice?.id,
                        refId: payment.refId,
                        adminNote: dto.adminNote,
                    },
                });

                this.logger.log(`Payment ${payment.id} approved by admin ${admin.id}, invoice ${invoice?.id} created`);

                return payment;
            }

            throw new BadRequestException('وضعیت نامعتبر است');
        });
    }

    /**
     * دریافت لیست پرداخت‌های کارت به کارت (ادمین)
     */
    async findAllForAdmin(status?: CardToCardStatus) {
        const where: any = {
            paymentMethod: PaymentMethod.CARD_TO_CARD,
        };

        if (status) {
            where.cardToCardStatus = status;
        }

        return await this.paymentRepo.find({
            where,
            relations: ['user', 'order', 'receiptImage', 'reviewedBy'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * دریافت پرداخت‌های کاربر
     */
    async findAllByUser(user: User) {
        return await this.paymentRepo.find({
            where: {
                user: { id: user.id },
                paymentMethod: PaymentMethod.CARD_TO_CARD,
            },
            relations: ['order', 'receiptImage'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * دریافت جزئیات یک پرداخت
     */
    async findOne(id: number, user?: User) {
        const where: any = {
            id,
            paymentMethod: PaymentMethod.CARD_TO_CARD,
        };

        if (user) {
            where.user = { id: user.id };
        }

        const payment = await this.paymentRepo.findOne({
            where,
            relations: ['user', 'order', 'receiptImage', 'reviewedBy'],
        });

        if (!payment) {
            throw new NotFoundException('پرداخت یافت نشد');
        }

        return payment;
    }
}
