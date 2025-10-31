import { Product } from 'src/modules/product/entities/product.entity';
import { User } from 'src/modules/user/entities/user.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    Unique,
} from 'typeorm';

@Entity({ name: 'wishlists' })
@Unique(['userId', 'productId'])
export class Wishlist {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id', type: 'int' })
    userId: number;

    @ManyToOne(() => User, (user) => user.wishlists, {
        onDelete: 'CASCADE',
    })
    user: User;

    @Column({ name: 'product_id', type: 'int' })
    productId: number;

    @ManyToOne(() => Product, (product) => product.wishlists, {
        onDelete: 'CASCADE',
    })
    product: Product;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
