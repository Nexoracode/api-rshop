# 🚀 راهنمای نصب و راه‌اندازی

## 📋 پیش‌نیازها

- ✅ NestJS نصب شده
- ✅ MySQL نصب شده
- ✅ TypeORM تنظیم شده

---

## 1️⃣ اضافه کردن به app.module.ts

```typescript
import { AccountingModule } from './modules/accounting/accounting.module';

@Module({
  imports: [
    // ... سایر ماژول‌ها
    AccountingModule, // ✅ اضافه کنید
  ],
})
export class AppModule {}
```

---

## 2️⃣ ایجاد Migration

### گام 1: ایجاد فایل Migration

```bash
npm run typeorm migration:create src/migrations/CreateAccountingTables
```

### گام 2: محتوای Migration

فایل migration را با محتوای زیر پر کنید:

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateAccountingTables1733580000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. جدول Accounts
    await queryRunner.createTable(
      new Table({
        name: 'accounting_accounts',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['BANK_ACCOUNT', 'CASH_BOX', 'WALLET', 'CREDIT_ACCOUNT'],
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '50',
            default: "'IRR'",
          },
          {
            name: 'initial_balance',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'current_balance',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'account_number',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'bank_name',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'iban',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'card_number',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
          },
          {
            name: 'settings',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 2. جدول Transactions
    await queryRunner.createTable(
      new Table({
        name: 'accounting_transactions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['INCOME', 'EXPENSE', 'TRANSFER'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
            default: "'PENDING'",
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'payment_method',
            type: 'enum',
            enum: ['CASH', 'CARD_TO_CARD', 'ONLINE_GATEWAY', 'CHEQUE', 'BANK_TRANSFER', 'CREDIT', 'WALLET'],
          },
          {
            name: 'account_id',
            type: 'int',
          },
          {
            name: 'destination_account_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'order_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reference_number',
            type: 'varchar',
            length: '100',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'attachments',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'transaction_date',
            type: 'datetime',
          },
          {
            name: 'created_by',
            type: 'int',
          },
          {
            name: 'approved_by',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'approved_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'rejection_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 3. جدول Warehouses
    await queryRunner.createTable(
      new Table({
        name: 'warehouses',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['MAIN', 'BRANCH', 'RETURN', 'DAMAGE', 'QUARANTINE'],
            default: "'MAIN'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
            default: "'ACTIVE'",
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'province',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'postal_code',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'manager_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'capacity',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'latitude',
            type: 'decimal',
            precision: 10,
            scale: 6,
            isNullable: true,
          },
          {
            name: 'longitude',
            type: 'decimal',
            precision: 10,
            scale: 6,
            isNullable: true,
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
          },
          {
            name: 'priority',
            type: 'int',
            default: 0,
          },
          {
            name: 'settings',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 4. جدول Product Stocks
    await queryRunner.createTable(
      new Table({
        name: 'product_stocks',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'product_id',
            type: 'int',
          },
          {
            name: 'warehouse_id',
            type: 'int',
          },
          {
            name: 'quantity',
            type: 'int',
            default: 0,
          },
          {
            name: 'reserved_quantity',
            type: 'int',
            default: 0,
          },
          {
            name: 'available_quantity',
            type: 'int',
            default: 0,
          },
          {
            name: 'min_quantity',
            type: 'int',
            default: 0,
          },
          {
            name: 'max_quantity',
            type: 'int',
            default: 0,
          },
          {
            name: 'reorder_point',
            type: 'int',
            default: 0,
          },
          {
            name: 'reorder_quantity',
            type: 'int',
            default: 0,
          },
          {
            name: 'average_cost',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'last_purchase_cost',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'last_stock_in_date',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'last_stock_out_date',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'alert_level',
            type: 'enum',
            enum: ['SUFFICIENT', 'LOW', 'CRITICAL', 'OUT_OF_STOCK'],
            default: "'SUFFICIENT'",
          },
          {
            name: 'location',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'batch_number',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'expiry_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 5. جدول Stock Movements
    await queryRunner.createTable(
      new Table({
        name: 'stock_movements',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'movement_number',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
            default: "'PENDING'",
          },
          {
            name: 'product_id',
            type: 'int',
          },
          {
            name: 'warehouse_id',
            type: 'int',
          },
          {
            name: 'destination_warehouse_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'quantity',
            type: 'int',
          },
          {
            name: 'unit_cost',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'total_cost',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'reason_in',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'reason_out',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'order_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'reference_number',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'batch_number',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'expiry_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'attachments',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'movement_date',
            type: 'datetime',
          },
          {
            name: 'created_by',
            type: 'int',
          },
          {
            name: 'approved_by',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'approved_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'quantity_before',
            type: 'int',
            default: 0,
          },
          {
            name: 'quantity_after',
            type: 'int',
            default: 0,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // ایجاد Index ها
    await queryRunner.createIndices('accounting_transactions', [
      new TableIndex({
        name: 'IDX_TRANSACTION_TYPE_STATUS_DATE',
        columnNames: ['type', 'status', 'transaction_date'],
      }),
      new TableIndex({
        name: 'IDX_TRANSACTION_ACCOUNT_DATE',
        columnNames: ['account_id', 'transaction_date'],
      }),
    ]);

    await queryRunner.createIndices('stock_movements', [
      new TableIndex({
        name: 'IDX_MOVEMENT_TYPE_STATUS_DATE',
        columnNames: ['type', 'status', 'movement_date'],
      }),
      new TableIndex({
        name: 'IDX_MOVEMENT_PRODUCT_WAREHOUSE_DATE',
        columnNames: ['product_id', 'warehouse_id', 'movement_date'],
      }),
    ]);

    await queryRunner.createIndex(
      'product_stocks',
      new TableIndex({
        name: 'IDX_PRODUCT_STOCK_ALERT',
        columnNames: ['alert_level'],
      }),
    );

    // ایجاد Unique Constraint
    await queryRunner.createIndex(
      'product_stocks',
      new TableIndex({
        name: 'UQ_PRODUCT_WAREHOUSE',
        columnNames: ['product_id', 'warehouse_id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('stock_movements');
    await queryRunner.dropTable('product_stocks');
    await queryRunner.dropTable('warehouses');
    await queryRunner.dropTable('accounting_transactions');
    await queryRunner.dropTable('accounting_accounts');
  }
}
```

### گام 3: اجرای Migration

```bash
npm run migration:run
```

---

## 3️⃣ داده‌های اولیه (Seed)

### ایجاد حساب پیش‌فرض:

```bash
POST /api/accounting/accounts
{
  "name": "حساب نقدی اصلی",
  "code": "ACC-001",
  "type": "CASH_BOX",
  "initialBalance": 0,
  "isDefault": true
}
```

### ایجاد انبار پیش‌فرض:

```bash
POST /api/accounting/warehouses
{
  "name": "انبار مرکزی",
  "code": "WH-001",
  "type": "MAIN",
  "city": "تهران",
  "isDefault": true
}
```

---

## 4️⃣ تست API ها

```bash
# دریافت لیست حساب‌ها
GET /api/accounting/accounts

# دریافت لیست انبارها
GET /api/accounting/warehouses

# دریافت لیست تراکنش‌ها
GET /api/accounting/transactions?page=1&limit=20

# دریافت گزارش سود و زیان
GET /api/accounting/reports/profit-loss?fromDate=2024-01-01&toDate=2024-12-31
```

---

## 5️⃣ Rollback در صورت نیاز

```bash
npm run migration:revert
```

---

## ✅ چک‌لیست نصب

- [ ] Module به app.module اضافه شد
- [ ] Migration ایجاد شد
- [ ] Migration اجرا شد
- [ ] جداول در دیتابیس ایجاد شدند
- [ ] حساب پیش‌فرض ایجاد شد
- [ ] انبار پیش‌فرض ایجاد شد
- [ ] API ها تست شدند
- [ ] Swagger Documentation کار می‌کند

---

**موفق باشید!** 🎉
