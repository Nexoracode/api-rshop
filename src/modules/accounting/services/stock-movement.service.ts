import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, DeepPartial, Like } from 'typeorm';
import { StockMovement } from '../entities/stock-movement.entity';
import { ProductStock } from '../entities/product-stock.entity';
import { Warehouse } from '../entities/warehouse.entity';
import { Product } from '../../product/entities/product.entity';
import {
  CreateStockMovementDto,
  UpdateStockMovementDto,
  ApproveStockMovementDto,
  RejectStockMovementDto,
  StockAdjustmentDto,
} from '../dto/stock-movement.dto';
import { StockMovementMapper } from '../mappers/stock-movement.mapper';
import {
  StockMovementType,
  StockMovementStatus,
  StockAlertLevel,
} from '../enums/warehouse.enum';
import { IStockMovementFilter } from '../interfaces/inventory.interface';

@Injectable()
export class StockMovementService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly movementRepository: Repository<StockMovement>,
    @InjectRepository(ProductStock)
    private readonly stockRepository: Repository<ProductStock>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * ایجاد حرکت انبار
   */
  async create(createDto: CreateStockMovementDto, userId: number) {
    // بررسی وجود محصول
    const product = await this.productRepository.findOne({
      where: { id: createDto.productId },
    });

    if (!product) {
      throw new NotFoundException('محصول یافت نشد');
    }

    // بررسی وجود انبار
    const warehouse = await this.warehouseRepository.findOne({
      where: { id: createDto.warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException('انبار یافت نشد');
    }

    // بررسی انبار مقصد در انتقال
    if (createDto.type === StockMovementType.TRANSFER) {
      if (!createDto.destinationWarehouseId) {
        throw new BadRequestException('انبار مقصد الزامی است');
      }

      const destWarehouse = await this.warehouseRepository.findOne({
        where: { id: createDto.destinationWarehouseId },
      });

      if (!destWarehouse) {
        throw new NotFoundException('انبار مقصد یافت نشد');
      }

      if (createDto.warehouseId === createDto.destinationWarehouseId) {
        throw new BadRequestException('انبار مبدا و مقصد نمی‌توانند یکسان باشند');
      }
    }

    // تولید شماره حرکت
    const movementNumber = await this.generateMovementNumber(createDto.type);

    // دریافت موجودی فعلی
    const currentStock = await this.getOrCreateProductStock(
      createDto.productId,
      createDto.warehouseId,
    );

    const movement = this.movementRepository.create({
      movement_number: movementNumber,
      type: createDto.type,
      status: StockMovementStatus.PENDING,
      product_id: createDto.productId,
      warehouse_id: createDto.warehouseId,
      destination_warehouse_id: createDto.destinationWarehouseId,
      quantity: createDto.quantity,
      unit_cost: createDto.unitCost,
      total_cost: createDto.unitCost
        ? createDto.unitCost * createDto.quantity
        : null,
      reason_in: createDto.reasonIn,
      reason_out: createDto.reasonOut,
      order_id: createDto.orderId,
      reference_number: createDto.referenceNumber,
      description: createDto.description,
      notes: createDto.notes,
      batch_number: createDto.batchNumber,
      expiry_date: createDto.expiryDate ? new Date(createDto.expiryDate) : null,
      attachments: createDto.attachments,
      movement_date: new Date(createDto.movementDate),
      created_by: userId,
      quantity_before: currentStock.quantity,
      quantity_after: currentStock.quantity, // بعد از تایید بروز می‌شود
      metadata: createDto.metadata,
    });

    const saved = await this.movementRepository.save(movement);
    return StockMovementMapper.toResponseDto(saved);
  }

  /**
   * تایید حرکت انبار و بروزرسانی موجودی
   */
  async approve(
    id: number,
    dto: ApproveStockMovementDto,
    userId: number,
  ) {
    const movement = await this.movementRepository.findOne({
      where: { id },
      relations: ['product', 'warehouse'],
    });

    if (!movement) {
      throw new NotFoundException('حرکت انبار یافت نشد');
    }

    if (movement.status !== StockMovementStatus.PENDING) {
      throw new BadRequestException('فقط حرکت‌های در انتظار قابل تایید هستند');
    }

    return await this.dataSource.transaction(async (manager) => {
      // بروزرسانی وضعیت
      movement.status = StockMovementStatus.APPROVED;
      movement.approved_by = userId;
      movement.approved_at = new Date();
      movement.notes = dto.notes || movement.notes;

      // بروزرسانی موجودی بر اساس نوع حرکت
      await this.updateStockQuantity(movement, manager);

      await manager.save(movement);

      return StockMovementMapper.toResponseDto(movement);
    });
  }

  /**
   * رد حرکت انبار
   */
  async reject(
    id: number,
    dto: RejectStockMovementDto,
    userId: number,
  ) {
    const movement = await this.movementRepository.findOne({
      where: { id },
    });

    if (!movement) {
      throw new NotFoundException('حرکت انبار یافت نشد');
    }

    if (movement.status !== StockMovementStatus.PENDING) {
      throw new BadRequestException('فقط حرکت‌های در انتظار قابل رد هستند');
    }

    movement.status = StockMovementStatus.REJECTED;
    movement.approved_by = userId;
    movement.approved_at = new Date();
    movement.notes = dto.reason;

    const updated = await this.movementRepository.save(movement);
    return StockMovementMapper.toResponseDto(updated);
  }

  /**
   * دریافت لیست حرکت‌ها با فیلتر
   */
  async findAll(filter: IStockMovementFilter, page = 1, limit = 20) {
    const where: any = {};

    if (filter.type) where.type = filter.type;
    if (filter.productId) where.product_id = filter.productId;
    if (filter.warehouseId) where.warehouse_id = filter.warehouseId;
    if (filter.userId) where.created_by = filter.userId;

    if (filter.fromDate || filter.toDate) {
      where.movement_date = Between(
        filter.fromDate || new Date('2000-01-01'),
        filter.toDate || new Date(),
      );
    }

    const [movements, total] = await this.movementRepository.findAndCount({
      where,
      relations: ['product', 'warehouse', 'destinationWarehouse', 'creator', 'approver'],
      order: { movement_date: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: StockMovementMapper.toResponseDtoList(movements),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * دریافت حرکت با ID
   */
  async findOne(id: number) {
    const movement = await this.movementRepository.findOne({
      where: { id },
      relations: ['product', 'warehouse', 'destinationWarehouse', 'creator', 'approver', 'order'],
    });

    if (!movement) {
      throw new NotFoundException('حرکت انبار یافت نشد');
    }

    return StockMovementMapper.toDetailedDto(movement);
  }

  /**
   * بروزرسانی حرکت
   */
  async update(
    id: number,
    updateDto: UpdateStockMovementDto,
    userId: number,
  ) {
    const movement = await this.movementRepository.findOne({
      where: { id },
    });

    if (!movement) {
      throw new NotFoundException('حرکت انبار یافت نشد');
    }

    if (movement.status !== StockMovementStatus.PENDING) {
      throw new BadRequestException('فقط حرکت‌های در انتظار قابل ویرایش هستند');
    }

    Object.assign(movement, {
      status: updateDto.status ?? movement.status,
      quantity: updateDto.quantity ?? movement.quantity,
      unit_cost: updateDto.unitCost ?? movement.unit_cost,
      description: updateDto.description ?? movement.description,
      notes: updateDto.notes ?? movement.notes,
      reference_number: updateDto.referenceNumber ?? movement.reference_number,
      attachments: updateDto.attachments ?? movement.attachments,
      metadata: updateDto.metadata ?? movement.metadata,
    });

    // بروزرسانی مبلغ کل
    if (movement.unit_cost && movement.quantity) {
      movement.total_cost = Number(movement.unit_cost) * movement.quantity;
    }

    const updated = await this.movementRepository.save(movement);
    return StockMovementMapper.toResponseDto(updated);
  }

  /**
   * تنظیم موجودی (Adjustment)
   */
  async adjustStock(dto: StockAdjustmentDto, userId: number) {
    const stock = await this.getOrCreateProductStock(
      dto.productId,
      dto.warehouseId,
    );

    const currentQuantity = stock.quantity;
    const difference = dto.newQuantity - currentQuantity;

    if (difference === 0) {
      throw new BadRequestException('موجودی تغییری نکرده است');
    }

    const movementType = StockMovementType.ADJUSTMENT;
    const movementNumber = await this.generateMovementNumber(movementType);

    const movement = this.movementRepository.create({
      movement_number: movementNumber,
      type: movementType,
      status: StockMovementStatus.PENDING,
      product_id: dto.productId,
      warehouse_id: dto.warehouseId,
      quantity: Math.abs(difference),
      reason_in: difference > 0 ? 'ADJUSTMENT_INCREASE' : null,
      reason_out: difference < 0 ? 'ADJUSTMENT_DECREASE' : null,
      description: dto.reason,
      notes: dto.notes,
      movement_date: new Date(),
      created_by: userId,
      quantity_before: currentQuantity,
      quantity_after: dto.newQuantity,
    } as DeepPartial<StockMovement>);

    const saved = await this.movementRepository.save(movement);

    // تایید خودکار
    await this.approve(saved.id, { notes: 'تنظیم موجودی' }, userId);

    return StockMovementMapper.toResponseDto(saved);
  }

  /**
   * تولید شماره حرکت
   */
  private async generateMovementNumber(type: StockMovementType): Promise<string> {
    const prefix =
      type === StockMovementType.IN ? 'IN' :
        type === StockMovementType.OUT ? 'OUT' :
          type === StockMovementType.TRANSFER ? 'TRF' : 'ADJ';

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const count = await this.movementRepository.count({
      where: {
        movement_number: Like(`${prefix}-${year}${month}-%`),
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `${prefix}-${year}${month}-${sequence}`;
  }

  /**
   * دریافت یا ایجاد موجودی محصول
   */
  private async getOrCreateProductStock(
    productId: number,
    warehouseId: number,
  ): Promise<ProductStock> {
    let stock = await this.stockRepository.findOne({
      where: { product_id: productId, warehouse_id: warehouseId },
    });

    if (!stock) {
      stock = this.stockRepository.create({
        product_id: productId,
        warehouse_id: warehouseId,
        quantity: 0,
        reserved_quantity: 0,
        available_quantity: 0,
        min_quantity: 0,
        max_quantity: 0,
        reorder_point: 0,
        reorder_quantity: 0,
        average_cost: 0,
        last_purchase_cost: 0,
        alert_level: StockAlertLevel.OUT_OF_STOCK,
      });
      stock = await this.stockRepository.save(stock);
    }

    return stock;
  }

  /**
   * بروزرسانی موجودی بر اساس نوع حرکت
   */
  private async updateStockQuantity(movement: StockMovement, manager: any) {
    const stock = await manager.findOne(ProductStock, {
      where: {
        product_id: movement.product_id,
        warehouse_id: movement.warehouse_id,
      },
    });

    if (!stock) {
      throw new NotFoundException('موجودی یافت نشد');
    }

    // ورود
    if (movement.type === StockMovementType.IN) {
      stock.quantity += movement.quantity;
      stock.available_quantity += movement.quantity;

      // بروزرسانی قیمت میانگین
      if (movement.unit_cost) {
        const totalValue =
          (stock.quantity - movement.quantity) * Number(stock.average_cost) +
          movement.quantity * Number(movement.unit_cost);
        stock.average_cost = totalValue / stock.quantity;
        stock.last_purchase_cost = movement.unit_cost;
      }

      stock.last_stock_in_date = movement.movement_date;
    }
    // خروج
    else if (movement.type === StockMovementType.OUT) {
      if (stock.available_quantity < movement.quantity) {
        throw new BadRequestException('موجودی کافی نیست');
      }

      stock.quantity -= movement.quantity;
      stock.available_quantity -= movement.quantity;
      stock.last_stock_out_date = movement.movement_date;
    }
    // انتقال
    else if (movement.type === StockMovementType.TRANSFER) {
      // کاهش از انبار مبدا
      if (stock.available_quantity < movement.quantity) {
        throw new BadRequestException('موجودی انبار مبدا کافی نیست');
      }

      stock.quantity -= movement.quantity;
      stock.available_quantity -= movement.quantity;

      // افزایش به انبار مقصد
      if (movement.destination_warehouse_id == null) {
        throw new BadRequestException('انبار مقصد مشخص نشده است');
      }
      const destStock = await this.getOrCreateProductStock(
        movement.product_id,
        movement.destination_warehouse_id,
      );

      destStock.quantity += movement.quantity;
      destStock.available_quantity += movement.quantity;
      await manager.save(destStock);
    }
    // تنظیم
    else if (movement.type === StockMovementType.ADJUSTMENT) {
      stock.quantity = movement.quantity_after;
      stock.available_quantity = movement.quantity_after - stock.reserved_quantity;
    }

    // بروزرسانی سطح هشدار
    stock.alert_level = this.calculateAlertLevel(stock);

    // بروزرسانی quantity_after
    movement.quantity_after = stock.quantity;

    await manager.save(stock);
  }

  /**
   * محاسبه سطح هشدار موجودی
   */
  private calculateAlertLevel(stock: ProductStock): StockAlertLevel {
    if (stock.quantity === 0) {
      return StockAlertLevel.OUT_OF_STOCK;
    }

    if (stock.quantity <= stock.min_quantity) {
      return StockAlertLevel.CRITICAL;
    }

    if (stock.quantity <= stock.reorder_point) {
      return StockAlertLevel.LOW;
    }

    return StockAlertLevel.SUFFICIENT;
  }
}
