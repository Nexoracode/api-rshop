import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Order } from '../../order/entities/order.entity';
import { Payment } from '../../payment/entities/payment.entity';
import { TransactionService } from './transaction.service';
import { StockMovementService } from './stock-movement.service';
import { WarehouseService } from './warehouse.service';
import { OrderStatus } from '../../order/enums/order-status.enum';
import { PaymentStatus } from '../../payment/enums/payment-status.enum';
import {
  TransactionType,
  PaymentMethod as AccountingPaymentMethod,
  IncomeCategory,
} from '../enums/transaction.enum';
import {
  StockMovementType,
  StockOutReason,
} from '../enums/warehouse.enum';

/**
 * سرویس یکپارچه‌ساز بین Order/Payment و Accounting/Warehouse
 * این سرویس مسئول هماهنگی بین ماژول‌هاست
 */
@Injectable()
export class OrderAccountingService {
  private readonly logger = new Logger(OrderAccountingService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly transactionService: TransactionService,
    private readonly stockMovementService: StockMovementService,
    private readonly warehouseService: WarehouseService,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * پردازش سفارش پس از پرداخت موفق
   * این متد باید از OrderService فراخوانی شود
   */
  async processOrderPayment(orderId: number, paymentId: number, userId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'user', 'giftWrapping'],
    });

    if (!order) {
      throw new Error('سفارش یافت نشد');
    }

    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('پرداخت یافت نشد');
    }

    // استفاده از Transaction برای یکپارچگی
    return await this.dataSource.transaction(async (manager) => {
      try {
        // 1. ثبت تراکنش مالی
        const transaction = await this.recordOrderTransaction(
          order,
          payment,
          userId,
        );

        // 2. کم کردن موجودی کالاها
        await this.decreaseStock(order, userId);

        // 3. لاگ موفقیت
        this.logger.log(
          `سفارش ${orderId} با موفقیت در سیستم حسابداری ثبت شد`,
        );

        return {
          transaction,
          message: 'سفارش با موفقیت پردازش شد',
        };
      } catch (error) {
        this.logger.error(
          `خطا در پردازش سفارش ${orderId}: ${error.message}`,
        );
        throw error;
      }
    });
  }

  /**
   * ثبت تراکنش مالی برای سفارش
   */
  private async recordOrderTransaction(
    order: Order,
    payment: Payment,
    userId: number,
  ) {
    // دریافت حساب پیش‌فرض
    const defaultAccount = await this.transactionService['accountRepository']
      .findOne({
        where: { is_default: true, is_active: true },
      });

    if (!defaultAccount) {
      throw new Error('حساب پیش‌فرض یافت نشد');
    }

    // تبدیل Payment Gateway به Accounting Payment Method
    const paymentMethod = this.mapPaymentMethod(payment);

    // محاسبه اجزای درآمد
    const incomeBreakdown = {
      productSales: Number(order.subtotal) - Number(order.discountTotal),
      shippingFee: Number(order.shippingCost),
      giftWrappingFee: Number(order.giftWrappingCost || 0),
      total: Number(order.total),
    };

    // ثبت تراکنش اصلی (کل مبلغ سفارش)
    const mainTransaction = await this.transactionService.create(
      {
        type: TransactionType.INCOME,
        amount: incomeBreakdown.total,
        category: IncomeCategory.PRODUCT_SALE,
        paymentMethod: paymentMethod,
        accountId: defaultAccount.id,
        orderId: order.id,
        description: `دریافت مبلغ سفارش #${order.id} - ${order.items.length} محصول`,
        referenceNumber: payment.authority,
        transactionDate: new Date().toISOString(),
        metadata: {
          breakdown: incomeBreakdown,
          paymentId: payment.id,
          userId: order.user.id,
          gateway: payment.gateway,
          refId: payment.refId,
          promotionCode: order.promotionCode,
          promotionDiscount: Number(order.promotionDiscountAmount),
          manualDiscount: Number(order.manualDiscountApplied),
        },
      },
      userId,
    );

    // اگر هزینه ارسال وجود داشت، یک تراکنش جداگانه
    if (incomeBreakdown.shippingFee > 0) {
      await this.transactionService.create(
        {
          type: TransactionType.INCOME,
          amount: incomeBreakdown.shippingFee,
          category: IncomeCategory.SHIPPING_FEE,
          paymentMethod: paymentMethod,
          accountId: defaultAccount.id,
          orderId: order.id,
          description: `هزینه ارسال سفارش #${order.id}`,
          transactionDate: new Date().toISOString(),
          metadata: {
            relatedTransactionId: mainTransaction.id,
          },
        },
        userId,
      );
    }

    // اگر هزینه بسته‌بندی هدیه وجود داشت
    if (incomeBreakdown.giftWrappingFee > 0) {
      await this.transactionService.create(
        {
          type: TransactionType.INCOME,
          amount: incomeBreakdown.giftWrappingFee,
          category: IncomeCategory.GIFT_WRAPPING_FEE,
          paymentMethod: paymentMethod,
          accountId: defaultAccount.id,
          orderId: order.id,
          description: `هزینه بسته‌بندی هدیه سفارش #${order.id}`,
          transactionDate: new Date().toISOString(),
          metadata: {
            relatedTransactionId: mainTransaction.id,
            giftWrappingId: order.giftWrappingId,
            giftMessage: order.giftMessage,
          },
        },
        userId,
      );
    }

    // تایید خودکار تراکنش
    await this.transactionService.approve(
      mainTransaction.id,
      { notes: 'تایید خودکار - پرداخت موفق' },
      userId,
    );

    return mainTransaction;
  }

  /**
   * کم کردن موجودی کالاها از انبار
   */
  private async decreaseStock(order: Order, userId: number) {
    // دریافت انبار پیش‌فرض
    const defaultWarehouse = await this.warehouseService.getDefaultWarehouse();

    // برای هر محصول سفارش
    for (const item of order.items) {
      try {
        // ثبت خروج از انبار
        const movement = await this.stockMovementService.create(
          {
            type: StockMovementType.OUT,
            productId: item.product.id,
            warehouseId: defaultWarehouse.id,
            quantity: item.quantity,
            unitCost: Number(item.unitPrice),
            reasonOut: StockOutReason.SALE,
            orderId: order.id,
            description: `فروش محصول ${item.product.name} - سفارش #${order.id}`,
            movementDate: new Date().toISOString(),
            metadata: {
              orderItemId: item.id,
              customerId: order.user.id,
            },
          },
          userId,
        );

        // تایید خودکار خروج
        await this.stockMovementService.approve(
          movement.id,
          { notes: 'تایید خودکار - فروش' },
          userId,
        );

        this.logger.log(
          `موجودی محصول ${item.product.id} کم شد - تعداد: ${item.quantity}`,
        );
      } catch (error) {
        this.logger.error(
          `خطا در کم کردن موجودی محصول ${item.product.id}: ${error.message}`,
        );
        throw error;
      }
    }
  }

  /**
   * پردازش مرجوعی سفارش
   */
  async processOrderReturn(orderId: number, userId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product'],
    });

    if (!order) {
      throw new Error('سفارش یافت نشد');
    }

    return await this.dataSource.transaction(async (manager) => {
      // 1. ثبت تراکنش برگشت وجه
      const defaultAccount = await this.transactionService['accountRepository']
        .findOne({
          where: { is_default: true },
        });

      const refundTransaction = await this.transactionService.create(
        {
          type: TransactionType.EXPENSE,
          amount: Number(order.total),
          category: 'CUSTOMER_REFUND' as any,
          paymentMethod: AccountingPaymentMethod.BANK_TRANSFER,
          accountId: defaultAccount!.id,
          orderId: order.id,
          description: `برگشت وجه سفارش #${order.id}`,
          transactionDate: new Date().toISOString(),
          metadata: {
            returnReason: 'مرجوعی مشتری',
          },
        },
        userId,
      );

      // 2. افزایش موجودی (برگشت به انبار)
      const defaultWarehouse = await this.warehouseService.getDefaultWarehouse();

      for (const item of order.items) {
        await this.stockMovementService.create(
          {
            type: StockMovementType.IN,
            productId: item.product.id,
            warehouseId: defaultWarehouse.id,
            quantity: item.quantity,
            unitCost: Number(item.unitPrice),
            reasonIn: 'CUSTOMER_RETURN' as any,
            orderId: order.id,
            description: `برگشت محصول ${item.product.name} - سفارش #${order.id}`,
            movementDate: new Date().toISOString(),
          },
          userId,
        );
      }

      return {
        transaction: refundTransaction,
        message: 'مرجوعی با موفقیت ثبت شد',
      };
    });
  }

  /**
   * تبدیل Payment Method به Accounting Payment Method
   */
  private mapPaymentMethod(payment: Payment): AccountingPaymentMethod {
    switch (payment.paymentMethod) {
      case 'online':
        return AccountingPaymentMethod.ONLINE_GATEWAY;
      case 'card_to_card':
        return AccountingPaymentMethod.CARD_TO_CARD;
      case 'cash':
        return AccountingPaymentMethod.CASH;
      case 'wallet':
        return AccountingPaymentMethod.WALLET;
      default:
        return AccountingPaymentMethod.ONLINE_GATEWAY;
    }
  }

  /**
   * گزارش فروش روزانه
   */
  async getDailySalesReport(date: Date) {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const orders = await this.orderRepository.find({
      where: {
        status: OrderStatus.DELIVERED,
        createdAt: Between(startOfDay, endOfDay) as any,
      },
      relations: ['items'],
    });

    return {
      date: startOfDay,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
      totalItems: orders.reduce(
        (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
        0,
      ),
    };
  }
}