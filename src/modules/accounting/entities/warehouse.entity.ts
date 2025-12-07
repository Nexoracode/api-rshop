import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { WarehouseType, WarehouseStatus } from '../enums/warehouse.enum';
import { StockMovement } from './stock-movement.entity';
import { ProductStock } from './product-stock.entity';

@Entity('warehouses')
@Index(['status', 'type'])
export class Warehouse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    comment: 'نام انبار',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    comment: 'کد انبار',
  })
  code: string;

  @Column({
    type: 'enum',
    enum: WarehouseType,
    default: WarehouseType.MAIN,
    comment: 'نوع انبار',
  })
  type: WarehouseType;

  @Column({
    type: 'enum',
    enum: WarehouseStatus,
    default: WarehouseStatus.ACTIVE,
    comment: 'وضعیت انبار',
  })
  status: WarehouseStatus;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'توضیحات انبار',
  })
  description: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'آدرس فیزیکی انبار',
  })
  address: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'شهر',
  })
  city: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'استان',
  })
  province: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'کد پستی',
  })
  postal_code: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'شماره تماس',
  })
  phone: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'نام مدیر انبار',
  })
  manager_name: string | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'ظرفیت انبار (به متر مربع یا تعداد آیتم)',
  })
  capacity: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 6,
    nullable: true,
    comment: 'عرض جغرافیایی',
  })
  latitude: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 6,
    nullable: true,
    comment: 'طول جغرافیایی',
  })
  longitude: number | null;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'انبار پیش‌فرض',
  })
  is_default: boolean;

  @Column({
    type: 'int',
    default: 0,
    comment: 'اولویت نمایش',
  })
  priority: number;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'تنظیمات اضافی',
  })
  settings: Record<string, any> | null;

  @OneToMany(() => StockMovement, (movement) => movement.warehouse)
  movements: StockMovement[];

  @OneToMany(() => ProductStock, (stock) => stock.warehouse)
  productStocks: ProductStock[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
