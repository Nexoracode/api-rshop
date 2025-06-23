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
    variant: VariantProduct;

    @Column()
    variantId: number;

    @ManyToOne(() => Attribute, { onDelete: 'CASCADE' })
    attribute: Attribute;

    @Column()
    attributeId: number;

    @ManyToOne(() => AttributeValue, { onDelete: 'CASCADE' })
    value: AttributeValue;

    @Column()
    valueId: number;

    @Column({ nullable: true })
    label: string;
}
