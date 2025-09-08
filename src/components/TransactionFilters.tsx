import React, { useState, useCallback, useMemo } from 'react';
import { useTransactionStore } from '../stores/transactionStore';
import { useAvailableCurrencies, useDateRange } from '../hooks/useTransactionData';
import { TransactionType, Currency, TransactionFilters as FilterType } from '../types/transaction';
import './TransactionFilters.scss';

const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: 'deposit', label: 'Пополнение' },
  { value: 'withdraw', label: 'Вывод' },
  { value: 'transfer', label: 'Перевод' },
];

const TransactionFilters: React.FC = () => {
  const { filters, setFilters, clearFilters, loadingState } = useTransactionStore(state => ({
    filters: state.filters,
    setFilters: state.setFilters,
    clearFilters: state.clearFilters,
    loadingState: state.loadingState,
  }));

  const availableCurrencies = useAvailableCurrencies();
  const { minDate, maxDate } = useDateRange();
  
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [minAmountValue, setMinAmountValue] = useState(filters.minAmount?.toString() || '');

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setFilters({ search: value || undefined });
    }, 300),
    [setFilters]
  );

  const debouncedMinAmount = useCallback(
    debounce((value: string) => {
      const numValue = parseFloat(value);
      setFilters({ minAmount: isNaN(numValue) || numValue <= 0 ? undefined : numValue });
    }, 500),
    [setFilters]
  );

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters({ dateFrom: value || undefined });
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters({ dateTo: value || undefined });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilters({ type: value ? value as TransactionType : undefined });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilters({ currency: value ? value as Currency : undefined });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  const handleMinAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMinAmountValue(value);
    debouncedMinAmount(value);
  };

  const handleQuickDateFilter = (days: number) => {
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - days);
    
    setFilters({
      dateFrom: fromDate.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
    });
  };

  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).length > 0;
  }, [filters]);

  const isDisabled = loadingState === 'loading';

  return (
    <div className="transaction-filters">
      <div className="transaction-filters__header">
        <h2 className="transaction-filters__title">Фильтры</h2>
        {hasActiveFilters && (
          <button
            className="transaction-filters__clear-button"
            onClick={clearFilters}
            disabled={isDisabled}
            aria-label="Очистить все фильтры"
          >
            Сбросить
          </button>
        )}
      </div>

      <div className="transaction-filters__content">
        {/* Поиск */}
        <div className="transaction-filters__group">
          <label htmlFor="search-filter" className="transaction-filters__label">
            Поиск
          </label>
          <input
            id="search-filter"
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Поиск по описанию или ID"
            className="transaction-filters__input"
            disabled={isDisabled}
            aria-describedby="search-help"
          />
          <small id="search-help" className="transaction-filters__help">
            Поиск в описании транзакции и ID
          </small>
        </div>

        {/* Диапазон дат */}
        <div className="transaction-filters__group">
          <label className="transaction-filters__label">Период</label>
          
          {/* Быстрые фильтры */}
          <div className="transaction-filters__quick-dates">
            <button
              type="button"
              onClick={() => handleQuickDateFilter(7)}
              className="transaction-filters__quick-button"
              disabled={isDisabled}
            >
              7 дней
            </button>
            <button
              type="button"
              onClick={() => handleQuickDateFilter(30)}
              className="transaction-filters__quick-button"
              disabled={isDisabled}
            >
              30 дней
            </button>
            <button
              type="button"
              onClick={() => handleQuickDateFilter(90)}
              className="transaction-filters__quick-button"
              disabled={isDisabled}
            >
              3 месяца
            </button>
          </div>

          {/* Кастомный диапазон */}
          <div className="transaction-filters__date-range">
            <div className="transaction-filters__date-input">
              <label htmlFor="date-from" className="transaction-filters__date-label">От</label>
              <input
                id="date-from"
                type="date"
                value={filters.dateFrom || ''}
                onChange={handleDateFromChange}
                min={minDate || undefined}
                max={filters.dateTo || maxDate || undefined}
                className="transaction-filters__input transaction-filters__input--date"
                disabled={isDisabled}
              />
            </div>
            <div className="transaction-filters__date-input">
              <label htmlFor="date-to" className="transaction-filters__date-label">До</label>
              <input
                id="date-to"
                type="date"
                value={filters.dateTo || ''}
                onChange={handleDateToChange}
                min={filters.dateFrom || minDate || undefined}
                max={maxDate || undefined}
                className="transaction-filters__input transaction-filters__input--date"
                disabled={isDisabled}
              />
            </div>
          </div>
        </div>

        {/* Тип транзакции */}
        <div className="transaction-filters__group">
          <label htmlFor="type-filter" className="transaction-filters__label">
            Тип операции
          </label>
          <select
            id="type-filter"
            value={filters.type || ''}
            onChange={handleTypeChange}
            className="transaction-filters__select"
            disabled={isDisabled}
          >
            <option value="">Все типы</option>
            {TRANSACTION_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Валюта */}
        <div className="transaction-filters__group">
          <label htmlFor="currency-filter" className="transaction-filters__label">
            Валюта
          </label>
          <select
            id="currency-filter"
            value={filters.currency || ''}
            onChange={handleCurrencyChange}
            className="transaction-filters__select"
            disabled={isDisabled}
          >
            <option value="">Все валюты</option>
            {availableCurrencies.map(currency => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>

        {/* Минимальная сумма */}
        <div className="transaction-filters__group">
          <label htmlFor="min-amount-filter" className="transaction-filters__label">
            Минимальная сумма
          </label>
          <input
            id="min-amount-filter"
            type="number"
            value={minAmountValue}
            onChange={handleMinAmountChange}
            placeholder="0"
            min="0"
            step="0.01"
            className="transaction-filters__input"
            disabled={isDisabled}
            aria-describedby="min-amount-help"
          />
          <small id="min-amount-help" className="transaction-filters__help">
            Показать транзакции от указанной суммы
          </small>
        </div>
      </div>
    </div>
  );
};

function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default TransactionFilters;