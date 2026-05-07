import { Product } from 'src/modules/product/entities/product.entity';
import { User } from 'src/modules/user/entities/user.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'reviews' })
export class Review {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'product_id', type: 'int' })
    productId!: number;

    @ManyToOne(() => Product, (product) => product.reviews, {
        onDelete: 'CASCADE',
    })
    product!: Product;

    @Column({ name: 'user_id', type: 'int' })
    userId!: number;

    @ManyToOne(() => User, (user) => user.reviews, {
        onDelete: 'CASCADE',
    })
    user!: User;

    @Column({ type: 'tinyint', default: 0 })
    rating!: number;

    @Column({ type: 'text', nullable: true })
    comment?: string;

    @Column({ name: 'is_approved', type: 'boolean', default: null, nullable: true })
    isApproved!: boolean | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
