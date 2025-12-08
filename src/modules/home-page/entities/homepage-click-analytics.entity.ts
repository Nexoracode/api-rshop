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
@Index(['element_type', 'element_id'])
@Index(['clicked_at'])
export class HomePageClickAnalytics {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ClickElementType,
  })
  element_type: ClickElementType;

  @Column({ type: 'int' })
  element_id: number;

  @CreateDateColumn({ type: 'timestamp' })
  clicked_at: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  user_ip: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string;
}
