import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SectionType {
  FEATURED = 'featured', // محصولات ویژه
  SPECIAL_PRODUCTS = 'special_products', // محصولات ویژه با فیلتر دستی
  MOST_POPULAR = 'most_popular', // محبوب‌ترین محصولات
  CATEGORY_BASED = 'category_based', // بر اساس دسته‌بندی
}

export enum SectionDisplayStyle {
  GRID = 'grid',
  CAROUSEL = 'carousel',
  LIST = 'list',
}

@Entity('home_sections')
export class HomeSection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: SectionType,
    default: SectionType.FEATURED,
  })
  section_type: SectionType;

  @Column({
    type: 'enum',
    enum: SectionDisplayStyle,
    default: SectionDisplayStyle.CAROUSEL,
  })
  display_style: SectionDisplayStyle;

  // برای بخش‌های دستی - آیدی محصولات
  @Column({ type: 'json', nullable: true })
  product_ids: number[];

  // برای بخش‌های بر اساس دسته‌بندی
  @Column({ type: 'int', nullable: true })
  category_id: number;

  @Column({ type: 'int', default: 10 })
  products_limit: number;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  show_view_all_button: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  view_all_link: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
