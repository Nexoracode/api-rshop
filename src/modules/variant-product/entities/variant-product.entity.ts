import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "src/modules/product/entities/product.entity";
import { VariantAttributeValue } from "src/modules/attributes/variant-attribute-value/entities/variant-attribute-value.entity";
import { IVariantProduct } from "../interfaces/variant-product.interface";

@Entity('variants-product')
export class VariantProduct implements IVariantProduct {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', nullable: true })
    stock: number;

    @Column({ type: 'int', nullable: true })
    price: number;

    @Column()
    sku: string;

    @Column({ type: 'decimal', default: 0 })
    discountAmount?: number | null | undefined;

    @Column({ type: 'float', default: 0 })
    discountPercent?: number | null | undefined;

    @ManyToOne(() => Product, product => product.variants, { onDelete: 'CASCADE' })
    product: Product

    @Column()
    productId: number;

    @OneToMany(() => VariantAttributeValue, value => value.variant, { cascade: true, eager: true })
    attributes: VariantAttributeValue[]
}
