import { CategoryAttribute } from "src/modules/category-attribute/entities/category-attribute.entity";
import { Product } from "src/modules/product/entities/product.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, Tree, TreeChildren, TreeParent, UpdateDateColumn } from "typeorm";
import { ICategory } from "../interfaces/category.interface";
import { Media } from "src/modules/media/entities/image.entity";

@Tree('closure-table')
@Entity('categories')
// @Index(['slug'])
// @Index(['title'])
export class Category implements ICategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, unique: true })
    title: string;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({ unique: true })
    slug: string;

    @TreeChildren({ cascade: true })
    children: Category[]

    @TreeParent()
    @JoinColumn({ name: 'parent_id' })
    parent: Category | null

    @Column({ name: 'parent_id', nullable: true })
    parentId: number | null;

    @OneToMany(() => Product, product => product.category)
    products: Product[]

    @OneToMany(() => CategoryAttribute, ca => ca.category)
    categoryAttributes: CategoryAttribute[];

    @Column({ default: 0 })
    level: number;

    @Column({ nullable: true })
    discount: string;

    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @OneToOne(() => Media, (media) => media.category)
    media: Media;

    @CreateDateColumn({ name: 'created_at', select: false })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', select: false })
    updatedAt: Date;
}
