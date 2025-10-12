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

    // 🧾 ارتباط با سفارش
    @ManyToOne(() => Order, (order) => order.invoices, { onDelete: "CASCADE" })
    @JoinColumn({ name: "order_id" })
    order: Order;

    @Column()
    orderId: number;

    // 👤 ارتباط با کاربر
    @ManyToOne(() => User, (user) => user.invoices, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column()
    userId: number;

    // 💰 جمع مبلغ‌ها
    @Column({ type: 'bigint' })
    subtotal: number;


    @Column({ type: 'bigint', default: 0 })
    discountTotal: number;


    @Column({ type: 'bigint' })
    total: number;

    // 🎟 فیلدهای مرتبط با کوپن
    @Column({ nullable: true })
    couponCode?: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    couponDiscountAmount?: number;

    @Column({ type: "bigint" })
    totalPayable?: number;

    // 💳 وضعیت پرداخت (پرداخت‌شده / در انتظار / لغو)
    @Column({ type: "enum", enum: InvoiceStatus, default: InvoiceStatus.UNPAID })
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
