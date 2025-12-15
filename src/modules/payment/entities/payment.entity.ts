import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Order } from "src/modules/order/entities/order.entity";
import { User } from "src/modules/user/entities/user.entity";
import { PaymentGateway, PaymentStatus, PaymentMethod, CardToCardStatus } from "../enums/payment-status.enum";
import { PaymentLog } from "./payment-logs.entity";
import { Media } from "src/modules/media/entities/image.entity";

@Entity("payments")
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, { onDelete: "CASCADE" })
    order: Order;

    @Column({ name: 'order_id' })
    orderId: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    user: User;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount: number;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 255 })
    authority: string;

    @Column({ name: 'ref_id', nullable: true, type: 'bigint' })
    refId?: string; // شماره پیگیری بانکی

    @Column({ type: "enum", enum: PaymentStatus, default: PaymentStatus.PENDING })
    status: PaymentStatus;

    @Column({ name: 'message' })
    message: string;

    @Column({ type: 'enum', enum: PaymentGateway, default: PaymentGateway.ZARINPAL })
    gateway: PaymentGateway;

    // ✅ فیلدهای جدید برای کارت به کارت
    @Column({
        type: 'enum',
        enum: PaymentMethod,
        default: PaymentMethod.ONLINE,
        name: 'payment_method'
    })
    paymentMethod: PaymentMethod;

    // رسید کارت به کارت
    @ManyToOne(() => Media, { eager: true, nullable: true })
    @JoinColumn({ name: 'receipt_image_id' })
    receiptImage?: Media;

    @Column({ name: 'receipt_image_id', nullable: true })
    receiptImageId?: number;

    // وضعیت کارت به کارت
    @Column({
        type: 'enum',
        enum: CardToCardStatus,
        nullable: true,
        name: 'card_to_card_status'
    })
    cardToCardStatus?: CardToCardStatus;

    // شماره کارت مبدا (کارت مشتری)
    @Column({ name: 'sender_card_number', type: 'varchar', length: 16, nullable: true })
    senderCardNumber?: string;

    // شماره پیگیری واریز (از رسید)
    @Column({ name: 'tracking_code', type: 'varchar', length: 50, nullable: true })
    trackingCode?: string;

    // تاریخ واریز
    @Column({ name: 'deposit_date', type: 'timestamp', nullable: true })
    depositDate?: Date;

    // توضیحات ادمین (در صورت رد)
    @Column({ name: 'admin_note', type: 'text', nullable: true })
    adminNote?: string;

    // ادمینی که تایید/رد کرده
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'reviewed_by' })
    reviewedBy?: User;

    @Column({ name: 'reviewed_by', nullable: true })
    reviewedById?: number;

    // تاریخ بررسی
    @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
    reviewedAt?: Date;

    @OneToMany(() => PaymentLog, (log) => log.payment)
    logs: PaymentLog[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
