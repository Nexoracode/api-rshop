import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../product/entities/product.entity';
import { VariantProduct } from '../../variant-product/entities/variant-product.entity';


@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn()
    id: number;


    @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;


    @ManyToOne(() => Product, { eager: true })
    @JoinColumn({ name: 'product_id' })
    product: Product;


    @ManyToOne(() => VariantProduct, { eager: true, nullable: true })
    @JoinColumn({ name: 'variant_id' })
    variant?: VariantProduct | null;


    @Column({ type: 'int' })
    quantity: number;


    @Column({ name: 'unit_price', type: 'bigint' })
    unitPrice: number;


    @Column({ type: 'bigint', default: 0 })
    discount: number;


    @Column({ name: 'line_total', type: 'bigint' })
    lineTotal: number;
}