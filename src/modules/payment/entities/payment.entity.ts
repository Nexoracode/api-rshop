import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "src/modules/order/entities/order.entity";
import { User } from "src/modules/user/entities/user.entity";
import { PaymentStatus } from "../enums/payment-status.enum";
import { PaymentLog } from "./payment-logs.entity";

@Entity("payments")
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, { onDelete: "CASCADE" })
    order: Order;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    user: User;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount: number;

    @Column({ nullable: true })
    authority?: string; // از زرین‌پال میاد

    @Column({ name: 'ref_id', nullable: true, type: 'bigint' })
    refId?: string; // شماره پیگیری بانکی

    @Column({ type: "enum", enum: PaymentStatus, default: PaymentStatus.PENDING })
    status: PaymentStatus;

    @OneToMany(() => PaymentLog, (log) => log.payment)
    logs: PaymentLog[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
