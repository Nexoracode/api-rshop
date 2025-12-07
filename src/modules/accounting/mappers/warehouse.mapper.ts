import { Warehouse } from '../entities/warehouse.entity';
import { WarehouseType, WarehouseStatus } from '../enums/warehouse.enum';

/**
 * Response DTO برای انبار
 */
export class WarehouseResponseDto {
  id: number;
  name: string;
  code: string;
  type: WarehouseType;
  status: WarehouseStatus;
  description: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  phone: string | null;
  managerName: string | null;
  capacity: number | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  priority: number;
  settings: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mapper برای انبار
 */
export class WarehouseMapper {
  /**
   * تبدیل Entity به Response DTO
   */
  static toResponseDto(entity: Warehouse): WarehouseResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
      type: entity.type,
      status: entity.status,
      description: entity.description,
      address: entity.address,
      city: entity.city,
      province: entity.province,
      postalCode: entity.postal_code,
      phone: entity.phone,
      managerName: entity.manager_name,
      capacity: entity.capacity,
      latitude: entity.latitude ? Number(entity.latitude) : null,
      longitude: entity.longitude ? Number(entity.longitude) : null,
      isDefault: entity.is_default,
      priority: entity.priority,
      settings: entity.settings,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * تبدیل لیست Entity ها
   */
  static toResponseDtoList(entities: Warehouse[]): WarehouseResponseDto[] {
    return entities.map(entity => this.toResponseDto(entity));
  }

  /**
   * تبدیل به DTO خلاصه
   */
  static toSummaryDto(entity: Warehouse) {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
      type: entity.type,
      status: entity.status,
      city: entity.city,
      isDefault: entity.is_default,
    };
  }

  /**
   * تبدیل برای انتخاب در dropdown
   */
  static toSelectOption(entity: Warehouse) {
    return {
      value: entity.id,
      label: `${entity.name} (${entity.code})`,
      code: entity.code,
      type: entity.type,
      status: entity.status,
      isActive: entity.status === WarehouseStatus.ACTIVE,
    };
  }

  /**
   * تبدیل با اطلاعات موقعیت جغرافیایی
   */
  static toLocationDto(entity: Warehouse) {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
      address: entity.address,
      city: entity.city,
      province: entity.province,
      postalCode: entity.postal_code,
      latitude: entity.latitude ? Number(entity.latitude) : null,
      longitude: entity.longitude ? Number(entity.longitude) : null,
    };
  }
}
