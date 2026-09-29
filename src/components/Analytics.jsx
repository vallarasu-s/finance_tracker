import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  Layers, 
  DollarSign,
  Calendar
} from 'lucide-react';
import { formatCurrency, CATEGORIES } from '../services/storage';
import CurrencyCalculator from './CurrencyCalculator';

export default function Analytics({ transactions, goals, settings }) {
  const symbol = settings.currencySymbol || '$';
  const [timeframe, setTimeframe] = useState('7'); // '7', '14', '30', 'yearly'

  // Financial balance calculations for currency converter
  const totalIncomeAll = useMemo(() => 
    transactions.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0)
  , [transactions]);

  const totalExpenseAll = useMemo(() => 
    transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0)
  , [transactions]);

  const currentBalance = totalIncomeAll - totalExpenseAll;

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayIncome = useMemo(() => 
    transactions.filter(t => t.date === todayStr && t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0)
  , [transactions, todayStr]);

  // Compute daily or monthly data points for bar chart
  const barChartData = useMemo(() => {
    const result = [];
    const today = new Date();

    if (timeframe === 'yearly') {
      // 12 Months of the year (rolling 12 months)
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        const fullDate = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const monthTxs = transactions.filter(t => (t.date || '').startsWith(yearMonth));
        const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);

        result.push({ date: yearMonth, label, fullDate, income, expense });
      }
    } else {
      const days = parseInt(timeframe, 10);
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const dayTxs = transactions.filter(t => t.date === dStr);
        const income = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const expense = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);

        result.push({ date: dStr, label, fullDate: dStr, income, expense });
      }
    }

    // If all values are zero (e.g. fresh transactions list), supply sample baselines in yearly view
    if (timeframe === 'yearly') {
      const hasData = result.some(r => r.income > 0 || r.expense > 0);
      if (!hasData && transactions.length === 0) {
        const demoHeights = [
          { income: 4500, expense: 2200 },
          { income: 5200, expense: 2800 },
          { income: 6100, expense: 3400 },
          { income: 4900, expense: 2600 },
          { income: 7200, expense: 3800 },
          { income: 6800, expense: 3100 },
          { income: 5900, expense: 2900 },
          { income: 8400, expense: 4100 },
          { income: 7600, expense: 3500 },
          { income: 6900, expense: 3200 },
          { income: 8200, expense: 3900 },
          { income: 9100, expense: 4300 }
        ];
        return result.map((r, idx) => ({ ...r, ...demoHeights[idx % demoHeights.length] }));
      }
    }

    return result;
  }, [transactions, timeframe]);

  // Max value for chart Y scaling
  const maxBarValue = useMemo(() => {
    let max = 100;
    for (const d of barChartData) {
      if (d.income > max) max = d.income;
      if (d.expense > max) max = d.expense;
    }
    return max * 1.15; // 15% headroom
  }, [barChartData]);

  // Compute Category Breakdown for Doughnut Chart
  const categoryBreakdown = useMemo(() => {
    const map = {};
    let totalExpense = 0;

    let filteredTxs = transactions;
    if (timeframe === 'yearly') {
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      filteredTxs = transactions.filter(t => (t.date || '') >= yearStart);
    } else {
      const days = parseInt(timeframe, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      filteredTxs = transactions.filter(t => (t.date || '') >= cutoffStr);
    }

    // Fallback to all transactions if filtered set has no expenses
    if (filteredTxs.filter(t => t.type === 'expense').length === 0) {
      filteredTxs = transactions;
    }

    for (const t of filteredTxs) {
      if (t.type === 'expense') {
        const amt = Number(t.amount) || 0;
        totalExpense += amt;
        map[t.category] = (map[t.category] || 0) + amt;
      }
    }

    const items = Object.keys(map).map(catId => {
      const catMeta = CATEGORIES.expense.find(c => c.id === catId) || { name: catId, color: '#64748B', icon: '📦' };
      const amount = map[catId];
      const percent = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
      return {
        id: catId,
        name: catMeta.name,
        icon: catMeta.icon,
        color: catMeta.color,
        amount,
        percent
      };
    });

    items.sort((a, b) => b.amount - a.amount);
    return { items, totalExpense };
  }, [transactions, timeframe]);

  // Hover state for interactive tooltip
  const [hoveredBar, setHoveredBar] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Analytics Header Toolbar */}
      <div className="daily-banner">
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Financial Insights & Analytics
          </span>
          <h2 className="daily-banner-title" style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={24} color="var(--color-brand)" /> Spending Patterns & Distribution
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Fully rendered locally without external tracking or connectivity requirements
          </p>
        </div>

        <div className="toolbar-group">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Period:</span>
          {[
            { id: '7', label: '7 Days' },
            { id: '14', label: '14 Days' },
            { id: '30', label: '30 Days' },
            { id: 'yearly', label: 'Yearly' }
          ].map(p => (
            <button
              key={p.id}
              className={`btn btn-secondary ${timeframe === p.id ? 'btn-primary' : ''}`}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
              onClick={() => setTimeframe(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Bar Chart & Doughnut Chart */}
      <div className="analytics-charts-grid">
        {/* Daily Inflow vs Outflow Bar Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BarChart3 size={18} color="var(--color-brand)" /> {timeframe === 'yearly' ? 'Monthly Income vs. Expense (12 Months)' : 'Daily Income vs. Expense'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-income)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--color-income)' }} />
                Income
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-expense)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--color-expense)' }} />
                Expense
              </span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div style={{ position: 'relative', width: '100%', height: '260px', marginTop: '0.5rem' }}>
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 600 240" 
              preserveAspectRatio="none"
              style={{ overflow: 'visible' }}
            >
              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = 200 - ratio * 180;
                return (
                  <g key={idx}>
                    <line x1="0" y1={y} x2="600" y2={y} stroke="var(--border-subtle)" strokeDasharray="4 4" strokeWidth="1" />
                    <text x="6" y={y - 4} fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">
                      {formatCurrency(ratio * maxBarValue, symbol)}
                    </text>
                  </g>
                );
              })}

              {/* Data Bars */}
              {barChartData.map((d, idx) => {
                const totalBars = barChartData.length;
                const slotWidth = 600 / totalBars;
                const barWidth = Math.max(6, Math.min(18, slotWidth * 0.35));
                const centerX = idx * slotWidth + slotWidth / 2;

                const incomeHeight = maxBarValue > 0 ? (d.income / maxBarValue) * 180 : 0;
                const expenseHeight = maxBarValue > 0 ? (d.expense / maxBarValue) * 180 : 0;

                const incomeY = 200 - incomeHeight;
                const expenseY = 200 - expenseHeight;

                return (
                  <g 
                    key={d.date}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredBar(d)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Hover hotspot background */}
                    <rect 
                      x={idx * slotWidth} 
                      y="10" 
                      width={slotWidth} 
                      height="210" 
                      fill="transparent" 
                    />

                    {/* Income Bar */}
                    <rect 
                      x={centerX - barWidth - 1} 
                      y={incomeY} 
                      width={barWidth} 
                      height={Math.max(2, incomeHeight)} 
                      rx="3"
                      fill="var(--color-income)" 
                      opacity={hoveredBar && hoveredBar.date !== d.date ? 0.4 : 0.9}
                    />

                    {/* Expense Bar */}
                    <rect 
                      x={centerX + 1} 
                      y={expenseY} 
                      width={barWidth} 
                      height={Math.max(2, expenseHeight)} 
                      rx="3"
                      fill="var(--color-expense)" 
                      opacity={hoveredBar && hoveredBar.date !== d.date ? 0.4 : 0.9}
                    />

                    {/* Date label */}
                    {(totalBars <= 14 || idx % 2 === 0) && (
                      <text 
                        x={centerX} 
                        y="225" 
                        textAnchor="middle" 
                        fill="var(--text-muted)" 
                        fontSize="9" 
                        fontFamily="var(--font-mono)"
                      >
                        {d.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Interactive Tooltip on hover */}
            {hoveredBar && (
              <div 
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.78rem',
                  boxShadow: 'var(--shadow-md)',
                  pointerEvents: 'none',
                  zIndex: 10
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{hoveredBar.fullDate || hoveredBar.date}</div>
                <div style={{ color: 'var(--color-income)' }}>Income: +{formatCurrency(hoveredBar.income, symbol)}</div>
                <div style={{ color: 'var(--color-expense)' }}>Expense: -{formatCurrency(hoveredBar.expense, symbol)}</div>
                <div style={{ 
                  color: hoveredBar.income - hoveredBar.expense >= 0 ? 'var(--color-income)' : 'var(--color-expense)', 
                  fontWeight: 600, 
                  marginTop: '0.2rem',
                  borderTop: '1px dashed var(--border-subtle)',
                  paddingTop: '0.2rem'
                }}>
                  Net: {hoveredBar.income - hoveredBar.expense >= 0 ? '+' : ''}{formatCurrency(hoveredBar.income - hoveredBar.expense, symbol)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Spending Doughnut & Breakdown */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <PieIcon size={18} color="var(--color-purple)" /> Expense Breakdown by Category
            </h3>
            <span className="badge badge-neutral">
              Total: {formatCurrency(categoryBreakdown.totalExpense, symbol)}
            </span>
          </div>

          {categoryBreakdown.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No expense transactions logged to categorize.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Stacked Multi-color Bar Representation */}
              <div style={{ 
                height: '14px', 
                width: '100%', 
                display: 'flex', 
                borderRadius: 'var(--radius-full)', 
                overflow: 'hidden',
                background: 'var(--bg-elevated)'
              }}>
                {categoryBreakdown.items.map(cat => (
                  <div 
                    key={cat.id} 
                    style={{ 
                      width: `${cat.percent}%`, 
                      background: cat.color,
                      transition: 'width 0.3s ease'
                    }}
                    title={`${cat.name}: ${cat.percent}% (${formatCurrency(cat.amount, symbol)})`}
                  />
                ))}
              </div>

              {/* Category List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '220px', overflowY: 'auto' }}>
                {categoryBreakdown.items.map(cat => (
                  <div 
                    key={cat.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cat.name}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cat.percent}%</span>
                      <span className="amount-val" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        {formatCurrency(cat.amount, symbol)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Multi-Currency Calculator & Converter */}
      <CurrencyCalculator 
        settings={settings}
        currentBalance={currentBalance}
        displayCash={todayIncome > 0 ? todayIncome : (currentBalance > 0 ? currentBalance : 568)}
        displayRevenue={totalIncomeAll > 0 ? totalIncomeAll : 10403}
      />
    </div>
  );
}
