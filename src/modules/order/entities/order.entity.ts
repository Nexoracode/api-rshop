import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { OrderItem } from './order-item.entity';


export enum OrderStatus {
    PENDING = 'pending',
    PAID = 'paid',
    CANCELED = 'canceled',
    FULFILLED = 'fulfilled',
}


@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn()
    id: string;


    @ManyToOne(() => User, (u) => u.orders, { nullable: false, onDelete: 'CASCADE' })
    @Index()
    user: User;

    @OneToMany(() => OrderItem, (i) => i.order, { cascade: true })
    items: OrderItem[];


    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
    status: OrderStatus;


    @Column({ type: 'bigint' })
    subtotal: number;


    @Column({ type: 'bigint', default: 0 })
    discountTotal: number;


    @Column({ type: 'bigint' })
    total: number;


    @Column({ type: 'varchar', length: 64, nullable: true })
    paymentGatewayRef?: string | null;


    @CreateDateColumn()
    createdAt: Date;


    @UpdateDateColumn()
    updatedAt: Date;
}