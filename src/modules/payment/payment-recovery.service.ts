import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { PaymentStatus } from './enums/payment-status.enum';
import { InvoiceService } from '../invoice/invoice.service';
import { PaymentLog } from './entities/payment-logs.entity';
import { PaymentLogStatus } from './enums/payment-status.enum';

@Injectable()
export class PaymentRecoveryService {
    private readonly logger = new Logger(PaymentRecoveryService.name);

    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
        @InjectRepository(PaymentLog) private readonly paymentLogRepo: Repository<PaymentLog>,
        private readonly invoiceService: InvoiceService,
    ) { }

    /**
     * 🕓 Cron Job: بررسی پرداخت‌های VERIFIED بدون فاکتور
     * اجرا روزانه ساعت ۳ صبح
     */
    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async recoverUninvoicedPayments() {
        this.logger.log('🔎 در حال بررسی پرداخت‌های بدون فاکتور...');

        // ۱️⃣ پیدا کردن پرداخت‌های VERIFIED که فاکتور ندارند
        const payments = await this.paymentRepo.find({
            where: { status: PaymentStatus.VERIFIED },
            relations: ['order', 'user'],
        });

        if (!payments.length) {
            this.logger.log('✅ هیچ پرداخت در حالت VERIFIED یافت نشد.');
            return;
        }

        this.logger.log(`📋 ${payments.length} پرداخت نیاز به بررسی دارد.`);

        for (const payment of payments) {
            await this.recoverSinglePayment(payment);
        }
    }

    /**
     * ♻️ تلاش برای ساخت فاکتور برای یک پرداخت خاص
     */
    private async recoverSinglePayment(payment: Payment) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { order, user } = payment;

            this.logger.log(
                `🧾 تلاش برای ساخت فاکتور مجدد برای پرداخت ${payment.id} (Order: ${order.id})`,
            );

            // بررسی اینکه فاکتور از قبل ساخته نشده
            const invoiceExist = await queryRunner.manager.findOne(Invoice, {
                where: { order: { id: order.id } },
            });
            if (invoiceExist) {
                this.logger.warn(`⚠️ فاکتور از قبل وجود دارد برای Order ${order.id}`);
                payment.status = PaymentStatus.SUCCESS;
                payment.message = 'پرداخت تایید شد (فاکتور از قبل وجود داشت)';
                await queryRunner.manager.save(payment);
                await queryRunner.commitTransaction();
                return;
            }

            // 🧾 ایجاد فاکتور جدید
            const invoice = await this.invoiceService.createFromOrder(
                queryRunner.manager,
                order.id,
                user,
            );

            // 💰 به‌روزرسانی وضعیت پرداخت
            payment.status = PaymentStatus.SUCCESS;
            payment.message = 'فاکتور با تأخیر ایجاد شد.';
            await queryRunner.manager.save(payment);

            // 📝 ثبت لاگ موفقیت
            await this.paymentLogRepo.save({
                order,
                payment,
                user,
                status: PaymentLogStatus.VERIFIED,
                message: 'فاکتور با تأخیر ایجاد شد و پرداخت نهایی شد.',
                payload: { invoiceId: invoice!.id },
            });

            await queryRunner.commitTransaction();
            this.logger.log(
                `✅ فاکتور ${invoice!.id} با موفقیت برای پرداخت ${payment.id} صادر شد.`,
            );
        } catch (e) {
            await queryRunner.rollbackTransaction();
            this.logger.error(
                `❌ خطا در بازیابی فاکتور برای پرداخت ${payment.id}: ${e.message}`,
            );

            await this.paymentLogRepo.save({
                order: payment.order,
                payment,
                user: payment.user,
                status: PaymentLogStatus.FAILED,
                message: 'خطا در بازیابی فاکتور خودکار',
                payload: { error: e.message },
            });
        } finally {
            await queryRunner.release();
        }
    }
}
