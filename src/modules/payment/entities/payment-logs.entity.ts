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

export enum PaymentLogStatus {
    USER_CANCELLED = "user_cancelled", // کاربر پرداخت را لغو کرده
    GATEWAY_ERROR = "gateway_error",   // خطای درگاه یا بانک
    SUCCESS = "success",               // پرداخت موفق
    DUPLICATE = "duplicate",           // تراکنش تکراری
}

@Entity("payment_logs")
export class PaymentLog {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    user: User;

    @ManyToOne(() => Order, { onDelete: "CASCADE" })
    order: Order;

    @Column({ type: "varchar", length: 255 })
    authority: string; // شناسه تراکنش در زرین‌پال

    @Column({ type: "varchar", length: 50 })
    status: PaymentLogStatus;

    @Column({ type: "int", nullable: true })
    errorCode?: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    errorMessage?: string;

    @Column({ type: "varchar", length: 100, nullable: true })
    refId?: string; // شماره پیگیری بانک

    @Column({ type: "varchar", length: 45, nullable: true })
    ip?: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    userAgent?: string;

    @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
    payment: Payment;

    @CreateDateColumn()
    createdAt: Date;
}
