import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Media } from 'src/modules/media/entities/image.entity';
import { GiftWrappingStatus } from '../enums/gift-wrapping-status.enum';

@Entity('gift_wrappings')
export class GiftWrapping {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'bigint' })
    price: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @ManyToOne(() => Media, { eager: true, nullable: true })
    @JoinColumn({ name: 'image_id' })
    image?: Media;

    @Column({ name: 'image_id', nullable: true })
    imageId?: number;

    @Column({ name: 'is_for_gift', default: true })
    isForGift: boolean;

    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
