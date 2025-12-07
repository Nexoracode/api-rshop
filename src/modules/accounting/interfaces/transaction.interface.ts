import {
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  IncomeCategory,
  ExpenseCategory,
} from '../enums/transaction.enum';

/**
 * اطلاعات خلاصه تراکنش
 */
export interface ITransactionSummary {
  /** مجموع درآمد */
  totalIncome: number;
  
  /** مجموع هزینه */
  totalExpense: number;
  
  /** سود خالص */
  netProfit: number;
  
  /** تعداد تراکنش‌ها */
  transactionCount: number;
  
  /** میانگین تراکنش */
  averageTransaction: number;
}

/**
 * اطلاعات دسته‌بندی شده تراکنش
 */
export interface ICategorizedTransactions {
  /** تراکنش‌های درآمدی */
  income: {
    [key in IncomeCategory]?: {
      amount: number;
      count: number;
      percentage: number;
    };
  };
  
  /** تراکنش‌های هزینه */
  expense: {
    [key in ExpenseCategory]?: {
      amount: number;
      count: number;
      percentage: number;
    };
  };
}

/**
 * فیلتر جستجوی تراکنش
 */
export interface ITransactionFilter {
  /** نوع تراکنش */
  type?: TransactionType;
  
  /** وضعیت */
  status?: TransactionStatus;
  
  /** روش پرداخت */
  paymentMethod?: PaymentMethod;
  
  /** دسته‌بندی */
  category?: IncomeCategory | ExpenseCategory;
  
  /** از تاریخ */
  fromDate?: Date;
  
  /** تا تاریخ */
  toDate?: Date;
  
  /** حداقل مبلغ */
  minAmount?: number;
  
  /** حداکثر مبلغ */
  maxAmount?: number;
  
  /** شناسه حساب */
  accountId?: number;
  
  /** شناسه کاربر */
  userId?: number;
}

/**
 * گزارش تراکنش‌ها
 */
export interface ITransactionReport {
  /** خلاصه */
  summary: ITransactionSummary;
  
  /** دسته‌بندی شده */
  categorized: ICategorizedTransactions;
  
  /** تراکنش‌های روزانه */
  daily: Array<{
    date: string;
    income: number;
    expense: number;
    netProfit: number;
  }>;
  
  /** تراکنش‌های ماهانه */
  monthly: Array<{
    month: string;
    income: number;
    expense: number;
    netProfit: number;
  }>;
}

/**
 * اطلاعات موجودی حساب
 */
export interface IAccountBalance {
  /** شناسه حساب */
  accountId: number;
  
  /** نام حساب */
  accountName: string;
  
  /** موجودی فعلی */
  currentBalance: number;
  
  /** موجودی قابل برداشت */
  availableBalance: number;
  
  /** موجودی در انتظار */
  pendingBalance: number;
  
  /** آخرین تراکنش */
  lastTransaction?: {
    id: number;
    amount: number;
    date: Date;
    description: string;
  };
}
