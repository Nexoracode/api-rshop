import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Attribute } from "../../attribute/entities/attribute.entity";
import { Product } from "src/modules/product/entities/product.entity";

@Entity()
export class AttributeValue {
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
}