import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Category } from "src/modules/category/entities/category.entity";
import { FaqCategoryEntity } from "src/modules/store-info/entities/faq-category.entity";

@Entity('icons')
export class Icon {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 100, unique: true })
    name!: string;

    @Column({ type: 'text' })
    svg!: string;

    @OneToMany(() => Category, (category) => category.icon)
    categories!: Category[];

    @OneToMany(() => FaqCategoryEntity, (faqCat) => faqCat.icon)
    faqCategories!: FaqCategoryEntity[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
