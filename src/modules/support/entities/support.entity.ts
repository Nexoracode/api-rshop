import { User } from 'src/modules/user/entities/user.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Message } from './message.entity';
import { Product } from 'src/modules/product/entities/product.entity';

export enum SupportStatus {
    OPEN = 'open',        // گفتگو تازه ایجاد شده
    WAITING = 'waiting',  // منتظر پاسخ ادمین
    ANSWERED = 'answered',// پاسخ داده شده توسط ادمین
    CLOSED = 'closed',    // بسته شده
}

@Entity({ name: 'supports' })
export class Support {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id', type: 'int' })
    userId: number;

    @ManyToOne(() => User, (user) => user.supports, { onDelete: 'CASCADE' })
    user: User;

    // 👇 ارتباط اختیاری با محصول
    @Column({ name: 'product_id', type: 'int', nullable: true })
    productId?: number;

    @ManyToOne(() => Product, (product) => product.supports, {
        onDelete: 'SET NULL',
    })
    product?: Product;

    @Column({ type: 'varchar', length: 255 })
    subject: string;

    @Column({ type: 'enum', enum: SupportStatus, default: SupportStatus.OPEN })
    status: SupportStatus;

    @OneToMany(() => Message, (message) => message.support, { cascade: true })
    messages: Message[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
