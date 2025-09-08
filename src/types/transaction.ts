export type TransactionType = 'deposit' | 'withdraw' | 'transfer';

export type Currency = 'USD' | 'EUR' | 'RUB' | 'BTC' | 'ETH';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  date: string; // ISO string
  description?: string;
}

export interface TransactionFilters {
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  type?: TransactionType;
  minAmount?: number;
  currency?: Currency;
  search?: string;
}

export type SortField = 'date' | 'amount' | 'type';
export type SortDirection = 'asc' | 'desc';

export interface Sort {
  field: SortField;
  direction: SortDirection;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface BalancePoint {
  date: string;
  balance: number;
  transactions: number;
}


export interface TransactionStats {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdraws: number;
  totalTransfers: number;
  currentBalance: number;
  balanceHistory: BalancePoint[];
}