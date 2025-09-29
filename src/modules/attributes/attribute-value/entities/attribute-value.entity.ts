import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Attribute } from "../../attribute/entities/attribute.entity";
import { Product } from "src/modules/product/entities/product.entity";
import { IAttributeValue } from "../interfaces/attribute-value.interface";

@Entity()
export class AttributeValue implements IAttributeValue {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    value: string;

    @ManyToOne(() => Attribute, attribute => attribute.values, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'attribute_id' })
    attribute: Attribute;

    @Column({ name: 'attribute_id' })
    attributeId: number;

    @Column({ name: 'display_color', nullable: true })
    displayColor?: string;

    @Column({ name: 'display_order', type: 'int' })
    displayOrder: number;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;
}