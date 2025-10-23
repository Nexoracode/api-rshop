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
    media: Media[];

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column('decimal')
    price: number;

    @Column('int')
    stock: number;

    @Column({ name: 'is_same_day_shipping', default: false })
    isSameDayShipping: boolean;

    @Column({ name: 'requires_preparation', default: false })
    requiresPreparation: boolean;

    @Column({ name: 'preparation_days', type: 'int', nullable: true })
    preparationDays?: number | null;

    @Column({ name: 'is_limited_stock', default: false })
    isLimitedStock: boolean;

    @Column({ name: 'discount_amount', type: 'float', default: 0 })
    discountAmount?: number;

    @Column({ name: 'discount_percent', type: 'float', default: 0 })
    discountPercent?: number;

    @Column({ name: 'is_featured', default: false })
    isFeatured: boolean;

    @Column({ type: 'float', default: 0 })
    weight: number;

    @Column({ name: 'weight_unit', type: 'enum', enum: WeightUnit, default: WeightUnit.KG })
    weightUnit: WeightUnit;

    @Column({ type: 'longtext', nullable: true })
    description?: string | null | undefined;

    @Column({ name: 'is_visible', default: false })
    isVisible: boolean;

    @Column({ name: 'order_limit', nullable: true })
    orderLimit: number

    @ManyToOne(() => Category, category => category.products)

    @JoinColumn({ name: 'category_id' })
    category: Category;

    @Column({ name: 'category_id' })
    categoryId: number;

    @OneToMany(() => Media, media => media.product, { cascade: true })
    medias: Media[];

    @ManyToOne(() => Media, media => media.product, { eager: true })
    @JoinColumn({ name: 'media_pinned_id' })
    mediaPinned: Media;

    @Column({ name: 'media_pinned_id', nullable: true })
    mediaPinnedId: number;

    @ManyToOne(() => HelperEntity, helper => helper.product, { nullable: true, cascade: true })
    @JoinColumn({ name: 'helper_id' })
    helper: HelperEntity;

    @Column({ name: 'helper_id', nullable: true })
    helperId: number;

    @OneToMany(() => VariantProduct, variant => variant.product, { cascade: true })
    variants: VariantProduct[];

    @OneToMany(() => ProductAttributeValue, (pav) => pav.product, { cascade: true })
    attributeValues: ProductAttributeValue[];

    @ManyToOne(() => Brand, brand => brand.products, { cascade: true, nullable: true })
    @JoinColumn({ name: 'brand_id' })
    brand: Brand;

    @Column({ name: 'brand_id', nullable: true })
    brandId: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ name: 'is_active', default: true })
    isActive: boolean | true;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

}