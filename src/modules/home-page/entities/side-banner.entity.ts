import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BannerPosition {
  TOP_RIGHT = 'top_right',
  MIDDLE_RIGHT = 'middle_right',
  BOTTOM_RIGHT = 'bottom_right',
  TOP_LEFT = 'top_left',
  MIDDLE_LEFT = 'middle_left',
  BOTTOM_LEFT = 'bottom_left',
}

@Entity('side_banners')
export class SideBanner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subtitle: string;

  @Column({ type: 'varchar', length: 500 })
  image_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  link: string;

  @Column({
    type: 'enum',
    enum: BannerPosition,
    default: BannerPosition.TOP_RIGHT,
  })
  position: BannerPosition;

  @Column({ type: 'varchar', length: 50, nullable: true })
  badge_text: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  badge_color: string;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
