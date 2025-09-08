import { Transaction, TransactionType, Currency } from '~/types/transaction';

const TRANSACTION_TYPES: TransactionType[] = ['deposit', 'withdraw', 'transfer'];
const CURRENCIES: Currency[] = ['USD', 'EUR', 'RUB', 'BTC', 'ETH'];

const DESCRIPTIONS = {
  deposit: [
    'Пополнение через карту',
    'Банковский перевод',
    'Пополнение через PayPal',
    'Зачисление зарплаты',
    'Возврат средств',
    'Пополнение через криптокошелек',
  ],
  withdraw: [
    'Вывод на карту',
    'Банковский перевод',
    'Вывод через PayPal',
    'Покупка товара',
    'Оплата услуг',
    'Вывод на криптокошелек',
  ],
  transfer: [
    'Перевод другому пользователю',
    'Внутренний перевод',
    'Обмен валют',
    'Перевод на сберегательный счет',
    'Инвестиционный перевод',
  ],
};

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomFromArray<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateAmount(type: TransactionType, currency: Currency): number {
  let baseAmount: number;
  
  switch (currency) {
    case 'USD':
    case 'EUR':
      baseAmount = randomBetween(10, 5000);
      break;
    case 'RUB':
      baseAmount = randomBetween(500, 300000);
      break;
    case 'BTC':
      baseAmount = randomBetween(0.001, 1);
      break;
    case 'ETH':
      baseAmount = randomBetween(0.01, 10);
      break;
    default:
      baseAmount = randomBetween(10, 5000);
  }

  if (type === 'deposit' && Math.random() < 0.2) {
    baseAmount *= randomBetween(2, 10);
  }

  if (currency === 'BTC' || currency === 'ETH') {
    return Math.round(baseAmount * 100000) / 100000;
  } else if (currency === 'RUB') {
    return Math.round(baseAmount);
  } else {
    return Math.round(baseAmount * 100) / 100;
  }
}

function generateTransaction(index: number, date?: Date): Transaction {
  const type = randomFromArray(TRANSACTION_TYPES);
  const currency = randomFromArray(CURRENCIES);
  const amount = generateAmount(type, currency);
  const description = randomFromArray(DESCRIPTIONS[type]);

  const transactionDate = date || randomDate(
    new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    new Date()
  );

  return {
    id: `t${index.toString().padStart(6, '0')}`,
    type,
    amount,
    currency,
    date: transactionDate.toISOString(),
    description,
  };
}

export function generateTransactions(count: number = 10000): Transaction[] {
  const transactions: Transaction[] = [];
  const now = new Date();
  const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  for (let i = 1; i <= count; i++) {
    const dateWeight = Math.random();
    let transactionDate: Date;
    
    if (dateWeight < 0.4) {
      transactionDate = randomDate(
        new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        now
      );
    } else if (dateWeight < 0.7) {
      transactionDate = randomDate(
        new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
        new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      );
    } else {
      transactionDate = randomDate(yearAgo, new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000));
    }

    transactions.push(generateTransaction(i, transactionDate));
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function cacheTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem('mockTransactions', JSON.stringify(transactions));
    localStorage.setItem('mockTransactionsTimestamp', Date.now().toString());
  } catch (error) {
    console.warn('Не удалось сохранить транзакции в localStorage:', error);
  }
}

export function loadCachedTransactions(): Transaction[] | null {
  try {
    const cached = localStorage.getItem('mockTransactions');
    const timestamp = localStorage.getItem('mockTransactionsTimestamp');
    
    if (!cached || !timestamp) {
      return null;
    }

    const cacheAge = Date.now() - parseInt(timestamp, 10);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (cacheAge > maxAge) {
      localStorage.removeItem('mockTransactions');
      localStorage.removeItem('mockTransactionsTimestamp');
      return null;
    }

    return JSON.parse(cached);
  } catch (error) {
    console.warn('Не удалось загрузить транзакции из localStorage:', error);
    return null;
  }
}

export function getTransactions(count: number = 10000): Transaction[] {
  const cached = loadCachedTransactions();
  
  if (cached && cached.length >= count) {
    return cached.slice(0, count);
  }

  console.log(`Генерация ${count} транзакций...`);
  const transactions = generateTransactions(count);
  cacheTransactions(transactions);
  
  return transactions;
}