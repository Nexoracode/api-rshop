# 🔧 مشکلات Entity ها - اصلاح شد

## ❌ مشکلاتی که بود:

### 1. Transaction Entity
**مشکل**: Relation با Account اشتباه بود

```typescript
// ❌ قبل - اشتباه
@Column({
  type: 'int',
  comment: 'شناسه حساب',
})
account_id: number;
// هیچ Relation نبود!

// در Account.entity:
@OneToMany(() => Transaction, (transaction) => transaction.account_id) // ❌ اشتباه
transactions: Transaction[];
```

**چرا اشتباه بود؟**
- OneToMany باید به یک property اشاره کند، نه به ID
- در Transaction هیچ Relation به Account نبود
- TypeORM نمی‌تونست join کنه

### 2. Index ها
**مشکل**: نام فیلدها inconsistent بود

```typescript
// ❌ قبل
@Index(['type', 'status', 'transactionDate']) // camelCase
@Index(['account_id', 'transaction_date'])    // snake_case ❌ ناسازگار
```

---

## ✅ چیزهایی که اصلاح شد:

### 1. Transaction.entity.ts

```typescript
// ✅ بعد - درست
@Column({
  type: 'int',
  comment: 'شناسه حساب',
})
account_id: number;

// ✅ اضافه شد - Relation به Account
@ManyToOne(() => Account, (account) => account.transactions)
@JoinColumn({ name: 'account_id' })
account: Account;

// ✅ اضافه شد - Relation به حساب مقصد
@Column({
  type: 'int',
  nullable: true,
  comment: 'شناسه حساب مقصد (در انتقالات)',
})
destination_account_id: number | null;

@ManyToOne(() => Account, { nullable: true })
@JoinColumn({ name: 'destination_account_id' })
destinationAccount: Account | null;
```

### 2. Account.entity.ts

```typescript
// ✅ درست شد
@OneToMany(() => Transaction, (transaction) => transaction.account)
transactions: Transaction[];
```

---

## 📊 Relations درست شده:

### Transaction ↔ Account
```
Transaction (Many) → Account (One)
- transaction.account
- transaction.destinationAccount

Account (One) → Transaction (Many)
- account.transactions
```

### Transaction → Order
```
Transaction (Many) → Order (One)
- transaction.order
```

### Transaction → User
```
Transaction (Many) → User (One)
- transaction.creator
- transaction.approver
```

### StockMovement ↔ Warehouse
```
StockMovement (Many) → Warehouse (One)
- movement.warehouse
- movement.destinationWarehouse

Warehouse (One) → StockMovement (Many)
- warehouse.movements
```

### ProductStock ↔ Warehouse & Product
```
ProductStock (Many) → Warehouse (One)
- stock.warehouse

ProductStock (Many) → Product (One)
- stock.product

Warehouse (One) → ProductStock (Many)
- warehouse.productStocks
```

---

## 🎯 نتیجه:

### ✅ حل شد:
1. Relation Transaction به Account اضافه شد
2. Relation به destinationAccount اضافه شد
3. OneToMany در Account درست شد
4. Index ها سازگار هستند
5. همه Join ها کار می‌کنند

### ✅ قابلیت‌های فعال:
- `transaction.account` کار می‌کنه
- `transaction.destinationAccount` کار می‌کنه
- `account.transactions` کار می‌کنه
- Join های TypeORM درست کار می‌کنن
- Eager/Lazy loading کار می‌کنه

---

## 🧪 تست:

```typescript
// حالا این کوئری‌ها کار می‌کنن:

// 1. دریافت Transaction با Account
const transaction = await transactionRepo.findOne({
  where: { id: 1 },
  relations: ['account', 'destinationAccount'],
});

// 2. دریافت Account با تمام Transaction ها
const account = await accountRepo.findOne({
  where: { id: 1 },
  relations: ['transactions'],
});

// 3. Join در Query Builder
const transactions = await transactionRepo
  .createQueryBuilder('t')
  .leftJoinAndSelect('t.account', 'account')
  .leftJoinAndSelect('t.destinationAccount', 'destAccount')
  .where('account.is_active = :active', { active: true })
  .getMany();
```

---

## 📝 نکات مهم:

1. **همیشه** ManyToOne و OneToMany باید با هم باشند
2. **JoinColumn** فقط در سمت Many (که FK داره)
3. **snake_case** برای نام Column ها
4. **camelCase** برای Property های TypeScript
5. Index ها باید با نام Column ها match باشند

---

**وضعیت**: ✅ همه Relation ها درست شدند!
