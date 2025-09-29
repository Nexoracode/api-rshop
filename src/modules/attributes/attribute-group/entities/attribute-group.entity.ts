import { Category } from "src/modules/category/entities/category.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Attribute } from "../../attribute/entities/attribute.entity";
import { IAttributeGroup } from "../interfaces/attribute-group.interface";

@Entity()
export class AttributeGroup implements IAttributeGroup {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 200, unique: true })
    name: string;

    @Column({ nullable: true })
    slug?: string;

    @Column({ name: 'display_order', type: 'int' })
    displayOrder: number;

    @OneToMany(() => Attribute, attribute => attribute.group)
    attributes: Attribute[]
}
