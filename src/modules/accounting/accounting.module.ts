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

// Services
import { TransactionService } from './services/transaction.service';
import { AccountService } from './services/account.service';
import { WarehouseService } from './services/warehouse.service';
import { StockMovementService } from './services/stock-movement.service';
import { ReportService } from './services/report.service';

// Controllers
import { TransactionController } from './controllers/transaction.controller';
// import { AccountController } from './controllers/account.controller';
// import { WarehouseController } from './controllers/warehouse.controller';
// import { StockMovementController } from './controllers/stock-movement.controller';
// import { ReportController } from './controllers/report.controller';

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
    ]),
  ],
  controllers: [
    TransactionController,
    // AccountController, // فعال کنید بعد از ایجاد
    // WarehouseController,
    // StockMovementController,
    // ReportController,
  ],
  providers: [
    TransactionService,
    AccountService,
    WarehouseService,
    StockMovementService,
    ReportService,
  ],
  exports: [
    TransactionService,
    AccountService,
    WarehouseService,
    StockMovementService,
    ReportService,
  ],
})
export class AccountingModule {}
