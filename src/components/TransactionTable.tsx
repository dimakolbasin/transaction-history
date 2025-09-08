import React from 'react';
import { useFormattedTransactions, useLoadingState, getTransactionTypeColor, getTransactionTypeIcon } from '~/hooks/useTransactionData';
import { useTransactionStore } from '~/stores/transactionStore';
import { Sort, SortField } from '~/types/transaction';
import './TransactionTable.scss';

interface TableRowProps {
  transaction: ReturnType<typeof useFormattedTransactions>[0];
  index: number;
}

const TableRow: React.FC<TableRowProps> = ({ transaction, index }) => {
  const typeColor = getTransactionTypeColor(transaction.type);
  const typeIcon = getTransactionTypeIcon(transaction.type);

  return (
    <div 
      className={`transaction-row ${index % 2 === 0 ? 'transaction-row--even' : 'transaction-row--odd'}`}
      role="row"
    >
      <div className="transaction-row__cell transaction-row__cell--date" role="gridcell">
        <span className="transaction-row__date-primary">{transaction.formattedDate.split(' ')[0]}</span>
        <span className="transaction-row__date-secondary">{transaction.formattedDate.split(' ')[1]}</span>
      </div>
      
      <div className="transaction-row__cell transaction-row__cell--type" role="gridcell">
        <span className={`transaction-type transaction-type--${typeColor}`}>
          <span className="transaction-type__icon" aria-hidden="true">{typeIcon}</span>
          <span className="transaction-type__text">{transaction.formattedType}</span>
        </span>
      </div>
      
      <div className="transaction-row__cell transaction-row__cell--amount" role="gridcell">
        <span className={`transaction-amount transaction-amount--${typeColor}`}>
          {transaction.formattedAmount}
        </span>
      </div>
      
      <div className="transaction-row__cell transaction-row__cell--currency" role="gridcell">
        <span className="transaction-currency">{transaction.currency}</span>
      </div>
      
      <div className="transaction-row__cell transaction-row__cell--description" role="gridcell">
        <span className="transaction-description" title={transaction.description}>
          {transaction.description}
        </span>
      </div>
      
      <div className="transaction-row__cell transaction-row__cell--id" role="gridcell">
        <span className="transaction-id">{transaction.id}</span>
      </div>
    </div>
  );
};

const TableHeader: React.FC = () => {
  const { sort, setSort } = useTransactionStore(state => ({
    sort: state.sort,
    setSort: state.setSort,
  }));

  const handleSort = (field: SortField) => {
    const newDirection = sort.field === field && sort.direction === 'desc' ? 'asc' : 'desc';
    setSort({ field, direction: newDirection });
  };

  const getSortIcon = (field: SortField) => {
    if (sort.field !== field) return '↕️';
    return sort.direction === 'desc' ? '↓' : '↑';
  };

  return (
    <div className="transaction-header" role="row">
      <div className="transaction-header__cell transaction-header__cell--date" role="columnheader">
        <button
          className="transaction-header__sort-button"
          onClick={() => handleSort('date')}
          aria-label={`Сортировать по дате ${sort.field === 'date' ? (sort.direction === 'desc' ? 'по возрастанию' : 'по убыванию') : ''}`}
        >
          <span>Дата и время</span>
          <span className="transaction-header__sort-icon">{getSortIcon('date')}</span>
        </button>
      </div>
      
      <div className="transaction-header__cell transaction-header__cell--type" role="columnheader">
        <button
          className="transaction-header__sort-button"
          onClick={() => handleSort('type')}
          aria-label={`Сортировать по типу ${sort.field === 'type' ? (sort.direction === 'desc' ? 'по возрастанию' : 'по убыванию') : ''}`}
        >
          <span>Тип</span>
          <span className="transaction-header__sort-icon">{getSortIcon('type')}</span>
        </button>
      </div>
      
      <div className="transaction-header__cell transaction-header__cell--amount" role="columnheader">
        <button
          className="transaction-header__sort-button"
          onClick={() => handleSort('amount')}
          aria-label={`Сортировать по сумме ${sort.field === 'amount' ? (sort.direction === 'desc' ? 'по возрастанию' : 'по убыванию') : ''}`}
        >
          <span>Сумма</span>
          <span className="transaction-header__sort-icon">{getSortIcon('amount')}</span>
        </button>
      </div>
      
      <div className="transaction-header__cell transaction-header__cell--currency" role="columnheader">
        <span>Валюта</span>
      </div>
      
      <div className="transaction-header__cell transaction-header__cell--description" role="columnheader">
        <span>Описание</span>
      </div>
      
      <div className="transaction-header__cell transaction-header__cell--id" role="columnheader">
        <span>ID</span>
      </div>
    </div>
  );
};

const LoadingState: React.FC = () => (
  <div className="transaction-table__loading" aria-live="polite">
    <div className="transaction-table__spinner" aria-hidden="true"></div>
    <p>Загрузка транзакций...</p>
  </div>
);

const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className="transaction-table__error" role="alert">
    <p>Ошибка загрузки данных:</p>
    <p className="transaction-table__error-message">{error}</p>
    <button 
      className="transaction-table__retry-button"
      onClick={() => useTransactionStore.getState().loadTransactions()}
    >
      Повторить попытку
    </button>
  </div>
);

const EmptyState: React.FC = () => (
  <div className="transaction-table__empty" aria-live="polite">
    <p>Транзакции не найдены</p>
    <p className="transaction-table__empty-suggestion">
      Попробуйте изменить фильтры или очистить их
    </p>
  </div>
);


const TransactionTable: React.FC = () => {
  const transactions = useFormattedTransactions();
  const { isLoading, hasError, isEmpty, error } = useLoadingState();

  const pageSize = 10;
  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));
  const from = (page - 1) * pageSize;
  const to = Math.min(from + pageSize, transactions.length);
  const pageItems = React.useMemo(() => transactions.slice(from, to), [transactions, from, to]);

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (hasError && error) {
    return <ErrorState error={error} />;
  }

  if (isEmpty) {
    return <EmptyState />;
  }

  return (
    <div className="transaction-table" role="grid" aria-label="Таблица транзакций">
      <TableHeader />
      
      <div className="transaction-table__body" role="rowgroup">
        {pageItems.map((transaction, index) => (
          <TableRow
            key={transaction.id}
            transaction={transaction}
            index={from + index}
          />
        ))}
      </div>
      
      <div className="transaction-table__footer">
        <span className="transaction-table__count">
          Показано {transactions.length === 0 ? 0 : from + 1}–{to} из {transactions.length} транзакций
        </span>
        <div className="transaction-table__pagination" aria-label="Постраничная навигация">
          <button
            className="transaction-table__page-btn"
            onClick={() => setPage(1)}
            disabled={page === 1}
            aria-label="Первая страница"
          >
            «
          </button>
          <button
            className="transaction-table__page-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Предыдущая страница"
          >
            ‹
          </button>
          <span className="transaction-table__page-info">
            Страница {page} из {totalPages}
          </span>
          <button
            className="transaction-table__page-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Следующая страница"
          >
            ›
          </button>
          <button
            className="transaction-table__page-btn"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            aria-label="Последняя страница"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionTable;