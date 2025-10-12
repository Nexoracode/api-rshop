import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Card } from "./card.entity";
import { Product } from "src/modules/product/entities/product.entity";
import { VariantProduct } from "src/modules/variant-product/entities/variant-product.entity";

@Entity('card_items')
@Unique('UQ_card_items__card_product_variant', ['card', 'product', 'variant'])
export class CardItem {
    @PrimaryGeneratedColumn()
    id: number;


    @ManyToOne(() => Card, (c) => c.items, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'card_id' })
    @Index('IDX_card_items__card_id')
    card: Card;


    @ManyToOne(() => Product, { eager: true, nullable: false })
    @JoinColumn({ name: 'product_id' })
    @Index('IDX_card_items__product_id')
    product: Product;


    @ManyToOne(() => VariantProduct, { eager: true, nullable: true })
    @Index('IDX_card_items__variant_id')
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


    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;


    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}