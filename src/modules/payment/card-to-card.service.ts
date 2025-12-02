import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Order } from '../order/entities/order.entity';
import { User } from '../user/entities/user.entity';
import { CardToCardStatus, PaymentMethod, PaymentStatus } from './enums/payment-status.enum';
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

@Injectable()
export class CardToCardService {
    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,
        @InjectDataSource()
        private readonly dataSource: DataSource,
        private readonly invoiceService: InvoiceService,
    ) { }

    /**
     * ایجاد پرداخت کارت به کارت
     */
    async initiate(user: User, dto: InitiateCardToCardDto) {
        const order = await this.orderRepo.findOne({
            where: { id: dto.orderId, user: { id: user.id } },
        });

        if (!order) {
            throw new NotFoundException('سفارش یافت نشد');
        }

        if (order.status !== OrderStatus.AWAITING_PAYMENT) {
            throw new BadRequestException('وضعیت سفارش برای پرداخت مناسب نیست');
        }

        // بررسی پرداخت pending
        const existingPayment = await this.paymentRepo.findOne({
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
        const uploadedPayment = await this.paymentRepo.findOne({
            where: {
                order: { id: order.id },
                paymentMethod: PaymentMethod.CARD_TO_CARD,
                cardToCardStatus: CardToCardStatus.UPLOADED,
            },
            relations: ['receiptImage'],
        });

        if (uploadedPayment) {
            return uploadedPayment;
        }

        // ایجاد پرداخت جدید
        const payment = this.paymentRepo.create({
            order,
            user,
            amount: Number(order.total),
            authority: `C2C-${Date.now()}-${order.id}`,
            status: PaymentStatus.PENDING,
            message: 'منتظر آپلود رسید',
            paymentMethod: PaymentMethod.CARD_TO_CARD,
            cardToCardStatus: CardToCardStatus.PENDING,
        });

        return await this.paymentRepo.save(payment);
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
        const payment = await this.paymentRepo.findOne({
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

        if (payment.cardToCardStatus === CardToCardStatus.APPROVED) {
            throw new BadRequestException('این پرداخت قبلاً تایید شده است');
        }

        // بروزرسانی اطلاعات
        if (receiptImageId) {
            payment.receiptImageId = receiptImageId;
        }

        if (dto.sender_card_number) {
            payment.senderCardNumber = dto.sender_card_number;
        }

        if (dto.tracking_code) {
            payment.trackingCode = dto.tracking_code;
        }

        payment.depositDate = dto.deposit_date ? new Date(dto.deposit_date) : new Date();
        payment.cardToCardStatus = CardToCardStatus.UPLOADED;

        // پیام بر اساس نوع ثبت
        if (receiptImageId && (dto.sender_card_number || dto.tracking_code)) {
            payment.message = 'رسید و اطلاعات دستی ثبت شد، منتظر تایید ادمین';
        } else if (receiptImageId) {
            payment.message = 'تصویر رسید آپلود شد، منتظر تایید ادمین';
        } else {
            payment.message = 'اطلاعات واریز ثبت شد، منتظر تایید ادمین';
        }

        payment.status = PaymentStatus.PENDING;

        const saved = await this.paymentRepo.save(payment);

        // بارگذاری مجدد با relation
        return await this.paymentRepo.findOne({
            where: { id: saved.id },
            relations: ['order', 'receiptImage'],
        });
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
                relations: ['order', 'user', 'receiptImage'],
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
                if (!dto.admin_note || dto.admin_note.trim().length === 0) {
                    throw new BadRequestException('لطفاً دلیل رد را وارد کنید');
                }

                payment.cardToCardStatus = CardToCardStatus.REJECTED;
                payment.status = PaymentStatus.FAILED;
                payment.message = 'رسید رد شد';
                payment.adminNote = dto.admin_note;
                payment.reviewedById = admin.id;
                payment.reviewedAt = new Date();

                await manager.save(Payment, payment);

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

                if (order.status !== OrderStatus.AWAITING_PAYMENT) {
                    throw new BadRequestException(
                        'وضعیت سفارش برای تایید پرداخت مناسب نیست. وضعیت فعلی: ' + order.status
                    );
                }

                // 1. کم کردن موجودی
                await this.decreaseStock(manager, order);

                // 2. افزایش تعداد استفاده از Promotion
                if (order.promotionDetails && order.promotionDetails.length > 0) {
                    const promotionIds = order.promotionDetails.map(p => p.promotionId);
                    await this.incrementPromotionUsage(manager, promotionIds);
                }

                // 3. بروزرسانی وضعیت سفارش
                order.status = OrderStatus.AWAITING_PAYMENT;
                await manager.save(Order, order);

                // 4. بروزرسانی پرداخت
                payment.cardToCardStatus = CardToCardStatus.APPROVED;
                payment.status = PaymentStatus.SUCCESS;
                payment.message = 'پرداخت تایید شد';
                payment.adminNote = dto.admin_note || 'تایید شده';
                payment.reviewedById = admin.id;
                payment.reviewedAt = new Date();
                payment.refId = payment.trackingCode || `C2C-${payment.id}`;

                await manager.save(Payment, payment);

                // 5. ایجاد فاکتور
                const invoice = await this.invoiceService.createFromOrder(
                    manager,
                    order.id,
                    payment.user,
                );

                // 6. بروزرسانی وضعیت invoice به PAID
                if (invoice) {
                    await this.invoiceService.updateInvoiceStatus(
                        manager,
                        order.id,
                        InvoiceStatus.PAID,
                    );
                }

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
