import { Product } from "src/modules/product/entities/product.entity";
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm"

@Entity('helpers')
export class HelperEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column({ nullable: true })
    image: string;

    @OneToOne(() => Product, product => product.helper, { nullable: true })
    product: Product;
}