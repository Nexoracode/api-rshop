import { Attribute } from "src/modules/attributes/attribute/entities/attribute.entity";
import { Category } from "src/modules/category/entities/category.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ICategoryAttribute } from "../interfaces/category-attribute.interface";

@Entity()
export class CategoryAttribute implements ICategoryAttribute {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Category, { onDelete: 'CASCADE' })
    category: Category;

    @Column()
    categoryId: number;

    @ManyToOne(() => Attribute, { onDelete: 'CASCADE' })
    attribute: Attribute;

    @Column()
    attributeId: number;

    @Column({ default: false })
    isRequired: boolean;
} 