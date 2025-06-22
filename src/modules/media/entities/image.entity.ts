// entities/media.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Product } from 'src/modules/product/entities/product.entity';
import { Category } from 'src/modules/category/entities/category.entity';
import { User } from 'src/modules/user/entities/user.entity';

@Entity('media')
export class Media {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

    @Column()
    type: string;

    @Column({ nullable: true })
    altText?: string;

    @ManyToOne(() => Product, (product) => product.media, { nullable: true, onDelete: 'SET NULL' })
    product?: Product | null;

    @Column({ nullable: true })
    productId: number;

    @ManyToOne(() => Category, (category) => category.media, { nullable: true, onDelete: 'SET NULL' })
    category?: Category | null;

    @Column({ nullable: true })
    categoryId: number;

    @ManyToOne(() => User, (user) => user.media, { nullable: true, onDelete: 'SET NULL' })
    user?: User | null

    @Column({ nullable: true })
    userId: number;

    @CreateDateColumn()
    createdAt: Date;
}
