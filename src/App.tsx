import React, { useEffect } from 'react';
import { useTransactionStore } from './stores/transactionStore';
import { useLoadingState } from './hooks/useTransactionData';
import TransactionFilters from './components/TransactionFilters';
import TransactionTable from './components/TransactionTable';
import BalanceChart from './components/BalanceChart';
import './App.scss';

const App: React.FC = () => {
  const loadTransactions = useTransactionStore(state => state.loadTransactions);
  const { isLoading, hasError } = useLoadingState();

  useEffect(() => {
    loadTransactions(10000);
  }, [loadTransactions]);

  return (
    <div className="app">
      <header className="app__header">
        <h1>История транзакций</h1>
        {isLoading && (
          <div className="app__header-status" aria-live="polite">
            Загрузка данных...
          </div>
        )}
        {hasError && (
          <div className="app__header-status app__header-status--error" role="alert">
            Ошибка загрузки данных
          </div>
        )}
      </header>
      
      <main className="app__main">
        <aside className="app__filters" aria-label="Панель фильтров">
          <TransactionFilters />
        </aside>
        
        <section className="app__content">
          <div className="app__chart" aria-label="График баланса">
            <BalanceChart />
          </div>
          
          <div className="app__table" aria-label="Таблица транзакций">
            <TransactionTable />
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;