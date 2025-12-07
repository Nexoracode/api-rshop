import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, In, Like } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { Account } from '../entities/account.entity';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  ApproveTransactionDto,
  RejectTransactionDto,
} from '../dto/transaction.dto';
import { TransactionMapper } from '../mappers/transaction.mapper';
import {
  TransactionType,
  TransactionStatus,
  IncomeCategory,
  ExpenseCategory,
} from '../enums/transaction.enum';
import { ITransactionFilter, ITransactionSummary } from '../interfaces/transaction.interface';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * ایجاد تراکنش جدید
   */
  async create(createDto: CreateTransactionDto, userId: number) {
    // بررسی وجود حساب
    const account = await this.accountRepository.findOne({
      where: { id: createDto.accountId },
    });

    if (!account) {
      throw new NotFoundException('حساب یافت نشد');
    }

    if (!account.is_active) {
      throw new BadRequestException('حساب غیرفعال است');
    }

    // بررسی حساب مقصد در انتقال
    if (createDto.type === TransactionType.TRANSFER) {
      if (!createDto.destinationAccountId) {
        throw new BadRequestException('حساب مقصد الزامی است');
      }

      const destAccount = await this.accountRepository.findOne({
        where: { id: createDto.destinationAccountId },
      });

      if (!destAccount) {
        throw new NotFoundException('حساب مقصد یافت نشد');
      }

      if (!destAccount.is_active) {
        throw new BadRequestException('حساب مقصد غیرفعال است');
      }
    }

    // تولید شماره رسید اگر وجود نداشت
    const referenceNumber = createDto.referenceNumber ||
      await this.generateReferenceNumber(createDto.type);

    const transaction = this.transactionRepository.create({
      type: createDto.type,
      status: TransactionStatus.PENDING,
      amount: createDto.amount,
      category: createDto.category,
      payment_method: createDto.paymentMethod,
      account_id: createDto.accountId,
      destination_account_id: createDto.destinationAccountId,
      order_id: createDto.orderId,
      description: createDto.description,
      notes: createDto.notes,
      reference_number: referenceNumber,
      attachments: createDto.attachments,
      transaction_date: new Date(createDto.transactionDate),
      created_by: userId,
      metadata: createDto.metadata,
    });

    const saved = await this.transactionRepository.save(transaction);

    return TransactionMapper.toResponseDto(saved);
  }

  /**
   * تایید تراکنش و بروزرسانی موجودی
   */
  async approve(id: number, dto: ApproveTransactionDto, userId: number) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!transaction) {
      throw new NotFoundException('تراکنش یافت نشد');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('فقط تراکنش‌های در انتظار قابل تایید هستند');
    }

    // استفاده از Transaction برای یکپارچگی داده
    return await this.dataSource.transaction(async (manager) => {
      // بروزرسانی وضعیت تراکنش
      transaction.status = TransactionStatus.APPROVED;
      transaction.approved_by = userId;
      transaction.approved_at = new Date();
      transaction.notes = dto.notes || transaction.notes;

      await manager.save(transaction);

      // بروزرسانی موجودی حساب‌ها
      await this.updateAccountBalances(transaction, manager);

      return TransactionMapper.toResponseDto(transaction);
    });
  }

  /**
   * رد تراکنش
   */
  async reject(id: number, dto: RejectTransactionDto, userId: number) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('تراکنش یافت نشد');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('فقط تراکنش‌های در انتظار قابل رد هستند');
    }

    transaction.status = TransactionStatus.REJECTED;
    transaction.approved_by = userId;
    transaction.approved_at = new Date();
    transaction.rejection_reason = dto.reason;

    const updated = await this.transactionRepository.save(transaction);
    return TransactionMapper.toResponseDto(updated);
  }

  /**
   * دریافت لیست تراکنش‌ها با فیلتر
   */
  async findAll(filter: ITransactionFilter, page = 1, limit = 20) {
    const where: any = {};

    if (filter.type) where.type = filter.type;
    if (filter.status) where.status = filter.status;
    if (filter.paymentMethod) where.payment_method = filter.paymentMethod;
    if (filter.category) where.category = filter.category;
    if (filter.accountId) where.account_id = filter.accountId;
    if (filter.userId) where.created_by = filter.userId;

    // فیلتر تاریخ
    if (filter.fromDate || filter.toDate) {
      where.transaction_date = Between(
        filter.fromDate || new Date('2000-01-01'),
        filter.toDate || new Date(),
      );
    }

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where,
      relations: ['creator', 'approver', 'order'],
      order: { transaction_date: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: TransactionMapper.toResponseDtoList(transactions),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * دریافت تراکنش با ID
   */
  async findOne(id: number) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['creator', 'approver', 'order'],
    });

    if (!transaction) {
      throw new NotFoundException('تراکنش یافت نشد');
    }

    return TransactionMapper.toDetailedDto(transaction);
  }

  /**
   * بروزرسانی تراکنش
   */
  async update(id: number, updateDto: UpdateTransactionDto, userId: number) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('تراکنش یافت نشد');
    }

    // فقط تراکنش‌های Pending قابل ویرایش هستند
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('فقط تراکنش‌های در انتظار قابل ویرایش هستند');
    }

    // بروزرسانی فیلدها
    Object.assign(transaction, {
      status: updateDto.status ?? transaction.status,
      amount: updateDto.amount ?? transaction.amount,
      category: updateDto.category ?? transaction.category,
      payment_method: updateDto.paymentMethod ?? transaction.payment_method,
      description: updateDto.description ?? transaction.description,
      notes: updateDto.notes ?? transaction.notes,
      reference_number: updateDto.referenceNumber ?? transaction.reference_number,
      attachments: updateDto.attachments ?? transaction.attachments,
      rejection_reason: updateDto.rejectionReason ?? transaction.rejection_reason,
      metadata: updateDto.metadata ?? transaction.metadata,
    });

    const updated = await this.transactionRepository.save(transaction);
    return TransactionMapper.toResponseDto(updated);
  }

  /**
   * حذف تراکنش (نرم)
   */
  async remove(id: number, userId: number) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('تراکنش یافت نشد');
    }

    // فقط تراکنش‌های Pending یا Rejected قابل حذف هستند
    if (![TransactionStatus.PENDING, TransactionStatus.REJECTED].includes(transaction.status)) {
      throw new BadRequestException('تراکنش تایید شده قابل حذف نیست');
    }

    transaction.status = TransactionStatus.CANCELLED;
    await this.transactionRepository.save(transaction);

    return { message: 'تراکنش با موفقیت حذف شد' };
  }

  /**
   * خلاصه تراکنش‌ها
   */
  async getSummary(filter: ITransactionFilter): Promise<ITransactionSummary> {
    const where: any = {};

    if (filter.type) where.type = filter.type;
    if (filter.status) where.status = filter.status || TransactionStatus.APPROVED;
    if (filter.accountId) where.account_id = filter.accountId;

    if (filter.fromDate || filter.toDate) {
      where.transaction_date = Between(
        filter.fromDate || new Date('2000-01-01'),
        filter.toDate || new Date(),
      );
    }

    const transactions = await this.transactionRepository.find({ where });

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
      averageTransaction: transactions.length > 0
        ? (totalIncome + totalExpense) / transactions.length
        : 0,
    };
  }

  /**
   * تولید شماره رسید یکتا
   */
  private async generateReferenceNumber(type: TransactionType): Promise<string> {
    const prefix = type === TransactionType.INCOME ? 'INC' :
      type === TransactionType.EXPENSE ? 'EXP' : 'TRF';

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const count = await this.transactionRepository.count({
      where: {
        reference_number: Like(`${prefix}-${year}${month}-%`),
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `${prefix}-${year}${month}-${sequence}`;
  }

  /**
   * بروزرسانی موجودی حساب‌ها
   */
  private async updateAccountBalances(transaction: Transaction, manager: any) {
    const account = await manager.findOne(Account, {
      where: { id: transaction.account_id },
    });

    const amount = Number(transaction.amount);

    if (transaction.type === TransactionType.INCOME) {
      // افزایش موجودی
      account.current_balance = Number(account.current_balance) + amount;
    } else if (transaction.type === TransactionType.EXPENSE) {
      // کاهش موجودی
      const newBalance = Number(account.current_balance) - amount;
      if (newBalance < 0) {
        throw new BadRequestException('موجودی حساب کافی نیست');
      }
      account.current_balance = newBalance;
    } else if (transaction.type === TransactionType.TRANSFER) {
      // کاهش از حساب مبدا
      const newBalance = Number(account.current_balance) - amount;
      if (newBalance < 0) {
        throw new BadRequestException('موجودی حساب مبدا کافی نیست');
      }
      account.current_balance = newBalance;

      // افزایش به حساب مقصد
      const destAccount = await manager.findOne(Account, {
        where: { id: transaction.destination_account_id },
      });
      destAccount.current_balance = Number(destAccount.current_balance) + amount;
      await manager.save(destAccount);
    }

    await manager.save(account);
  }
}
