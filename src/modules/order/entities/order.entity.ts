import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, Column, CreateDateColumn, UpdateDateColumn, Index, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { Invoice } from 'src/modules/invoice/entities/invoice.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { Address } from 'src/modules/address/entities/address.entity';
import { ManualDiscountType } from 'src/common/enums/discount.enum';

@Entity('orders')
export class Order {

    @PrimaryGeneratedColumn()
    id: number;


    @ManyToOne(() => User, (u) => u.orders, { nullable: false, onDelete: 'CASCADE' })
    @Index()
    user: User;


    // 🏠 آدرس انتخاب‌شده کاربر برای این سفارش
    @ManyToOne(() => Address, { eager: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'address_id' })
    address: Address;

    @Column({ name: 'address_id', nullable: true })
    addressId: number;

    @OneToMany(() => Invoice, (invoice) => invoice.order)
    invoices: Invoice[];

    @OneToMany(() => OrderItem, (i) => i.order, { cascade: true })
    items: OrderItem[];


    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.AWAITING_PAYMENT })
    status: OrderStatus;


    @Column({ type: 'bigint' })
    subtotal: number;


    @Column({ type: 'bigint', default: 0 })
    discountTotal: number;


    @Column({ type: 'bigint' })
    total: number;


    @Column({ type: 'varchar', length: 64, nullable: true })
    paymentGatewayRef?: string | null;


    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    promotionDiscountAmount: number;

    @Column({ type: 'json', nullable: true })
    promotionDetails?: {
        promotionId: number;
        name: string;
        type: string;
        amount: number;
    }[];

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    shippingCost: number;

    @Column({ type: 'varchar', length: 191, nullable: true })
    promotionCode?: string | null;


    @Column({ type: "varchar", nullable: true })
    manualDiscountType?: ManualDiscountType;

    @Column({ type: "int", default: 0 })
    manualDiscountValue: number;

    @Column({ type: "int", default: 0 })
    manualDiscountApplied: number; // مقدار واقعی تخفیف نهایی بعد از محاسبه


    @Column({ name: 'is_manual', default: false })
    isManual: boolean; // 🟢 مشخص می‌کنه سفارش دستی ثبت شده

    @Column({ name: 'note', type: 'text', nullable: true })
    note?: string;


    @CreateDateColumn()
    createdAt: Date;


    @UpdateDateColumn()
    updatedAt: Date;
}