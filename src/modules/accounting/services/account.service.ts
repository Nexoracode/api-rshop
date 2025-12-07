import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import { Account } from '../entities/account.entity';
import { CreateAccountDto, UpdateAccountDto } from '../dto/account.dto';
import { AccountMapper } from '../mappers/account.mapper';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * ایجاد حساب جدید
   */
  async create(createDto: CreateAccountDto, userId: number) {
    // بررسی تکراری نبودن کد حساب
    const existingCode = await this.accountRepository.findOne({
      where: { code: createDto.code },
    });

    if (existingCode) {
      throw new BadRequestException('کد حساب تکراری است');
    }

    // بررسی تکراری نبودن نام حساب
    const existingName = await this.accountRepository.findOne({
      where: { name: createDto.name },
    });

    if (existingName) {
      throw new BadRequestException('نام حساب تکراری است');
    }

    const account = this.accountRepository.create({
      name: createDto.name,
      code: createDto.code,
      type: createDto.type,
      currency: createDto.currency || 'IRR',
      initial_balance: createDto.initialBalance || 0,
      current_balance: createDto.initialBalance || 0,
      description: createDto.description,
      account_number: createDto.accountNumber,
      bank_name: createDto.bankName,
      iban: createDto.iban,
      card_number: createDto.cardNumber,
      is_default: createDto.isDefault || false,
      settings: createDto.settings,
    });

    // اگر این حساب پیش‌فرض است، بقیه را غیرفعال کن
    if (account.is_default) {
      await this.accountRepository.update(
        { is_default: true },
        { is_default: false },
      );
    }

    const saved = await this.accountRepository.save(account);
    return AccountMapper.toResponseDto(saved);
  }

  /**
   * دریافت لیست حساب‌ها
   */
  async findAll(isActive?: boolean) {
    const where: any = {};

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    const accounts = await this.accountRepository.find({
      where,
      order: { is_default: 'DESC', name: 'ASC' },
    });

    return AccountMapper.toResponseDtoList(accounts);
  }

  /**
   * دریافت حساب با ID
   */
  async findOne(id: number) {
    const account = await this.accountRepository.findOne({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('حساب یافت نشد');
    }

    return AccountMapper.toResponseDto(account);
  }

  /**
   * دریافت حساب پیش‌فرض
   */
  async getDefaultAccount() {
    const account = await this.accountRepository.findOne({
      where: { is_default: true, is_active: true },
    });

    if (!account) {
      throw new NotFoundException('حساب پیش‌فرض یافت نشد');
    }

    return AccountMapper.toResponseDto(account);
  }

  /**
   * بروزرسانی حساب
   */
  async update(id: number, updateDto: UpdateAccountDto) {
    const account = await this.accountRepository.findOne({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('حساب یافت نشد');
    }

    // بررسی تکراری نبودن نام (در صورت تغییر)
    if (updateDto.name && updateDto.name !== account.name) {
      const existingName = await this.accountRepository.findOne({
        where: { name: updateDto.name },
      });

      if (existingName) {
        throw new BadRequestException('نام حساب تکراری است');
      }
    }

    // بروزرسانی فیلدها
    Object.assign(account, {
      name: updateDto.name ?? account.name,
      type: updateDto.type ?? account.type,
      description: updateDto.description ?? account.description,
      account_number: updateDto.accountNumber ?? account.account_number,
      bank_name: updateDto.bankName ?? account.bank_name,
      iban: updateDto.iban ?? account.iban,
      card_number: updateDto.cardNumber ?? account.card_number,
      is_active: updateDto.isActive ?? account.is_active,
      is_default: updateDto.isDefault ?? account.is_default,
      settings: updateDto.settings ?? account.settings,
    });

    // اگر این حساب پیش‌فرض شد، بقیه را غیرفعال کن
    if (account.is_default && updateDto.isDefault) {
      await this.accountRepository.update(
        { id: Not(id), is_default: true },
        { is_default: false },
      );
    }

    const updated = await this.accountRepository.save(account);
    return AccountMapper.toResponseDto(updated);
  }

  /**
   * حذف حساب
   */
  async remove(id: number) {
    const account = await this.accountRepository.findOne({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('حساب یافت نشد');
    }

    // بررسی عدم وجود تراکنش برای این حساب
    // این قسمت باید با سرویس تراکنش چک شود

    await this.accountRepository.remove(account);

    return { message: 'حساب با موفقیت حذف شد' };
  }

  /**
   * بروزرسانی موجودی حساب
   */
  async updateBalance(
    accountId: number,
    amount: number,
    operation: 'add' | 'subtract',
  ) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('حساب یافت نشد');
    }

    const currentBalance = Number(account.current_balance);

    if (operation === 'add') {
      account.current_balance = currentBalance + amount;
    } else {
      const newBalance = currentBalance - amount;

      if (newBalance < 0) {
        throw new BadRequestException('موجودی حساب کافی نیست');
      }

      account.current_balance = newBalance;
    }

    await this.accountRepository.save(account);
    return AccountMapper.toResponseDto(account);
  }

  /**
   * دریافت موجودی حساب
   */
  async getBalance(accountId: number) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
      select: ['id', 'name', 'code', 'current_balance', 'currency'],
    });

    if (!account) {
      throw new NotFoundException('حساب یافت نشد');
    }

    return {
      accountId: account.id,
      accountName: account.name,
      code: account.code,
      balance: Number(account.current_balance),
      currency: account.currency,
    };
  }
}
