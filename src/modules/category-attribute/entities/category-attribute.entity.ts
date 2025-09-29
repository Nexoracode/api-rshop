import { Attribute } from "src/modules/attributes/attribute/entities/attribute.entity";
import { Category } from "src/modules/category/entities/category.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ICategoryAttribute } from "../interfaces/category-attribute.interface";

@Entity()
export class CategoryAttribute implements ICategoryAttribute {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Category, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @Column({ name: 'category_id' })
    categoryId: number;

    @ManyToOne(() => Attribute, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'attribute_id' })
    attribute: Attribute;

    @Column({ name: 'attribute_id' })
    attributeId: number;
}