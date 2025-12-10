import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ClickElementType {
  HERO_SLIDER = 'hero_slider',
  SIDE_BANNER = 'side_banner',
}

@Entity('homepage_click_analytics')
@Index(['elementType', 'elementId'])
@Index(['clickedAt'])
export class HomePageClickAnalytics {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ClickElementType,
  })
  elementType: ClickElementType;

  @Column({ type: 'int' })
  elementId: number;

  @CreateDateColumn({ type: 'timestamp' })
  clickedAt: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  userIp: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;
}
