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

    @ManyToOne(() => Product, (product) => product.media, { nullable: true, onDelete: 'CASCADE' })
    product?: Product;

    @ManyToOne(() => Category, (category) => category.media, { nullable: true, onDelete: 'CASCADE' })
    category?: Category;

    @ManyToOne(() => User, (user) => user.media, { nullable: true, onDelete: 'CASCADE' })
    user?: User

    @CreateDateColumn()
    createdAt: Date;
}
