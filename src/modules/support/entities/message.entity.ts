import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';
import { Support } from './support.entity';
import { User } from 'src/modules/user/entities/user.entity';

@Entity({ name: 'support_messages' })
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'support_id', type: 'int' })
    supportId: number;

    @ManyToOne(() => Support, (support) => support.messages, {
        onDelete: 'CASCADE',
    })
    support: Support;

    @Column({ name: 'sender_id', type: 'int' })
    senderId: number;

    @ManyToOne(() => User, (user) => user.messages, { onDelete: 'CASCADE' })
    sender: User;

    @Column({ type: 'text' })
    content: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
