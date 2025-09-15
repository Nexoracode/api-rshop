import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../product/entities/product.entity';
import { VariantProduct } from '../../variant-product/entities/variant-product.entity';


@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn()
    id: string;


    @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' })
    order: Order;


    @ManyToOne(() => Product, { eager: true })
    product: Product;


    @ManyToOne(() => VariantProduct, { eager: true, nullable: true })
    variant?: VariantProduct | null;


    @Column({ type: 'int' })
    quantity: number;


    @Column({ type: 'bigint' })
    unitPrice: number;


    @Column({ type: 'bigint', default: 0 })
    discount: number;


    @Column({ type: 'bigint' })
    lineTotal: number;
}