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
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  IncomeCategory,
  ExpenseCategory,
} from '../enums/transaction.enum';
import { User } from '../../user/entities/user.entity';
import { Order } from '../../order/entities/order.entity';
import { Account } from './account.entity';

@Entity('accounting_transactions')
@Index(['type', 'status', 'transaction_date'])
@Index(['account_id', 'transaction_date'])
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
    comment: 'نوع تراکنش (درآمد/هزینه/انتقال)',
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
    comment: 'وضعیت تراکنش',
  })
  status: TransactionStatus;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    comment: 'مبلغ تراکنش',
  })
  amount: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'دسته‌بندی درآمد یا هزینه',
  })
  category: IncomeCategory | ExpenseCategory | null;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    comment: 'روش پرداخت',
  })
  payment_method: PaymentMethod;

  @Column({
    type: 'int',
    comment: 'شناسه حساب',
  })
  account_id: number;

  // ✅ اضافه کردن Relation به Account
  @ManyToOne(() => Account, (account) => account.transactions)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'شناسه حساب مقصد (در انتقالات)',
  })
  destination_account_id: number | null;

  // ✅ اضافه کردن Relation به حساب مقصد
  @ManyToOne(() => Account, { nullable: true })
  @JoinColumn({ name: 'destination_account_id' })
  destinationAccount: Account | null;

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
    length: 500,
    comment: 'توضیحات تراکنش',
  })
  description: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'یادداشت‌های اضافی',
  })
  notes: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    unique: true,
    comment: 'شماره رسید/مرجع تراکنش',
  })
  reference_number: string | null;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'فایل‌های پیوست (رسید، فاکتور و ...)',
  })
  attachments: string[] | null;

  @Column({
    type: 'datetime',
    comment: 'تاریخ تراکنش',
  })
  transaction_date: Date;

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
    type: 'text',
    nullable: true,
    comment: 'دلیل رد یا کنسلی',
  })
  rejection_reason: string | null;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'اطلاعات اضافی (metadata)',
  })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
