import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { AccountType } from '../enums/transaction.enum';
import { Transaction } from './transaction.entity';

@Entity('accounting_accounts')
@Index(['type', 'is_active'])
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    comment: 'نام حساب',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    comment: 'کد حساب',
  })
  code: string;

  @Column({
    type: 'enum',
    enum: AccountType,
    comment: 'نوع حساب',
  })
  type: AccountType;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'واحد پول (IRR, USD, EUR)',
    default: 'IRR',
  })
  currency: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    comment: 'موجودی اولیه',
  })
  initial_balance: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    comment: 'موجودی فعلی',
  })
  current_balance: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'توضیحات حساب',
  })
  description: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'شماره حساب بانکی',
  })
  account_number: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'نام بانک',
  })
  bank_name: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'شماره شبا',
  })
  iban: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'شماره کارت',
  })
  card_number: string | null;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'فعال/غیرفعال',
  })
  is_active: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'حساب پیش‌فرض',
  })
  is_default: boolean;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'تنظیمات اضافی',
  })
  settings: Record<string, any> | null;

  // ✅ درست کردن Relation
  @OneToMany(() => Transaction, (transaction) => transaction.account)
  transactions: Transaction[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
