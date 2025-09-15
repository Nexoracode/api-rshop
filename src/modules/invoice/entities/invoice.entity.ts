import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';
import { Order } from '../../order/entities/order.entity';


export enum InvoiceStatus {
    DRAFT = 'draft',
    ISSUED = 'issued',
    PAID = 'paid',
    CANCELED = 'canceled',
}


@Entity('invoices')
@Unique(['number'])
export class Invoice {
    @PrimaryGeneratedColumn()
    id: string;


    @ManyToOne(() => Order, { nullable: false, onDelete: 'CASCADE' })
    @Index()
    order: Order;


    @Column({ type: 'varchar', length: 32 })
    number: string;

    @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
    status: InvoiceStatus;


    @Column({ type: 'bigint' })
    total: number;


    @Column({ type: 'bigint', default: 0 })
    paidAmount: number;


    @Column({ type: 'timestamp', nullable: true })
    paidAt?: Date | null;


    @CreateDateColumn()
    createdAt: Date;


    @UpdateDateColumn()
    updatedAt: Date;
}