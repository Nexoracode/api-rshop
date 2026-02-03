import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('promo_banners')
export class PromoBanner {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 191 })
    title: string;

    @Column({ type: 'varchar', length: 500 })
    imageUrl: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    link: string | null;

    @Column({ name: 'link_text', type: 'varchar', length: 100, nullable: true })
    linkText: string | null;

    @Column({ name: 'background_color', type: 'varchar', length: 20, nullable: true })
    backgroundColor: string | null;

    @Column({ name: 'text_color', type: 'varchar', length: 20, nullable: true })
    textColor: string | null;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'is_closable', type: 'boolean', default: true })
    isClosable: boolean;

    @Column({ name: 'display_order', type: 'int', default: 0 })
    @Index('IDX_PROMO_BANNER_PRIORITY')
    displayOrder: number;

    @Column({ name: 'start_date', type: 'timestamp', nullable: true })
    startDate: Date | null;

    @Column({ name: 'end_date', type: 'timestamp', nullable: true })
    endDate: Date | null;

    @Column({ name: 'display_duration', type: 'int', nullable: true, comment: 'مدت نمایش به ثانیه (null = همیشه)' })
    displayDuration: number | null;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}