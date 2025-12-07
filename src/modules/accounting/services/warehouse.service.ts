import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Warehouse } from '../entities/warehouse.entity';
import { ProductStock } from '../entities/product-stock.entity';
import { CreateWarehouseDto, UpdateWarehouseDto } from '../dto/warehouse.dto';
import { WarehouseMapper } from '../mappers/warehouse.mapper';
import { WarehouseStatus } from '../enums/warehouse.enum';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(ProductStock)
    private readonly productStockRepository: Repository<ProductStock>,
  ) {}

  /**
   * ایجاد انبار جدید
   */
  async create(createDto: CreateWarehouseDto) {
    // بررسی تکراری نبودن کد
    const existingCode = await this.warehouseRepository.findOne({
      where: { code: createDto.code },
    });

    if (existingCode) {
      throw new BadRequestException('کد انبار تکراری است');
    }

    // بررسی تکراری نبودن نام
    const existingName = await this.warehouseRepository.findOne({
      where: { name: createDto.name },
    });

    if (existingName) {
      throw new BadRequestException('نام انبار تکراری است');
    }

    const warehouse = this.warehouseRepository.create({
      name: createDto.name,
      code: createDto.code,
      type: createDto.type,
      description: createDto.description,
      address: createDto.address,
      city: createDto.city,
      province: createDto.province,
      postal_code: createDto.postalCode,
      phone: createDto.phone,
      manager_name: createDto.managerName,
      capacity: createDto.capacity,
      latitude: createDto.latitude,
      longitude: createDto.longitude,
      is_default: createDto.isDefault || false,
      priority: createDto.priority || 0,
      settings: createDto.settings,
    });

    // اگر انبار پیش‌فرض است، بقیه را غیرفعال کن
    if (warehouse.is_default) {
      await this.warehouseRepository.update(
        { is_default: true },
        { is_default: false },
      );
    }

    const saved = await this.warehouseRepository.save(warehouse);
    return WarehouseMapper.toResponseDto(saved);
  }

  /**
   * دریافت لیست انبارها
   */
  async findAll(status?: WarehouseStatus) {
    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    const warehouses = await this.warehouseRepository.find({
      where,
      order: { is_default: 'DESC', priority: 'DESC', name: 'ASC' },
    });

    return WarehouseMapper.toResponseDtoList(warehouses);
  }

  /**
   * دریافت انبار با ID
   */
  async findOne(id: number) {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
    });

    if (!warehouse) {
      throw new NotFoundException('انبار یافت نشد');
    }

    return WarehouseMapper.toResponseDto(warehouse);
  }

  /**
   * دریافت انبار پیش‌فرض
   */
  async getDefaultWarehouse() {
    const warehouse = await this.warehouseRepository.findOne({
      where: { 
        is_default: true, 
        status: WarehouseStatus.ACTIVE 
      },
    });

    if (!warehouse) {
      throw new NotFoundException('انبار پیش‌فرض یافت نشد');
    }

    return WarehouseMapper.toResponseDto(warehouse);
  }

  /**
   * بروزرسانی انبار
   */
  async update(id: number, updateDto: UpdateWarehouseDto) {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
    });

    if (!warehouse) {
      throw new NotFoundException('انبار یافت نشد');
    }

    // بررسی تکراری نبودن نام
    if (updateDto.name && updateDto.name !== warehouse.name) {
      const existingName = await this.warehouseRepository.findOne({
        where: { name: updateDto.name },
      });

      if (existingName) {
        throw new BadRequestException('نام انبار تکراری است');
      }
    }

    // بروزرسانی فیلدها
    Object.assign(warehouse, {
      name: updateDto.name ?? warehouse.name,
      type: updateDto.type ?? warehouse.type,
      status: updateDto.status ?? warehouse.status,
      description: updateDto.description ?? warehouse.description,
      address: updateDto.address ?? warehouse.address,
      city: updateDto.city ?? warehouse.city,
      province: updateDto.province ?? warehouse.province,
      postal_code: updateDto.postalCode ?? warehouse.postal_code,
      phone: updateDto.phone ?? warehouse.phone,
      manager_name: updateDto.managerName ?? warehouse.manager_name,
      capacity: updateDto.capacity ?? warehouse.capacity,
      latitude: updateDto.latitude ?? warehouse.latitude,
      longitude: updateDto.longitude ?? warehouse.longitude,
      is_default: updateDto.isDefault ?? warehouse.is_default,
      priority: updateDto.priority ?? warehouse.priority,
      settings: updateDto.settings ?? warehouse.settings,
    });

    // اگر انبار پیش‌فرض شد، بقیه را غیرفعال کن
    if (warehouse.is_default && updateDto.isDefault) {
      await this.warehouseRepository.update(
        { id: Not(id), is_default: true },
        { is_default: false },
      );
    }

    const updated = await this.warehouseRepository.save(warehouse);
    return WarehouseMapper.toResponseDto(updated);
  }

  /**
   * حذف انبار
   */
  async remove(id: number) {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
    });

    if (!warehouse) {
      throw new NotFoundException('انبار یافت نشد');
    }

    // بررسی عدم وجود موجودی در انبار
    const stockCount = await this.productStockRepository.count({
      where: { warehouse_id: id, quantity: Not(0) },
    });

    if (stockCount > 0) {
      throw new BadRequestException('انبار دارای موجودی است و قابل حذف نیست');
    }

    await this.warehouseRepository.remove(warehouse);
    
    return { message: 'انبار با موفقیت حذف شد' };
  }

  /**
   * دریافت موجودی انبار
   */
  async getStockSummary(warehouseId: number) {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id: warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException('انبار یافت نشد');
    }

    const stocks = await this.productStockRepository.find({
      where: { warehouse_id: warehouseId },
      relations: ['product'],
    });

    const totalItems = stocks.reduce((sum, s) => sum + s.quantity, 0);
    const uniqueProducts = stocks.filter(s => s.quantity > 0).length;
    const totalValue = stocks.reduce(
      (sum, s) => sum + (s.quantity * Number(s.average_cost)),
      0,
    );

    return {
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      status: warehouse.status,
      totalItems,
      uniqueProducts,
      totalValue,
      capacity: warehouse.capacity,
      fillPercentage: warehouse.capacity 
        ? (totalItems / warehouse.capacity) * 100 
        : null,
    };
  }

  /**
   * دریافت موجودی محصولات یک انبار
   */
  async getProductStocks(warehouseId: number) {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id: warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException('انبار یافت نشد');
    }

    const stocks = await this.productStockRepository.find({
      where: { warehouse_id: warehouseId },
      relations: ['product'],
      order: { quantity: 'DESC' },
    });

    return stocks.map(stock => ({
      productId: stock.product_id,
      productName: stock.product?.name,
      productSku: stock.product?.sku,
      quantity: stock.quantity,
      reservedQuantity: stock.reserved_quantity,
      availableQuantity: stock.available_quantity,
      minQuantity: stock.min_quantity,
      alertLevel: stock.alert_level,
      averageCost: Number(stock.average_cost),
      totalValue: stock.quantity * Number(stock.average_cost),
      location: stock.location,
      batchNumber: stock.batch_number,
      expiryDate: stock.expiry_date,
    }));
  }

  /**
   * دریافت لیست انبارها برای dropdown
   */
  async getWarehouseOptions() {
    const warehouses = await this.warehouseRepository.find({
      where: { status: WarehouseStatus.ACTIVE },
      order: { is_default: 'DESC', name: 'ASC' },
    });

    return warehouses.map(w => WarehouseMapper.toSelectOption(w));
  }
}
