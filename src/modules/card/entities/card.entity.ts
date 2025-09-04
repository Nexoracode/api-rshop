import { User } from "src/modules/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { CardItem } from "./card-item.entity";

export enum CardStatus {
    OPEN = 'open',
    LOCKED = 'locked',
    ABANDONED = 'abandoned',
}


@Entity('cards')
@Unique(['user'])
export class Card {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (u) => u.cards, { nullable: false, onDelete: 'CASCADE' })
    @Index('IDX_cards_user_id') // ← اگر این نام در جای دیگر هم استفاده شده، تغییرش بده
    @JoinColumn({ name: 'user_id' })
    user: User;


    @OneToMany(() => CardItem, (ci) => ci.card, { cascade: true })
    items: CardItem[];


    @Column({ type: 'enum', enum: CardStatus, default: CardStatus.OPEN })
    status: CardStatus;


    @Column({ type: 'int', default: 0 })
    itemsCount: number;


    @Column({ type: 'int', default: 0 })
    totalQuantity: number;


    @Column({ type: 'bigint', default: 0 })
    subtotal: number; // مجموع قیمت قبل از تخفیف


    @Column({ type: 'bigint', default: 0 })
    discountTotal: number; // مجموع تخفیف‌ها


    @Column({ type: 'bigint', default: 0 })
    total: number; // مبلغ نهایی پرداختی


    @CreateDateColumn()
    createdAt: Date;


    @UpdateDateColumn()
    updatedAt: Date;
}
