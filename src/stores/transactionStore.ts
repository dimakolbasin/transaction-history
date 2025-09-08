import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  Transaction, 
  TransactionFilters, 
  Sort, 
  LoadingState, 
  TransactionStats,
} from '~/types/transaction';
import { getTransactions } from '~/utils/mockDataGenerator';

/**
 * Интерфейс состояния транзакций
 */
interface TransactionState {
  // Данные
  allTransactions: Transaction[];
  filteredTransactions: Transaction[];
  
  // UI состояние
  loadingState: LoadingState;
  error: string | null;
  
  // Фильтры и сортировка
  filters: TransactionFilters;
  sort: Sort;
  
  // Статистика
  stats: TransactionStats | null;
  
  // Actions
  loadTransactions: (count?: number) => Promise<void>;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  clearFilters: () => void;
  setSort: (sort: Sort) => void;
  
  // Приватные методы
  _applyFiltersAndSort: () => void;
  _calculateStats: () => void;
}

/**
 * Функция для фильтрации транзакций
 */
function filterTransactions(transactions: Transaction[], filters: TransactionFilters): Transaction[] {
  return transactions.filter(transaction => {
    // Фильтр по дате от
    if (filters.dateFrom) {
      const transactionDate = new Date(transaction.date);
      const fromDate = new Date(filters.dateFrom);
      if (transactionDate < fromDate) return false;
    }
    
    // Фильтр по дате до
    if (filters.dateTo) {
      const transactionDate = new Date(transaction.date);
      const toDate = new Date(filters.dateTo);
      if (transactionDate > toDate) return false;
    }
    
    // Фильтр по типу
    if (filters.type && transaction.type !== filters.type) {
      return false;
    }
    
    // Фильтр по минимальной сумме
    if (filters.minAmount !== undefined && transaction.amount < filters.minAmount) {
      return false;
    }
    
    // Фильтр по валюте
    if (filters.currency && transaction.currency !== filters.currency) {
      return false;
    }
    
    // Поиск по описанию
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const description = transaction.description?.toLowerCase() || '';
      const id = transaction.id.toLowerCase();
      
      if (!description.includes(searchTerm) && !id.includes(searchTerm)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Функция для сортировки транзакций
 */
function sortTransactions(transactions: Transaction[], sort: Sort): Transaction[] {
  const sorted = [...transactions];
  
  sorted.sort((a, b) => {
    let compareValue = 0;
    
    switch (sort.field) {
      case 'date':
        compareValue = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'amount':
        compareValue = a.amount - b.amount;
        break;
      case 'type':
        compareValue = a.type.localeCompare(b.type);
        break;
    }
    
    return sort.direction === 'desc' ? -compareValue : compareValue;
  });
  
  return sorted;
}

/**
 * Вычисляет статистику и историю баланса
 */
function calculateStats(transactions: Transaction[]): TransactionStats {
  const stats: TransactionStats = {
    totalTransactions: transactions.length,
    totalDeposits: 0,
    totalWithdraws: 0,
    totalTransfers: 0,
    currentBalance: 0,
    balanceHistory: [],
  };
  
  // Группируем транзакции по дням для графика
  const dailyData = new Map<string, { balance: number; transactions: number }>();
  let runningBalance = 0;
  
  // Сортируем по дате (старые первыми) для правильного расчета баланса
  const sortedByDate = [...transactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  sortedByDate.forEach(transaction => {
    // Обновляем статистику по типам
    switch (transaction.type) {
      case 'deposit':
        stats.totalDeposits += transaction.amount;
        runningBalance += transaction.amount;
        break;
      case 'withdraw':
        stats.totalWithdraws += transaction.amount;
        runningBalance -= transaction.amount;
        break;
      case 'transfer':
        stats.totalTransfers += transaction.amount;
        // Для упрощения считаем transfer как нейтральную операцию
        break;
    }
    
    // Добавляем к дневной статистике
    const dateKey = transaction.date.split('T')[0]; // YYYY-MM-DD
    const existing = dailyData.get(dateKey) || { balance: runningBalance, transactions: 0 };
    dailyData.set(dateKey, {
      balance: runningBalance,
      transactions: existing.transactions + 1,
    });
  });
  
  // Преобразуем в массив для графика
  stats.balanceHistory = Array.from(dailyData.entries())
    .map(([date, data]) => ({
      date,
      balance: data.balance,
      transactions: data.transactions,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  stats.currentBalance = runningBalance;
  
  return stats;
}

/**
 * Создание store
 */
export const useTransactionStore = create<TransactionState>()(
  devtools(
    (set, get) => ({
      // Начальное состояние
      allTransactions: [],
      filteredTransactions: [],
      loadingState: 'idle',
      error: null,
      filters: {},
      sort: { field: 'date', direction: 'desc' },
      stats: null,
      
      // Загрузка транзакций
      loadTransactions: async (count = 10000) => {
        set({ loadingState: 'loading', error: null });
        
        try {
          // Симулируем загрузку для демонстрации loading состояния
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const transactions = getTransactions(count);
          
          set({ 
            allTransactions: transactions,
            loadingState: 'success',
          });
          
          // Применяем фильтры и пересчитываем статистику
          get()._applyFiltersAndSort();
          get()._calculateStats();
          
        } catch (error) {
          set({ 
            loadingState: 'error',
            error: error instanceof Error ? error.message : 'Ошибка загрузки данных'
          });
        }
      },
      
      // Установка фильтров
      setFilters: (newFilters) => {
        const currentFilters = get().filters;
        const updatedFilters = { ...currentFilters, ...newFilters };
        
        set({ filters: updatedFilters });
        get()._applyFiltersAndSort();
        get()._calculateStats();
      },
      
      // Очистка фильтров
      clearFilters: () => {
        set({ filters: {} });
        get()._applyFiltersAndSort();
        get()._calculateStats();
      },
      
      // Установка сортировки
      setSort: (sort) => {
        set({ sort });
        get()._applyFiltersAndSort();
      },
      
      // Применение фильтров и сортировки
      _applyFiltersAndSort: () => {
        const { allTransactions, filters, sort } = get();
        
        let filtered = filterTransactions(allTransactions, filters);
        filtered = sortTransactions(filtered, sort);
        
        set({ filteredTransactions: filtered });
      },
      
      // Пересчет статистики
      _calculateStats: () => {
        const { filteredTransactions } = get();
        const stats = calculateStats(filteredTransactions);
        set({ stats });
      },
    }),
    {
      name: 'transaction-store',
    }
  )
);