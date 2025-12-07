import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Product } from '../../product/entities/product.entity';
import { Warehouse } from './warehouse.entity';
import { StockAlertLevel } from '../enums/warehouse.enum';

@Entity('product_stocks')
@Unique(['product_id', 'warehouse_id']) // ✅ فقط Unique کافیه - خودش Index هم ایجاد می‌کنه
@Index(['alert_level']) // ✅ Index جداگانه فقط برای alert_level
export class ProductStock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'int',
    comment: 'شناسه محصول',
  })
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({
    type: 'int',
    comment: 'شناسه انبار',
  })
  warehouse_id: number;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.productStocks)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column({
    type: 'int',
    default: 0,
    comment: 'موجودی فعلی',
  })
  quantity: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'موجودی رزرو شده',
  })
  reserved_quantity: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'موجودی قابل فروش',
  })
  available_quantity: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'حداقل موجودی مجاز',
  })
  min_quantity: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'حداکثر موجودی مجاز',
  })
  max_quantity: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'نقطه سفارش مجدد',
  })
  reorder_point: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'تعداد سفارش اقتصادی (EOQ)',
  })
  reorder_quantity: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    comment: 'قیمت خرید میانگین',
  })
  average_cost: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    comment: 'آخرین قیمت خرید',
  })
  last_purchase_cost: number;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: 'تاریخ آخرین ورود',
  })
  last_stock_in_date: Date | null;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: 'تاریخ آخرین خروج',
  })
  last_stock_out_date: Date | null;

  @Column({
    type: 'enum',
    enum: StockAlertLevel,
    default: StockAlertLevel.SUFFICIENT,
    comment: 'سطح هشدار موجودی',
  })
  alert_level: StockAlertLevel;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'محل قرارگیری در انبار (شماره قفسه/ردیف)',
  })
  location: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'شماره Batch/Lot',
  })
  batch_number: string | null;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'تاریخ انقضا',
  })
  expiry_date: Date | null;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'اطلاعات اضافی موجودی',
  })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
