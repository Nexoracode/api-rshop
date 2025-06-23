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

    @ManyToOne(() => Product, product => product.attributes, { onDelete: 'CASCADE' })
    product: Product;

    @Column()
    productId: number;

    @ManyToOne(() => Attribute, attribute => attribute.values, { nullable: true, onDelete: 'CASCADE' })
    attribute: Attribute;

    @Column()
    attributeId: number;

    @Column({ nullable: true })
    displayColor?: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;
}