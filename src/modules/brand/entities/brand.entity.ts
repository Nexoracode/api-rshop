import { Product } from "src/modules/product/entities/product.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('brands')
export class Brand {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true, default: '' })
    slug: string;

    @Column()
    logo: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean | true;

    @OneToMany(() => Product, product => product.brand)
    products: Product;
}
