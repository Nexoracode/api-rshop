import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FaqCategoryEntity } from './faq-category.entity';

@Entity('faqs')
export class FaqEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  question: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ name: 'faq_category_id', nullable: true })
  faqCategoryId: number | null;

  @ManyToOne(() => FaqCategoryEntity, (cat) => cat.faqs, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'faq_category_id' })
  faqCategory: FaqCategoryEntity | null;

  @Column({ default: 0 })
  displayOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  viewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
