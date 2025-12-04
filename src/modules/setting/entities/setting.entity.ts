import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SettingCategory } from '../enums/setting-category.enum';

@Entity('settings')
export class Setting {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    key: string;

    @Column({ type: 'text' })
    value: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({
        type: 'enum',
        enum: SettingCategory,
        default: SettingCategory.GENERAL,
    })
    category: SettingCategory;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
