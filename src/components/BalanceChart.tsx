import React, { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useBalanceChartData, useFormattedStats, useLoadingState } from '../hooks/useTransactionData';
import './BalanceChart.scss';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      date: string;
      fullDate: string;
      balance: number;
      transactions: number;
      formattedBalance: string;
    };
  }>;
  label?: string;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;
  
  return (
    <div className="balance-chart__tooltip">
      <p className="balance-chart__tooltip-date">{data.fullDate}</p>
      <p className="balance-chart__tooltip-balance">
        <span className="balance-chart__tooltip-label">Баланс:</span>
        <span className={`balance-chart__tooltip-value ${data.balance >= 0 ? 'positive' : 'negative'}`}>
          {data.formattedBalance}
        </span>
      </p>
      <p className="balance-chart__tooltip-transactions">
        <span className="balance-chart__tooltip-label">Транзакций:</span>
        <span className="balance-chart__tooltip-value">{data.transactions}</span>
      </p>
    </div>
  );
};

const ChartLoadingState: React.FC = () => (
  <div className="balance-chart__loading">
    <div className="balance-chart__loading-skeleton">
      <div className="balance-chart__loading-line balance-chart__loading-line--1"></div>
      <div className="balance-chart__loading-line balance-chart__loading-line--2"></div>
      <div className="balance-chart__loading-line balance-chart__loading-line--3"></div>
    </div>
    <p>Загрузка данных графика...</p>
  </div>
);


const ChartEmptyState: React.FC = () => (
  <div className="balance-chart__empty">
    <div className="balance-chart__empty-icon">📊</div>
    <p>Нет данных для отображения</p>
    <p className="balance-chart__empty-suggestion">
      Попробуйте изменить фильтры
    </p>
  </div>
);

const BalanceStats: React.FC = () => {
  const stats = useFormattedStats();
  
  if (!stats) return null;

  return (
    <div className="balance-stats">
      <div className="balance-stats__item">
        <span className="balance-stats__label">Текущий баланс</span>
        <span className={`balance-stats__value balance-stats__value--${stats.balanceColor}`}>
          {stats.currentBalance}
        </span>
      </div>
      
      <div className="balance-stats__item">
        <span className="balance-stats__label">Всего транзакций</span>
        <span className="balance-stats__value">{stats.totalTransactions}</span>
      </div>
      
      <div className="balance-stats__grid">
        <div className="balance-stats__mini-item">
          <span className="balance-stats__mini-label">Пополнения</span>
          <span className="balance-stats__mini-value balance-stats__mini-value--success">
            {stats.totalDeposits}
          </span>
        </div>
        
        <div className="balance-stats__mini-item">
          <span className="balance-stats__mini-label">Выводы</span>
          <span className="balance-stats__mini-value balance-stats__mini-value--danger">
            {stats.totalWithdraws}
          </span>
        </div>
        
        <div className="balance-stats__mini-item">
          <span className="balance-stats__mini-label">Переводы</span>
          <span className="balance-stats__mini-value balance-stats__mini-value--warning">
            {stats.totalTransfers}
          </span>
        </div>
      </div>
    </div>
  );
};

const BalanceChart: React.FC = () => {
  const chartData = useBalanceChartData();
  const { isLoading, isEmpty } = useLoadingState();

  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return ['auto', 'auto'];
    
    const balances = chartData.map(d => d.balance);
    const min = Math.min(...balances);
    const max = Math.max(...balances);
    
    const range = max - min;
    const padding = range * 0.1;
    
    return [
      Math.floor(min - padding),
      Math.ceil(max + padding)
    ];
  }, [chartData]);

  const lineColor = useMemo(() => {
    if (chartData.length < 2) return '#3b82f6';
    
    const firstBalance = chartData[0].balance;
    const lastBalance = chartData[chartData.length - 1].balance;
    
    if (lastBalance > firstBalance) return '#10b981';
    if (lastBalance < firstBalance) return '#ef4444';
    return '#f59e0b';
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="balance-chart">
        <div className="balance-chart__header">
          <h3 className="balance-chart__title">График баланса</h3>
        </div>
        <ChartLoadingState />
      </div>
    );
  }

  if (isEmpty || chartData.length === 0) {
    return (
      <div className="balance-chart">
        <div className="balance-chart__header">
          <h3 className="balance-chart__title">График баланса</h3>
        </div>
        <ChartEmptyState />
      </div>
    );
  }

  return (
    <div className="balance-chart">
      <div className="balance-chart__header">
        <h3 className="balance-chart__title">График баланса</h3>
        <p className="balance-chart__subtitle">
          Накопительный баланс по отфильтрованным данным
        </p>
      </div>
      
      <BalanceStats />
      
      <div className="balance-chart__container">
        <ResponsiveContainer minHeight={400} width={'100%'}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="var(--color-border)"
              opacity={0.5}
            />
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
              tickLine={{ stroke: 'var(--color-border)' }}
              axisLine={{ stroke: 'var(--color-border)' }}
            />
            <YAxis 
              domain={yAxisDomain}
              tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
              tickLine={{ stroke: 'var(--color-border)' }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickFormatter={(value) => {
                if (Math.abs(value) >= 1000000) {
                  return `${(value / 1000000).toFixed(1)}M`;
                }
                if (Math.abs(value) >= 1000) {
                  return `${(value / 1000).toFixed(1)}K`;
                }
                return value.toFixed(0);
              }}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: lineColor, strokeWidth: 1, strokeDasharray: '5 5' }}
            />
            <ReferenceLine 
              y={0} 
              stroke="var(--color-text-muted)" 
              strokeDasharray="2 2"
              opacity={0.5}
            />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ 
                r: 4, 
                fill: lineColor,
                stroke: '#fff',
                strokeWidth: 2
              }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BalanceChart;