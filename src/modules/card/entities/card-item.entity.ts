import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Card } from "./card.entity";
import { Product } from "src/modules/product/entities/product.entity";
import { VariantProduct } from "src/modules/variant-product/entities/variant-product.entity";

@Entity('card_items')
@Unique(['card', 'product', 'variant'])
export class CardItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;


    @ManyToOne(() => Card, (c) => c.items, { onDelete: 'CASCADE' })
    @Index()
    card: Card;


    @ManyToOne(() => Product, { eager: true, nullable: false })
    product: Product;


    @ManyToOne(() => VariantProduct, { eager: true, nullable: true })
    variant?: VariantProduct | null; // ممکن است محصول ساده باشد


    @Column({ type: 'int' })
    quantity: number;


    @Column({ type: 'bigint' })
    unitPrice: number; // قیمت واحد در لحظه اضافه شدن


    @Column({ type: 'bigint', default: 0 })
    discount: number; // تخفیف واحد (در صورت وجود)


    @Column({ type: 'bigint' })
    lineTotal: number; // (unitPrice - discount) * quantity


    @CreateDateColumn()
    createdAt: Date;


    @UpdateDateColumn()
    updatedAt: Date;
}