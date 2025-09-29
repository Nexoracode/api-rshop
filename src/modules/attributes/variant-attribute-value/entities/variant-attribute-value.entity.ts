import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Attribute } from "../../attribute/entities/attribute.entity";
import { AttributeValue } from "../../attribute-value/entities/attribute-value.entity";
import { VariantProduct } from "src/modules/variant-product/entities/variant-product.entity";
import { IVariantAttributeValue } from "../interfaces/variant-attribute-value.interface";

@Entity()
export class VariantAttributeValue implements IVariantAttributeValue {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => VariantProduct, variant => variant.attributes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'variant_id' })
    variant: VariantProduct;

    @Column({ name: 'variant_id' })
    variantId: number;

    @ManyToOne(() => Attribute, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'attribute_id' })
    attribute: Attribute;

    @Column({ name: 'attribute_id' })
    attributeId: number;

    @ManyToOne(() => AttributeValue, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'value_id' })
    value: AttributeValue;

    @Column({ name: 'value_id' })
    valueId: number;
}
