import { CategoryAttribute } from "src/modules/category-attribute/entities/category-attribute.entity";
import { Product } from "src/modules/product/entities/product.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, Tree, TreeChildren, TreeParent, UpdateDateColumn } from "typeorm";
import { ICategory } from "../interfaces/category.interface";
import { Media } from "src/modules/media/entities/image.entity";
import { Icon } from "src/modules/icon/entities/icon.entity";

@Tree('closure-table')
@Entity('categories')
export class Category implements ICategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, unique: true })
    title: string;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({ unique: true })
    slug: string;

    @TreeChildren()
    children: Category[]

    @TreeParent({ onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parent_id' })
    parent: Category | null

    @Column({ name: 'parent_id', nullable: true })
    parentId: number | null;

    @OneToMany(() => Product, product => product.category)
    products: Product[]

    @OneToMany(() => CategoryAttribute, ca => ca.category)
    categoryAttributes: CategoryAttribute[];

    @Column({ name: 'icon_id', nullable: true })
    iconId: number | null;

    @ManyToOne(() => Icon, (icon) => icon.categories, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'icon_id' })
    icon: Icon | null;

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
