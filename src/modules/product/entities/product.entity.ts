import { Category } from "src/modules/category/entities/category.entity";
import { Media } from "src/modules/media/entities/image.entity";
import { VariantProduct } from "src/modules/variant-product/entities/variant-product.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { IProduct } from "../interfaces/product.interface";
import { AttributeValue } from "src/modules/attributes/attribute-value/entities/attribute-value.entity";
import { WeightUnit } from "src/common/enums/product.enum";

@Entity('products')
export class Product implements IProduct {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column('decimal')
    price: number;

    @Column('int')
    stock: number;

    @Column({ default: false })
    isSameDayShipping: boolean;

    @Column({ default: false })
    requiresPreparation: boolean;

    @Column({ type: 'int', nullable: true })
    preparationDays?: number | null;

    @Column({ default: false })
    isLimitedStock: boolean;

    @Column({ nullable: true, type: 'decimal' })
    discountAmount?: number | null | undefined;

    @Column({ nullable: true, type: 'float' })
    discountPercent?: number | null | undefined;

    @Column({ default: false })
    isFeatured: boolean;

    @Column({ type: 'decimal', nullable: true })
    weight: number;

    @Column({ type: 'enum', enum: WeightUnit, default: WeightUnit.KG })
    weightUnit: WeightUnit;

    @Column({ type: 'text', nullable: true })
    description?: string | null | undefined;

    @Column({ default: false })
    isVisible: boolean;

    @ManyToOne(() => Category, category => category.products)
    category: Category;

    @Column()
    categoryId: number;

    @OneToMany(() => Media, media => media.product, { cascade: true })
    media: Media[];

    @OneToMany(() => VariantProduct, variant => variant.product, { cascade: true })
    variants: VariantProduct[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}