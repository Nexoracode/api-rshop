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
  PROMOTION_BASED = 'promotion_based', // بر اساس پروموشن
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

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string | null;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: SectionType,
    default: SectionType.FEATURED,
  })
  sectionType: SectionType;

  @Column({
    type: 'enum',
    enum: SectionDisplayStyle,
    default: SectionDisplayStyle.CAROUSEL,
  })
  displayStyle: SectionDisplayStyle;

  // برای بخش‌های دستی - آیدی محصولات
  @Column({ type: 'json', nullable: true })
  productIds: number[];

  // برای بخش‌های بر اساس دسته‌بندی
  @Column({ type: 'int', nullable: true })
  categoryId: number;

  @Column({ type: 'int', default: 10 })
  productsLimit: number;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  showViewAllButton: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  viewAllLink: string;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
