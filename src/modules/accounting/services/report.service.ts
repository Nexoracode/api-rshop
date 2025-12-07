import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { ProductStock } from '../entities/product-stock.entity';
import { Account } from '../entities/account.entity';
import { Warehouse } from '../entities/warehouse.entity';
import {
  TransactionType,
  TransactionStatus,
  IncomeCategory,
  ExpenseCategory,
} from '../enums/transaction.enum';
import {
  StockMovementType,
  StockAlertLevel,
} from '../enums/warehouse.enum';
import {
  ITransactionReport,
  ITransactionSummary,
  ICategorizedTransactions,
} from '../interfaces/transaction.interface';
import {
  IInventoryReport,
  IProductStock,
  IWarehouseStock,
} from '../interfaces/inventory.interface';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(StockMovement)
    private readonly movementRepository: Repository<StockMovement>,
    @InjectRepository(ProductStock)
    private readonly stockRepository: Repository<ProductStock>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
  ) { }

  /**
   * گزارش کامل تراکنش‌ها
   */
  async getTransactionReport(
    fromDate: Date,
    toDate: Date,
  ): Promise<ITransactionReport> {
    const transactions = await this.transactionRepository.find({
      where: {
        status: TransactionStatus.APPROVED,
        transaction_date: Between(fromDate, toDate),
      },
      order: { transaction_date: 'ASC' },
    });

    // خلاصه کلی
    const summary = this.calculateTransactionSummary(transactions);

    // دسته‌بندی شده
    const categorized = this.categorizeTransactions(transactions);

    // روزانه
    const daily = this.groupByDay(transactions);

    // ماهانه
    const monthly = this.groupByMonth(transactions);

    return {
      summary,
      categorized,
      daily,
      monthly,
    };
  }

  /**
   * گزارش سود و زیان
   */
  async getProfitLossReport(fromDate: Date, toDate: Date) {
    const transactions = await this.transactionRepository.find({
      where: {
        status: TransactionStatus.APPROVED,
        transaction_date: Between(fromDate, toDate),
      },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};

    transactions.forEach(t => {
      const amount = Number(t.amount);

      if (t.type === TransactionType.INCOME) {
        totalIncome += amount;
        const category = t.category || 'OTHER_INCOME';
        incomeByCategory[category] = (incomeByCategory[category] || 0) + amount;
      } else if (t.type === TransactionType.EXPENSE) {
        totalExpense += amount;
        const category = t.category || 'OTHER_EXPENSE';
        expenseByCategory[category] = (expenseByCategory[category] || 0) + amount;
      }
    });

    const grossProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;

    return {
      period: {
        from: fromDate,
        to: toDate,
      },
      summary: {
        totalIncome,
        totalExpense,
        grossProfit,
        profitMargin: Number(profitMargin.toFixed(2)),
      },
      income: {
        total: totalIncome,
        byCategory: incomeByCategory,
      },
      expense: {
        total: totalExpense,
        byCategory: expenseByCategory,
      },
    };
  }

  /**
   * گزارش جریان نقدی
   */
  async getCashFlowReport(fromDate: Date, toDate: Date) {
    const transactions = await this.transactionRepository.find({
      where: {
        status: TransactionStatus.APPROVED,
        transaction_date: Between(fromDate, toDate),
      },
      relations: ['account'],
      order: { transaction_date: 'ASC' },
    });

    const cashFlow = transactions.map(t => {
      const amount = Number(t.amount);
      let inflow = 0;
      let outflow = 0;

      if (t.type === TransactionType.INCOME) {
        inflow = amount;
      } else if (t.type === TransactionType.EXPENSE) {
        outflow = amount;
      }

      return {
        date: t.transaction_date,
        description: t.description,
        category: t.category,
        inflow,
        outflow,
        balance: inflow - outflow,
      };
    });

    // محاسبه موجودی انباشته
    let cumulativeBalance = 0;
    const flowWithCumulative = cashFlow.map(item => {
      cumulativeBalance += item.balance;
      return {
        ...item,
        cumulativeBalance,
      };
    });

    const totalInflow = cashFlow.reduce((sum, item) => sum + item.inflow, 0);
    const totalOutflow = cashFlow.reduce((sum, item) => sum + item.outflow, 0);

    return {
      period: { from: fromDate, to: toDate },
      summary: {
        totalInflow,
        totalOutflow,
        netCashFlow: totalInflow - totalOutflow,
      },
      details: flowWithCumulative,
    };
  }

  /**
   * گزارش موجودی کالا
   */
  async getInventoryReport(): Promise<IInventoryReport> {
    const stocks = await this.stockRepository.find({
      relations: ['product', 'warehouse'],
      order: { quantity: 'DESC' },
    });

    const warehouses = await this.warehouseRepository.find();

    // خلاصه کلی
    const totalProducts = stocks.length;
    const totalValue = stocks.reduce(
      (sum, s) => sum + (s.quantity * Number(s.average_cost)),
      0,
    );
    const lowStockProducts = stocks.filter(
      s => s.alert_level === StockAlertLevel.LOW ||
        s.alert_level === StockAlertLevel.CRITICAL
    ).length;
    const outOfStockProducts = stocks.filter(
      s => s.alert_level === StockAlertLevel.OUT_OF_STOCK
    ).length;
    const overStockProducts = stocks.filter(
      s => s.max_quantity > 0 && s.quantity > s.max_quantity
    ).length;

    // موجودی به تفکیک انبار
    const byWarehouse: IWarehouseStock[] = warehouses.map(w => {
      const warehouseStocks = stocks.filter(s => s.warehouse_id === w.id);
      const totalItems = warehouseStocks.reduce((sum, s) => sum + s.quantity, 0);
      const uniqueProducts = warehouseStocks.filter(s => s.quantity > 0).length;
      const totalValue = warehouseStocks.reduce(
        (sum, s) => sum + (s.quantity * Number(s.average_cost)),
        0,
      );

      return {
        warehouseId: w.id,
        warehouseName: w.name,
        status: w.status,
        totalItems,
        uniqueProducts,
        totalValue,
        capacity: w.capacity ?? undefined,
        fillPercentage: w.capacity ? (totalItems / w.capacity) * 100 : undefined,
      };
    });

    // محصولات کم موجود
    const lowStockProductsList: IProductStock[] = stocks
      .filter(s =>
        s.alert_level === StockAlertLevel.LOW ||
        s.alert_level === StockAlertLevel.CRITICAL
      )
      .map(s => this.mapToProductStock(s));

    return {
      summary: {
        totalProducts,
        totalValue,
        lowStockProducts,
        outOfStockProducts,
        overStockProducts,
      },
      byWarehouse,
      lowStockProducts: lowStockProductsList,
      topSellingProducts: [], // نیاز به query جداگانه
      slowMovingProducts: [], // نیاز به query جداگانه
    };
  }

  /**
   * گزارش حرکت‌های انبار
   */
  async getStockMovementReport(fromDate: Date, toDate: Date) {
    const movements = await this.movementRepository.find({
      where: {
        movement_date: Between(fromDate, toDate), // نیاز به بررسی
      },
      relations: ['product', 'warehouse'],
      order: { movement_date: 'DESC' },
    });

    let totalIn = 0;
    let totalOut = 0;
    let totalTransfer = 0;
    let totalAdjustment = 0;
    let totalInValue = 0;
    let totalOutValue = 0;

    movements.forEach(m => {
      const value = m.unit_cost ? m.quantity * Number(m.unit_cost) : 0;

      switch (m.type) {
        case StockMovementType.IN:
          totalIn += m.quantity;
          totalInValue += value;
          break;
        case StockMovementType.OUT:
          totalOut += m.quantity;
          totalOutValue += value;
          break;
        case StockMovementType.TRANSFER:
          totalTransfer += m.quantity;
          break;
        case StockMovementType.ADJUSTMENT:
          totalAdjustment += m.quantity;
          break;
      }
    });

    return {
      period: { from: fromDate, to: toDate },
      summary: {
        totalIn,
        totalOut,
        totalTransfer,
        totalAdjustment,
        totalInValue,
        totalOutValue,
      },
      details: movements.map(m => ({
        id: m.id,
        movementNumber: m.movement_number,
        type: m.type,
        productName: m.product?.name,
        warehouseName: m.warehouse?.name,
        quantity: m.quantity,
        unitCost: m.unit_cost ? Number(m.unit_cost) : null,
        totalCost: m.total_cost ? Number(m.total_cost) : null,
        movementDate: m.movement_date,
      })),
    };
  }

  /**
   * گزارش محصولات پرفروش
   */
  async getTopSellingProducts(limit = 10, fromDate?: Date, toDate?: Date) {
    const where: any = {
      type: StockMovementType.OUT,
      status: TransactionStatus.APPROVED,
      reason_out: 'SALE',
    };

    if (fromDate || toDate) {
      where.movement_date = Between(
        fromDate || new Date('2000-01-01'),
        toDate || new Date(),
      );
    }

    const movements = await this.movementRepository.find({
      where,
      relations: ['product'],
    });

    // گروه‌بندی بر اساس محصول
    const productSales: Record<number, {
      productId: number;
      productName: string;
      soldQuantity: number;
      revenue: number;
    }> = {};

    movements.forEach(m => {
      if (!productSales[m.product_id]) {
        productSales[m.product_id] = {
          productId: m.product_id,
          productName: m.product?.name || '',
          soldQuantity: 0,
          revenue: 0,
        };
      }

      productSales[m.product_id].soldQuantity += m.quantity;
      if (m.unit_cost) {
        productSales[m.product_id].revenue += m.quantity * Number(m.unit_cost);
      }
    });

    // مرتب‌سازی و محدود کردن
    return Object.values(productSales)
      .sort((a, b) => b.soldQuantity - a.soldQuantity)
      .slice(0, limit);
  }

  /**
   * گزارش محصولات کم فروش
   */
  async getSlowMovingProducts(daysThreshold = 90) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    const stocks = await this.stockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .where('stock.quantity > 0')
      .andWhere(
        `stock.last_stock_out_date IS NULL OR stock.last_stock_out_date < :threshold`,
        { threshold: thresholdDate },
      )
      .orderBy('stock.quantity', 'DESC')
      .getMany();

    return stocks.map(s => {
      const daysInStock = s.last_stock_out_date
        ? Math.floor(
          (Date.now() - s.last_stock_out_date.getTime()) / (1000 * 60 * 60 * 24)
        )
        : 999;

      return {
        productId: s.product_id,
        productName: s.product?.name,
        daysInStock,
        currentStock: s.quantity,
        estimatedValue: s.quantity * Number(s.average_cost),
      };
    });
  }

  /**
   * محاسبه خلاصه تراکنش‌ها
   */
  private calculateTransactionSummary(
    transactions: Transaction[],
  ): ITransactionSummary {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      const amount = Number(t.amount);
      if (t.type === TransactionType.INCOME) {
        totalIncome += amount;
      } else if (t.type === TransactionType.EXPENSE) {
        totalExpense += amount;
      }
    });

    return {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      transactionCount: transactions.length,
      averageTransaction:
        transactions.length > 0
          ? (totalIncome + totalExpense) / transactions.length
          : 0,
    };
  }

  /**
   * دسته‌بندی تراکنش‌ها
   */
  private categorizeTransactions(
    transactions: Transaction[],
  ): ICategorizedTransactions {
    const income: any = {};
    const expense: any = {};

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      const amount = Number(t.amount);

      if (t.type === TransactionType.INCOME) {
        totalIncome += amount;
        const category = t.category || IncomeCategory.OTHER_INCOME;
        if (!income[category]) {
          income[category] = { amount: 0, count: 0, percentage: 0 };
        }
        income[category].amount += amount;
        income[category].count += 1;
      } else if (t.type === TransactionType.EXPENSE) {
        totalExpense += amount;
        const category = t.category || ExpenseCategory.OTHER_EXPENSE;
        if (!expense[category]) {
          expense[category] = { amount: 0, count: 0, percentage: 0 };
        }
        expense[category].amount += amount;
        expense[category].count += 1;
      }
    });

    // محاسبه درصدها
    Object.keys(income).forEach(key => {
      income[key].percentage = (income[key].amount / totalIncome) * 100;
    });

    Object.keys(expense).forEach(key => {
      expense[key].percentage = (expense[key].amount / totalExpense) * 100;
    });

    return { income, expense };
  }

  /**
   * گروه‌بندی بر اساس روز
   */
  private groupByDay(transactions: Transaction[]) {
    const grouped: Record<string, { income: number; expense: number }> = {};

    transactions.forEach(t => {
      const date = t.transaction_date.toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { income: 0, expense: 0 };
      }

      const amount = Number(t.amount);
      if (t.type === TransactionType.INCOME) {
        grouped[date].income += amount;
      } else if (t.type === TransactionType.EXPENSE) {
        grouped[date].expense += amount;
      }
    });

    return Object.entries(grouped).map(([date, data]) => ({
      date,
      income: data.income,
      expense: data.expense,
      netProfit: data.income - data.expense,
    }));
  }

  /**
   * گروه‌بندی بر اساس ماه
   */
  private groupByMonth(transactions: Transaction[]) {
    const grouped: Record<string, { income: number; expense: number }> = {};

    transactions.forEach(t => {
      const date = new Date(t.transaction_date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!grouped[month]) {
        grouped[month] = { income: 0, expense: 0 };
      }

      const amount = Number(t.amount);
      if (t.type === TransactionType.INCOME) {
        grouped[month].income += amount;
      } else if (t.type === TransactionType.EXPENSE) {
        grouped[month].expense += amount;
      }
    });

    return Object.entries(grouped).map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
      netProfit: data.income - data.expense,
    }));
  }

  /**
   * تبدیل ProductStock به IProductStock
   */
  private mapToProductStock(stock: ProductStock): IProductStock {
    return {
      productId: stock.product_id,
      productName: stock.product?.name || '',
      sku: stock.product?.sku || '',
      currentStock: stock.quantity,
      reservedStock: stock.reserved_quantity,
      availableStock: stock.available_quantity,
      minStock: stock.min_quantity,
      maxStock: stock.max_quantity,
      alertLevel: stock.alert_level,
      averagePurchasePrice: Number(stock.average_cost),
      totalValue: stock.quantity * Number(stock.average_cost),
    };
  }
}
