import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StoreInfoStatus, StoreInfoType } from '../enums/store-info.enum';

@Entity('store_info')
export class StoreInfoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: StoreInfoType, unique: true })
  type: StoreInfoType;

  @Column()
  title: string;

  @Column({ type: 'longtext' })
  content: string;

  @Column({ nullable: true })
  metaTitle: string;

  @Column({ nullable: true })
  metaDescription: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
