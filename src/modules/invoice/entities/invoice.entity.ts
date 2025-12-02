import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Order } from "src/modules/order/entities/order.entity";
import { User } from "src/modules/user/entities/user.entity";
import { InvoiceStatus } from "../enums/invoice-status.enum";

@Entity("invoices")
export class Invoice {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, (order) => order.invoices, { onDelete: "CASCADE" })
    @JoinColumn({ name: "order_id" })
    order: Order;

    @Column()
    orderId: number;

    @ManyToOne(() => User, (user) => user.invoices, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column()
    userId: number;

    // 💰 مبالغ
    @Column({ type: 'bigint' })
    subtotal: number;

    @Column({ type: 'bigint', default: 0 })
    discountTotal: number;

    @Column({ type: 'bigint' })
    total: number;

    @Column({ type: "bigint" })
    totalPayable: number;

    // 🎁 فیلدهای مرتبط با Promotion (جدید)
    @Column({ type: 'varchar', length: 191, nullable: true })
    promotionCode?: string | null;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    promotionDiscountAmount: number;

    @Column({ type: 'json', nullable: true })
    promotionDetails?: {
        promotionId: number;
        name: string;
        type: string;
        amount: number;
    }[];

    // 🚚 هزینه حمل و نقل
    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    shippingCost: number;

    // 💳 وضعیت پرداخت
    @Column({ type: "enum", enum: InvoiceStatus, default: InvoiceStatus.PENDING })
    status: InvoiceStatus;

    @Column({ type: "varchar", length: 255, nullable: true })
    paymentErrorMessage?: string;

    @Column({ type: "varchar", length: 100, nullable: true })
    paymentErrorCode?: string;

    // 🕓 تاریخ‌ها
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
