// entities/product-attribute-value.entity.ts
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Product } from "../../product/entities/product.entity";
import { Attribute } from "../../attributes/attribute/entities/attribute.entity";
import { AttributeValue } from "../../attributes/attribute-value/entities/attribute-value.entity";

@Entity("product_attribute_values")
export class ProductAttributeValue {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Product, (product) => product.attributeValues, { onDelete: "CASCADE" })
    @JoinColumn({ name: "product_id" })
    product: Product;

    @ManyToOne(() => Attribute, { eager: true })
    @JoinColumn({ name: "attribute_id" })
    attribute: Attribute;

    @Column({ name: 'attribute_id' })
    attributeId: number;

    @Column({ name: 'product_id' })
    productId: number;

    @ManyToOne(() => AttributeValue, { eager: true, nullable: true })
    @JoinColumn({ name: "value_id" })
    value: AttributeValue | null;

    @Column({ name: 'is_important', type: 'boolean', default: false })
    isImportant: boolean;

    @Column({ name: 'display_order', type: 'int' })
    displayOrder: number;
}
