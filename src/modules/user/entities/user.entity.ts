import { Role } from "src/common/enums/role.enum";
import { Address } from "src/modules/address/entities/address.entity";
import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import * as bcrypt from 'bcrypt';
import { IUser } from "../interfaces/user.interface";
import { Media } from "src/modules/media/entities/image.entity";
import { Card } from "src/modules/card/entities/card.entity";
import { Order } from "src/modules/order/entities/order.entity";
import { Invoice } from "src/modules/invoice/entities/invoice.entity";
import { Review } from "src/modules/review/entities/review.entity";
import { Wishlist } from "src/modules/wishlist/entities/wishlist.entity";

@Entity('users')
export class User implements IUser {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
    firstName: string;

    @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
    lastName: string;

    @Column({ type: 'varchar', length: 11, unique: true, nullable: true })
    phone: string;

    @Column({ name: 'is_phone_verified', default: false })
    isPhoneVerified: boolean;

    @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 100, nullable: true, select: false })
    password: string;
    @BeforeInsert()
    @BeforeUpdate()
    async hashedPassword() {
        if (this.password) {
            this.password = await bcrypt.hash(this.password, 10);
        }
    }

    @Column({ type: 'enum', enum: Role, default: Role.USER, select: false })
    role: Role;

    @Column({ name: 'api_token', type: 'varchar', nullable: true, select: false })
    apiToken?: string | null;
    @BeforeInsert()
    @BeforeUpdate()
    async hashedApi() {
        if (this.apiToken) {
            this.apiToken = await bcrypt.hash(this.apiToken, 10);
        }
    }

    @OneToMany(() => Card, (c) => c.user)
    cards: Card[];

    @OneToMany(() => Order, (c) => c.user)
    orders: Order[];

    @OneToMany(() => Invoice, (invoice) => invoice.user)
    invoices: Invoice[];

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'email_verified_at', nullable: true })
    lastLoginAt: Date;

    @Column({ name: 'avatar_url', nullable: true })
    avatarUrl?: string;

    @OneToMany(() => Address, (address) => address.user, { cascade: true, eager: true })
    addresses: Address[];

    @OneToMany(() => Review, (review) => review.user, { cascade: true })
    reviews: Review[];

    @OneToMany(() => Wishlist, (wishlist) => wishlist.user)
    wishlists: Wishlist[];


    @OneToOne(() => Media, (media) => media.user)
    media: Media;

    @Column({ name: 'media_id', nullable: true })
    mediaId: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

}
