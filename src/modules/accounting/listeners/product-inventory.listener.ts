import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { StockMovementService } from '../services/stock-movement.service';
import { WarehouseService } from '../services/warehouse.service';
import {
  StockMovementType,
  StockInReason,
} from '../enums/warehouse.enum';

/**
 * Event های محصول
 */
export class ProductCreatedEvent {
  constructor(
    public readonly productId: number,
    public readonly initialStock: number,
    public readonly userId: number,
  ) {}
}

export class ProductStockUpdatedEvent {
  constructor(
    public readonly productId: number,
    public readonly oldStock: number,
    public readonly newStock: number,
    public readonly userId: number,
  ) {}
}

/**
 * Listener برای رویدادهای محصول
 * این listener موجودی محصولات را در انبار مدیریت می‌کند
 */
@Injectable()
export class ProductInventoryListener {
  private readonly logger = new Logger(ProductInventoryListener.name);

  constructor(
    private readonly stockMovementService: StockMovementService,
    private readonly warehouseService: WarehouseService,
  ) {}

  /**
   * زمانی که محصول جدید ایجاد می‌شود با موجودی اولیه
   */
  @OnEvent('product.created')
  async handleProductCreated(event: ProductCreatedEvent) {
    this.logger.log(
      `رویداد ایجاد محصول دریافت شد - Product: ${event.productId}, Stock: ${event.initialStock}`,
    );

    try {
      // دریافت انبار پیش‌فرض
      const defaultWarehouse = await this.warehouseService.getDefaultWarehouse();

      if (event.initialStock > 0) {
        // ثبت ورود موجودی اولیه
        const movement = await this.stockMovementService.create(
          {
            type: StockMovementType.IN,
            productId: event.productId,
            warehouseId: defaultWarehouse.id,
            quantity: event.initialStock,
            reasonIn: StockInReason.ADJUSTMENT_INCREASE,
            description: `موجودی اولیه محصول - ${event.initialStock} عدد`,
            movementDate: new Date().toISOString(),
            metadata: {
              isInitialStock: true,
            },
          },
          event.userId,
        );

        // تایید خودکار
        await this.stockMovementService.approve(
          movement.id,
          { notes: 'تایید خودکار - موجودی اولیه' },
          event.userId,
        );

        this.logger.log(
          `موجودی اولیه محصول ${event.productId} در انبار ${defaultWarehouse.name} ثبت شد`,
        );
      }
    } catch (error) {
      this.logger.error(
        `خطا در ثبت موجودی اولیه محصول ${event.productId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * زمانی که موجودی محصول بروز می‌شود
   */
  @OnEvent('product.stock.updated')
  async handleProductStockUpdated(event: ProductStockUpdatedEvent) {
    this.logger.log(
      `رویداد بروزرسانی موجودی دریافت شد - Product: ${event.productId}, ${event.oldStock} → ${event.newStock}`,
    );

    try {
      // دریافت انبار پیش‌فرض
      const defaultWarehouse = await this.warehouseService.getDefaultWarehouse();

      const difference = event.newStock - event.oldStock;

      if (difference === 0) {
        this.logger.debug(
          `موجودی محصول ${event.productId} تغییری نکرده است`,
        );
        return;
      }

      // تشخیص نوع حرکت (افزایش یا کاهش)
      const isIncrease = difference > 0;
      const quantity = Math.abs(difference);

      const movement = await this.stockMovementService.create(
        {
          type: isIncrease ? StockMovementType.IN : StockMovementType.OUT,
          productId: event.productId,
          warehouseId: defaultWarehouse.id,
          quantity: quantity,
          reasonIn: isIncrease ? StockInReason.ADJUSTMENT_INCREASE : undefined,
          reasonOut: isIncrease
            ? undefined
            : ('ADJUSTMENT_DECREASE' as any),
          description: isIncrease
            ? `افزایش موجودی توسط مدیر - ${quantity} عدد (${event.oldStock} → ${event.newStock})`
            : `کاهش موجودی توسط مدیر - ${quantity} عدد (${event.oldStock} → ${event.newStock})`,
          movementDate: new Date().toISOString(),
          metadata: {
            isManualAdjustment: true,
            oldStock: event.oldStock,
            newStock: event.newStock,
          },
        },
        event.userId,
      );

      // تایید خودکار
      await this.stockMovementService.approve(
        movement.id,
        { notes: 'تایید خودکار - تنظیم موجودی توسط مدیر' },
        event.userId,
      );

      this.logger.log(
        `موجودی محصول ${event.productId} ${isIncrease ? 'افزایش' : 'کاهش'} یافت: ${quantity} عدد`,
      );
    } catch (error) {
      this.logger.error(
        `خطا در بروزرسانی موجودی محصول ${event.productId}: ${error.message}`,
        error.stack,
      );
    }
  }
}
