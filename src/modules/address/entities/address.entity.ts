import { User } from "src/modules/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { IAddress } from "../interfaces/address.interface";

@Entity('addresses')
export class Address implements IAddress {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    city: string;

    @Column()
    province: string;

    @Column({ name: 'address_line' })
    addressLine: string;

    @Column({ unique: true, name: 'postal_code' })
    postalCode: string;

    @Column({ name: 'is_primary', default: true })
    isPrimary: boolean;

    @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
