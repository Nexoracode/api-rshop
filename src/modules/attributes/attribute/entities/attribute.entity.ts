import { CategoryAttribute } from "src/modules/category-attribute/entities/category-attribute.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AttributeGroup } from "../../attribute-group/entities/attribute-group.entity";
import { AttributeValue } from "../../attribute-value/entities/attribute-value.entity";
import { IAttribute } from "../interfaces/attribute.interface";
import { AttributeUnit } from "src/common/enums/attribute.enum";

@Entity({ name: 'attributes' })
export class Attribute implements IAttribute {
    catAttribute: CategoryAttribute[];
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column()
    slug: string;

    @Column({ name: 'is_public', type: 'boolean', default: false })
    isPublic: boolean;

    @ManyToOne(() => AttributeGroup, (group) => group.attributes, {
        nullable: true,
        onDelete: 'SET NULL'
    })
    @JoinColumn({ name: 'group_id' })
    group: AttributeGroup;

    @Column({ name: 'group_id', nullable: true })
    groupId?: number | null;

    @OneToMany(() => AttributeValue, (values) => values.attribute, {
        cascade: true,
    })
    values: AttributeValue[];

    @OneToMany(() => CategoryAttribute, (catAttr) => catAttr.attribute, {
        cascade: true
    })
    categoryAttribute: CategoryAttribute[];

    @Column({ type: 'enum', enum: AttributeUnit, default: AttributeUnit.TEXT })
    type: AttributeUnit;

    @Column({ name: 'display_order', type: 'int' })
    displayOrder: number;

    @Column({ name: 'is_variant', type: 'boolean', default: false })
    isVariant: boolean;
}