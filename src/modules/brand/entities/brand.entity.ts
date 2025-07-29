import { Product } from "src/modules/product/entities/product.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('brands')
export class Brand {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column()
    slug: string;

    @Column()
    logo: string;

    @OneToMany(() => Product, product => product.brand)
    products: Product;
}
