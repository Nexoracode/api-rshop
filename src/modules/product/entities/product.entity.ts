import { Category } from "src/modules/category/entities/category.entity";
import { Media } from "src/modules/media/entities/image.entity";
import { VariantProduct } from "src/modules/variant-product/entities/variant-product.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { IProduct } from "../interfaces/product.interface";
import { AttributeValue } from "src/modules/attributes/attribute-value/entities/attribute-value.entity";
import { WeightUnit } from "src/common/enums/product.enum";
import { HelperEntity } from "src/modules/helper/entities/helper.entity";
import { Brand } from "src/modules/brand/entities/brand.entity";
import { ProductAttributeValue } from "src/modules/product-attribute-value/entities/product-attribute-value.entity";

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

    @Column({ type: 'float', default: 0 })
    discountAmount?: number;

    @Column({ type: 'float', default: 0 })
    discountPercent?: number;

    @Column({ default: false })
    isFeatured: boolean;

    @Column({ type: 'float', default: 0 })
    weight: number;

    @Column({ type: 'enum', enum: WeightUnit, default: WeightUnit.KG })
    weightUnit: WeightUnit;

    @Column({ type: 'text', nullable: true })
    description?: string | null | undefined;

    @Column({ default: false })
    isVisible: boolean;

    @Column({ nullable: true })
    orderLimit: number

    @ManyToOne(() => Category, category => category.products)
    category: Category;

    @Column()
    categoryId: number;

    @OneToMany(() => Media, media => media.product, { cascade: true })
    media: Media[];

    @ManyToOne(() => Media, media => media.product)
    mediaPinned: Media;

    @Column({ nullable: true })
    mediaPinnedId: number;

    @ManyToOne(() => HelperEntity, helper => helper.product, { nullable: true, cascade: true })
    helper: HelperEntity;

    @Column({ nullable: true })
    helperId: number;

    @OneToMany(() => VariantProduct, variant => variant.product, { cascade: true })
    variants: VariantProduct[];

    @OneToMany(() => ProductAttributeValue, (pav) => pav.product, { cascade: true })
    attributeValues: ProductAttributeValue[];

    @ManyToOne(() => Brand, brand => brand.products, { cascade: true, nullable: true })
    brand: Brand;

    @Column({ nullable: true })
    brandId: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}