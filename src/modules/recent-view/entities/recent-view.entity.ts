import { Product } from 'src/modules/product/entities/product.entity';
import { User } from 'src/modules/user/entities/user.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
} from 'typeorm';

@Entity({ name: 'recent_views' })
@Unique(['userId', 'productId'])
export class RecentView {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id', type: 'int' })
    userId: number;

    @ManyToOne(() => User, (user) => user.recentViews, {
        onDelete: 'CASCADE',
    })
    user: User;

    @Column({ name: 'product_id', type: 'int' })
    productId: number;

    @ManyToOne(() => Product, (product) => product.recentViews, {
        onDelete: 'CASCADE',
    })
    product: Product;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
