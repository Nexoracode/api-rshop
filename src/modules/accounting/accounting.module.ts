import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Transaction } from './entities/transaction.entity';
import { Account } from './entities/account.entity';
import { Warehouse } from './entities/warehouse.entity';
import { ProductStock } from './entities/product-stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { Product } from '../product/entities/product.entity';
import { Order } from '../order/entities/order.entity';
import { User } from '../user/entities/user.entity';
import { Payment } from '../payment/entities/payment.entity';

// Services
import { TransactionService } from './services/transaction.service';
import { AccountService } from './services/account.service';
import { WarehouseService } from './services/warehouse.service';
import { StockMovementService } from './services/stock-movement.service';
import { ReportService } from './services/report.service';
import { OrderAccountingService } from './services/order-accounting.service';

// Controllers
import { TransactionController } from './controllers/transaction.controller';

// Listeners
import { OrderAccountingListener } from './listeners/order-accounting.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Accounting Entities
      Transaction,
      Account,
      Warehouse,
      ProductStock,
      StockMovement,
      // Related Entities
      Product,
      Order,
      User,
      Payment,
    ]),
  ],
  controllers: [
    TransactionController,
    // سایر Controller ها را بعداً فعال کنید
  ],
  providers: [
    // Services
    TransactionService,
    AccountService,
    WarehouseService,
    StockMovementService,
    ReportService,
    OrderAccountingService,
    // Listeners
    OrderAccountingListener,
  ],
  exports: [
    TransactionService,
    AccountService,
    WarehouseService,
    StockMovementService,
    ReportService,
    OrderAccountingService, // ✅ Export کردن برای استفاده در ماژول‌های دیگر
  ],
})
export class AccountingModule {}
