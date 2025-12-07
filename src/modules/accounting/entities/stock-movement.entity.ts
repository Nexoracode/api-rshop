import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import {
  StockMovementType,
  StockMovementStatus,
  StockInReason,
  StockOutReason,
} from '../enums/warehouse.enum';
import { Product } from '../../product/entities/product.entity';
import { Warehouse } from './warehouse.entity';
import { User } from '../../user/entities/user.entity';
import { Order } from '../../order/entities/order.entity';

@Entity('stock_movements')
@Index(['type', 'status', 'movement_date'])
@Index(['product_id', 'warehouse_id', 'movement_date'])
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    comment: 'شماره حرکت انبار',
  })
  movement_number: string;

  @Column({
    type: 'enum',
    enum: StockMovementType,
    comment: 'نوع حرکت (ورود/خروج/انتقال/تنظیم)',
  })
  type: StockMovementType;

  @Column({
    type: 'enum',
    enum: StockMovementStatus,
    default: StockMovementStatus.PENDING,
    comment: 'وضعیت حرکت',
  })
  status: StockMovementStatus;

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
    comment: 'شناسه انبار مبدا',
  })
  warehouse_id: number;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.movements)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'شناسه انبار مقصد (در انتقالات)',
  })
  destination_warehouse_id: number | null;

  @ManyToOne(() => Warehouse, { nullable: true })
  @JoinColumn({ name: 'destination_warehouse_id' })
  destinationWarehouse: Warehouse | null;

  @Column({
    type: 'int',
    comment: 'تعداد',
  })
  quantity: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    comment: 'قیمت واحد',
  })
  unit_cost: number | null;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    comment: 'مبلغ کل',
  })
  total_cost: number | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'دلیل ورود به انبار',
  })
  reason_in: StockInReason | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'دلیل خروج از انبار',
  })
  reason_out: StockOutReason | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'شناسه سفارش مرتبط',
  })
  order_id: number | null;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'شماره رسید/فاکتور',
  })
  reference_number: string | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'توضیحات',
  })
  description: string | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'یادداشت‌های اضافی',
  })
  notes: string | null;

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
    comment: 'فایل‌های پیوست',
  })
  attachments: string[] | null;

  @Column({
    type: 'datetime',
    comment: 'تاریخ حرکت',
  })
  movement_date: Date;

  @Column({
    type: 'int',
    comment: 'شناسه کاربر ثبت‌کننده',
  })
  created_by: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'شناسه کاربر تایید‌کننده',
  })
  approved_by: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver: User | null;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: 'تاریخ تایید',
  })
  approved_at: Date | null;

  @Column({
    type: 'int',
    default: 0,
    comment: 'موجودی قبل از حرکت',
  })
  quantity_before: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'موجودی بعد از حرکت',
  })
  quantity_after: number;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'اطلاعات اضافی',
  })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
