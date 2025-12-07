import { Transaction } from '../entities/transaction.entity';
import {
  TransactionType,
  TransactionStatus,
  IncomeCategory,
  ExpenseCategory,
} from '../enums/transaction.enum';

/**
 * Response DTO برای تراکنش
 */
export class TransactionResponseDto {
  id: number;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  category: IncomeCategory | ExpenseCategory | null;
  paymentMethod: string;
  accountId: number;
  accountName?: string;
  destinationAccountId: number | null;
  destinationAccountName?: string;
  orderId: number | null;
  description: string;
  notes: string | null;
  referenceNumber: string | null;
  attachments: string[] | null;
  transactionDate: Date;
  createdBy: number;
  creatorName?: string;
  approvedBy: number | null;
  approverName?: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mapper برای تبدیل Entity به Response DTO
 */
export class TransactionMapper {
  /**
   * تبدیل Entity به Response DTO
   */
  static toResponseDto(entity: Transaction): TransactionResponseDto {
    return {
      id: entity.id,
      type: entity.type,
      status: entity.status,
      amount: Number(entity.amount),
      category: entity.category,
      paymentMethod: entity.payment_method,
      accountId: entity.account_id,
      accountName: undefined, // باید از join یا جداگانه لود شود
      destinationAccountId: entity.destination_account_id,
      destinationAccountName: undefined,
      orderId: entity.order_id,
      description: entity.description,
      notes: entity.notes,
      referenceNumber: entity.reference_number,
      attachments: entity.attachments,
      transactionDate: entity.transaction_date,
      createdBy: entity.created_by,
      creatorName: entity.creator?.firstName
        ? `${entity.creator.firstName} ${entity.creator.lastName}`
        : undefined,
      approvedBy: entity.approved_by,
      approverName: entity.approver?.firstName
        ? `${entity.approver.firstName} ${entity.approver.lastName}`
        : null,
      approvedAt: entity.approved_at,
      rejectionReason: entity.rejection_reason,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * تبدیل لیست Entity ها به لیست Response DTO
   */
  static toResponseDtoList(entities: Transaction[]): TransactionResponseDto[] {
    return entities.map(entity => this.toResponseDto(entity));
  }

  /**
   * تبدیل به DTO خلاصه (برای لیست‌ها)
   */
  static toSummaryDto(entity: Transaction) {
    return {
      id: entity.id,
      type: entity.type,
      status: entity.status,
      amount: Number(entity.amount),
      category: entity.category,
      paymentMethod: entity.payment_method,
      description: entity.description,
      transactionDate: entity.transaction_date,
      referenceNumber: entity.reference_number,
    };
  }

  /**
   * تبدیل Entity با اطلاعات کامل (شامل relations)
   */
  static toDetailedDto(entity: Transaction) {
    const baseDto = this.toResponseDto(entity);

    return {
      ...baseDto,
      order: entity.order ? {
        id: entity.order.id,
        orderNumber: entity.order.id,
        totalAmount: entity.order.total,
      } : null,
    };
  }
}
