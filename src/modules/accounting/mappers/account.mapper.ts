import { Account } from '../entities/account.entity';
import { AccountType } from '../enums/transaction.enum';

/**
 * Response DTO برای حساب
 */
export class AccountResponseDto {
  id: number;
  name: string;
  code: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  description: string | null;
  accountNumber: string | null;
  bankName: string | null;
  iban: string | null;
  cardNumber: string | null;
  isActive: boolean;
  isDefault: boolean;
  settings: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mapper برای حساب
 */
export class AccountMapper {
  /**
   * تبدیل Entity به Response DTO
   */
  static toResponseDto(entity: Account): AccountResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
      type: entity.type,
      currency: entity.currency,
      initialBalance: Number(entity.initial_balance),
      currentBalance: Number(entity.current_balance),
      description: entity.description,
      accountNumber: entity.account_number,
      bankName: entity.bank_name,
      iban: entity.iban,
      cardNumber: entity.card_number,
      isActive: entity.is_active,
      isDefault: entity.is_default,
      settings: entity.settings,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * تبدیل لیست Entity ها
   */
  static toResponseDtoList(entities: Account[]): AccountResponseDto[] {
    return entities.map(entity => this.toResponseDto(entity));
  }

  /**
   * تبدیل به DTO خلاصه
   */
  static toSummaryDto(entity: Account) {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
      type: entity.type,
      currentBalance: Number(entity.current_balance),
      isActive: entity.is_active,
      isDefault: entity.is_default,
    };
  }

  /**
   * تبدیل برای انتخاب در dropdown
   */
  static toSelectOption(entity: Account) {
    return {
      value: entity.id,
      label: `${entity.name} (${entity.code})`,
      balance: Number(entity.current_balance),
      type: entity.type,
      isActive: entity.is_active,
    };
  }

  /**
   * مخفی کردن اطلاعات حساس
   */
  static toSecureDto(entity: Account) {
    const dto = this.toResponseDto(entity);
    
    // مخفی کردن شماره کارت
    if (dto.cardNumber) {
      const cleaned = dto.cardNumber.replace(/\D/g, '');
      if (cleaned.length >= 4) {
        dto.cardNumber = `****-****-****-${cleaned.slice(-4)}`;
      }
    }

    // مخفی کردن شماره حساب
    if (dto.accountNumber && dto.accountNumber.length > 4) {
      dto.accountNumber = `****${dto.accountNumber.slice(-4)}`;
    }

    // مخفی کردن شبا
    if (dto.iban && dto.iban.length > 4) {
      dto.iban = `IR****${dto.iban.slice(-4)}`;
    }

    return dto;
  }
}
