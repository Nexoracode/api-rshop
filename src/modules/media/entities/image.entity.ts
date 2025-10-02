// entities/media.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
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

    @Column({ name: 'alt_text', nullable: true })
    altText?: string;

    @ManyToOne(() => Product, (product) => product.media, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'product_id' })
    product?: Product | null;

    @Column({ name: 'product_id', nullable: true })
    productId: number;

    @ManyToOne(() => Category, (category) => category.media, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'category_id' })
    category?: Category | null;

    @Column({ name: 'category_id', nullable: true })
    categoryId?: number;

    @ManyToOne(() => User, (user) => user.media, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user?: User | null

    @Column({ name: 'user_id', nullable: true })
    userId: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
