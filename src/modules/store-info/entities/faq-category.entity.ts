import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FaqEntity } from './faq.entity';
import { Icon } from 'src/modules/icon/entities/icon.entity';

@Entity('faq_categories')
export class FaqCategoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ name: 'icon_id', nullable: true })
  iconId: number | null;

  @ManyToOne(() => Icon, (icon) => icon.faqCategories, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'icon_id' })
  icon: Icon | null;

  @Column({ default: 0 })
  displayOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => FaqEntity, (faq) => faq.faqCategory)
  faqs: FaqEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
