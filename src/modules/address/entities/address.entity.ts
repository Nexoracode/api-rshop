import { User } from "src/modules/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { IAddress } from "../interfaces/address.interface";

@Entity('addresses')
export class Address implements IAddress {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    city!: string;

    @Column()
    cityId!: number

    @Column()
    province!: string;

    @Column({ nullable: true })
    plaque?: string;

    @Column({ nullable: true })
    unit?: string;

    @Column({ name: 'address_line', nullable: true })
    addressLine!: string;

    @Column({ name: 'address_name', nullable: true })
    addressName!: string;

    @Column({ name: 'recipient_name', nullable: true })
    recipientName!: string;

    @Column({ name: 'recipient_phone', nullable: true })
    recipientPhone!: string;

    @Column({ name: 'is_self', default: true })
    isSelf!: boolean;

    @Column({ unique: true, name: 'postal_code' })
    postalCode!: string;

    @Column({ name: 'is_primary', default: true })
    isPrimary!: boolean;

    @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ type: 'int', name: 'user_id' })
    userId!: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
