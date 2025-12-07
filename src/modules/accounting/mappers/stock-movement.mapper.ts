import { StockMovement } from '../entities/stock-movement.entity';
import {
  StockMovementType,
  StockMovementStatus,
  StockInReason,
  StockOutReason,
} from '../enums/warehouse.enum';

/**
 * Response DTO برای حرکت انبار
 */
export class StockMovementResponseDto {
  id: number;
  movementNumber: string;
  type: StockMovementType;
  status: StockMovementStatus;
  productId: number;
  productName?: string;
  productSku?: string;
  warehouseId: number;
  warehouseName?: string;
  destinationWarehouseId: number | null;
  destinationWarehouseName?: string | null;
  quantity: number;
  unitCost: number | null;
  totalCost: number | null;
  reasonIn: StockInReason | null;
  reasonOut: StockOutReason | null;
  orderId: number | null;
  referenceNumber: string | null;
  description: string | null;
  notes: string | null;
  batchNumber: string | null;
  expiryDate: Date | null;
  attachments: string[] | null;
  movementDate: Date;
  createdBy: number;
  creatorName?: string;
  approvedBy: number | null;
  approverName?: string | null;
  approvedAt: Date | null;
  quantityBefore: number;
  quantityAfter: number;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mapper برای حرکت انبار
 */
export class StockMovementMapper {
  /**
   * تبدیل Entity به Response DTO
   */
  static toResponseDto(entity: StockMovement): StockMovementResponseDto {
    return {
      id: entity.id,
      movementNumber: entity.movement_number,
      type: entity.type,
      status: entity.status,
      productId: entity.product_id,
      productName: entity.product?.name,
      productSku: entity.product?.sku,
      warehouseId: entity.warehouse_id,
      warehouseName: entity.warehouse?.name,
      destinationWarehouseId: entity.destination_warehouse_id,
      destinationWarehouseName: entity.destinationWarehouse?.name || null,
      quantity: entity.quantity,
      unitCost: entity.unit_cost ? Number(entity.unit_cost) : null,
      totalCost: entity.total_cost ? Number(entity.total_cost) : null,
      reasonIn: entity.reason_in,
      reasonOut: entity.reason_out,
      orderId: entity.order_id,
      referenceNumber: entity.reference_number,
      description: entity.description,
      notes: entity.notes,
      batchNumber: entity.batch_number,
      expiryDate: entity.expiry_date,
      attachments: entity.attachments,
      movementDate: entity.movement_date,
      createdBy: entity.created_by,
      creatorName: entity.creator?.firstName
        ? `${entity.creator.firstName} ${entity.creator.lastName}`
        : undefined,
      approvedBy: entity.approved_by,
      approverName: entity.approver?.firstName
        ? `${entity.approver.firstName} ${entity.approver.lastName}`
        : null,
      approvedAt: entity.approved_at,
      quantityBefore: entity.quantity_before,
      quantityAfter: entity.quantity_after,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * تبدیل لیست Entity ها
   */
  static toResponseDtoList(
    entities: StockMovement[],
  ): StockMovementResponseDto[] {
    return entities.map(entity => this.toResponseDto(entity));
  }

  /**
   * تبدیل به DTO خلاصه
   */
  static toSummaryDto(entity: StockMovement) {
    return {
      id: entity.id,
      movementNumber: entity.movement_number,
      type: entity.type,
      status: entity.status,
      productName: entity.product?.name,
      warehouseName: entity.warehouse?.name,
      quantity: entity.quantity,
      movementDate: entity.movement_date,
      creatorName: entity.creator?.firstName
        ? `${entity.creator.firstName} ${entity.creator.lastName}`
        : undefined,
    };
  }

  /**
   * تبدیل به DTO با جزئیات کامل
   */
  static toDetailedDto(entity: StockMovement) {
    const baseDto = this.toResponseDto(entity);

    return {
      ...baseDto,
      product: entity.product ? {
        id: entity.product.id,
        name: entity.product.name,
        sku: entity.product.sku,
        price: entity.product.price,
        images: entity.product.medias,
      } : null,
      warehouse: entity.warehouse ? {
        id: entity.warehouse.id,
        name: entity.warehouse.name,
        code: entity.warehouse.code,
        type: entity.warehouse.type,
      } : null,
      order: entity.order ? {
        id: entity.order.id,
        orderNumber: entity.order.id,
        totalAmount: entity.order.total,
      } : null,
    };
  }
}
