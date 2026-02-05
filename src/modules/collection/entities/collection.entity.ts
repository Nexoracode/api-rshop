import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
    JoinTable,
    Index,
} from 'typeorm';
import { Product } from 'src/modules/product/entities/product.entity';

@Entity('collections')
export class Collection {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 191, unique: true })
    title: string;

    @Column({ type: 'varchar', length: 191, unique: true })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    image: string | null;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'display_order', type: 'int', default: 0 })
    displayOrder: number;

    @Column({ name: 'start_date', type: 'timestamp', nullable: true })
    startDate: Date | null;

    @Column({ name: 'end_date', type: 'timestamp', nullable: true })
    endDate: Date | null;

    @ManyToMany(() => Product, (product) => product.collections, { cascade: false })
    @JoinTable({
        name: 'collection_products',
        joinColumn: { name: 'collection_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' },
    })
    products: Product[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}