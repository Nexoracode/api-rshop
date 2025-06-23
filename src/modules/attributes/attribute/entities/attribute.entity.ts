import { CategoryAttribute } from "src/modules/category-attribute/entities/category-attribute.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AttributeGroup } from "../../attribute-group/entities/attribute-group.entity";
import { AttributeValue } from "../../attribute-value/entities/attribute-value.entity";
import { IAttribute } from "../interfaces/attribute.interface";
import { AttributeUnit } from "src/common/enums/attribute.enum";

@Entity({ name: 'attributes' })
export class Attribute implements IAttribute {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    slug?: string;

    @Column({ type: 'boolean', default: false })
    isPublic: boolean;

    @ManyToOne(() => AttributeGroup, (group) => group.attributes, {
        nullable: true,
        onDelete: 'SET NULL'
    })
    group: AttributeGroup;

    @Column({ nullable: true })
    groupId: number;

    @OneToMany(() => AttributeValue, (values) => values.attribute, {
        cascade: true,
    })
    values: AttributeValue[];

    @OneToMany(() => CategoryAttribute, (catAttr) => catAttr.attribute, {
        cascade: true
    })
    catAttribute: CategoryAttribute[];

    @Column({ type: 'enum', enum: AttributeUnit, default: AttributeUnit.TEXT })
    type: AttributeUnit;

    @Column({ type: 'int', nullable: true })
    displayOrder?: number | undefined;
}