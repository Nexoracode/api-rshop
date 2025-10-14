import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "src/modules/user/entities/user.entity";
import { Order } from "src/modules/order/entities/order.entity";
import { Payment } from "./payment.entity";
import { PaymentLogStatus } from "../enums/payment-status.enum";
@Entity("payment_logs")
export class PaymentLog {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    user: User;

    @ManyToOne(() => Order, { onDelete: "CASCADE" })
    order: Order;

    @Column({ type: "varchar", length: 255, nullable: true })
    authority?: string; // شناسه تراکنش در زرین‌پال

    @Column({ type: "varchar", length: 50 })
    status: PaymentLogStatus;

    @Column({ type: "int", nullable: true })
    errorCode?: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    message?: string;

    @Column({ type: "varchar", length: 100, nullable: true })
    refId?: string; // شماره پیگیری بانک

    @Column({ type: "varchar", length: 45, nullable: true })
    ip?: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    userAgent?: string;

    @Column({ type: 'json', nullable: true })
    payload?: Record<string, any>; // پاسخ خام از درگاه

    @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
    payment: Payment;

    @CreateDateColumn()
    createdAt: Date;
}
