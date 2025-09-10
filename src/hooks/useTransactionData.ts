import { useMemo } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TransactionType, Currency } from '../types/transaction';
import { useTransactionStore } from '../stores/transactionStore';

export const useFormattedTransactions = () => {
  const filteredTransactions = useTransactionStore(state => state.filteredTransactions);

  return useMemo(() => {
    return filteredTransactions.map(transaction => ({
      ...transaction,
      formattedDate: format(new Date(transaction.date), 'dd.MM.yyyy HH:mm', { locale: ru }),
      formattedAmount: formatAmount(transaction.amount, transaction.currency),
      formattedType: formatTransactionType(transaction.type),
    }));
  }, [filteredTransactions]);
};

export const useBalanceChartData = () => {
  const stats = useTransactionStore(state => state.stats);

  return useMemo(() => {
    if (!stats || !stats.balanceHistory.length) {
      return [];
    }

    return stats.balanceHistory.map(point => ({
      date: format(new Date(point.date), 'dd.MM', { locale: ru }),
      fullDate: point.date,
      balance: point.balance,
      transactions: point.transactions,
      formattedBalance: formatAmount(point.balance, 'USD'), // Приводим к одной валюте для графика
    }));
  }, [stats]);
};

export const useFormattedStats = () => {
  const stats = useTransactionStore(state => state.stats);

  return useMemo(() => {
    if (!stats) {
      return null;
    }

    return {
      totalTransactions: stats.totalTransactions,
      totalDeposits: formatAmount(stats.totalDeposits, 'USD'),
      totalWithdraws: formatAmount(stats.totalWithdraws, 'USD'),
      totalTransfers: formatAmount(stats.totalTransfers, 'USD'),
      currentBalance: formatAmount(stats.currentBalance, 'USD'),
      balanceColor: stats.currentBalance >= 0 ? 'success' : 'danger',
    };
  }, [stats]);
};

export const useAvailableCurrencies = () => {
  const allTransactions = useTransactionStore(state => state.allTransactions);

  return useMemo(() => {
    const currencies = new Set<Currency>();
    allTransactions.forEach(transaction => {
      currencies.add(transaction.currency);
    });
    return Array.from(currencies).sort();
  }, [allTransactions]);
};

export const useDateRange = () => {
  const allTransactions = useTransactionStore(state => state.allTransactions);

  return useMemo(() => {
    if (allTransactions.length === 0) {
      return { minDate: null, maxDate: null };
    }

    const dates = allTransactions.map(t => new Date(t.date).getTime());
    const minTime = Math.min(...dates);
    const maxTime = Math.max(...dates);

    return {
      minDate: format(new Date(minTime), 'yyyy-MM-dd'),
      maxDate: format(new Date(maxTime), 'yyyy-MM-dd'),
    };
  }, [allTransactions]);
};

export const useLoadingState = () => {
  return useTransactionStore(state => ({
    loadingState: state.loadingState,
    error: state.error,
    isEmpty: state.filteredTransactions.length === 0 && state.loadingState === 'success',
    isLoading: state.loadingState === 'loading',
    hasError: state.loadingState === 'error',
  }));
};

function formatAmount(amount: number, currency: Currency): string {
  const formatters: Record<Currency, Intl.NumberFormatOptions> = {
    USD: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
    EUR: { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 },
    RUB: { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 },
    BTC: { style: 'decimal', minimumFractionDigits: 5, maximumFractionDigits: 8 },
    ETH: { style: 'decimal', minimumFractionDigits: 4, maximumFractionDigits: 6 },
  };

  const formatter = new Intl.NumberFormat('ru-RU', formatters[currency]);
  const formatted = formatter.format(amount);

  if (currency === 'BTC') {
    return `${formatted} ₿`;
  }
  if (currency === 'ETH') {
    return `${formatted} Ξ`;
  }

  return formatted;
}

function formatTransactionType(type: TransactionType): string {
  const typeLabels: Record<TransactionType, string> = {
    deposit: 'Пополнение',
    withdraw: 'Вывод',
    transfer: 'Перевод',
  };

  return typeLabels[type];
}

export function getTransactionTypeColor(type: TransactionType): string {
  const colors: Record<TransactionType, string> = {
    deposit: 'success',
    withdraw: 'danger',
    transfer: 'warning',
  };

  return colors[type];
}

export function getTransactionTypeIcon(type: TransactionType): string {
  const icons: Record<TransactionType, string> = {
    deposit: '↗️',
    withdraw: '↘️',
    transfer: '↔️',
  };

  return icons[type];
}