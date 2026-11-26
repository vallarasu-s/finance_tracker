import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  Layers, 
  DollarSign,
  Calendar,
  RotateCw,
  Minimize2,
  Maximize2,
  X,
  Plus,
  ChevronRight
} from 'lucide-react';
import { formatCurrency, CATEGORIES, getCategoryInfo } from '../services/storage';
import CategoryHistoryModal from '../components/CategoryHistoryModal';
import { pushModalNavigation, popModalNavigation } from '../services/navigation';

/**
 * Accurately formats category expense percentages:
 * - Avoids false 0% for non-zero expenses (e.g. 0.37%, 0.02%)
 * - Avoids false 100% when other expenses exist (e.g. 99.61%)
 * - Cleans up whole numbers (e.g. 50%, 25%)
 * - Uses 1-2 decimal places dynamically for fractional values
 */
const formatCategoryPercent = (amount, total) => {
  if (!amount || amount <= 0 || !total || total <= 0) return '0%';
  if (amount >= total) return '100%';

  const raw = (amount / total) * 100;

  if (raw >= 99.99) return '99.99%';
  if (raw < 0.01) return '<0.01%';

  const fixed2 = raw.toFixed(2);
  if (fixed2.endsWith('.00')) {
    return `${Math.round(raw)}%`;
  }
  if (fixed2.endsWith('0')) {
    return `${raw.toFixed(1)}%`;
  }
  return `${fixed2}%`;
};

export default function Analytics({ 
  transactions, 
  goals, 
  settings, 
  onOpenTransactionModal,
  onDeleteTransaction,
  onDuplicateTransaction,
  onNavigateTab
}) {
  const symbol = settings.currencySymbol || '$';
  const [timeframe, setTimeframe] = useState('7'); // '7', '14', '30', 'yearly'
  const [breakdownType, setBreakdownType] = useState('expense'); // 'expense' | 'income'
  const [isChartFullScreen, setIsChartFullScreen] = useState(false);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [selectedCategoryHistory, setSelectedCategoryHistory] = useState(null);

  const handleOpenCategoryHistory = (cat) => {
    setSelectedCategoryHistory(cat);
    pushModalNavigation('category_history_modal', () => setSelectedCategoryHistory(null));
  };

  const handleCloseCategoryHistory = () => {
    popModalNavigation('category_history_modal');
  };

  // Enter Rotated View: 90 degrees landscape rotation view for mobile
  const handleEnterRotatedView = async () => {
    setIsChartFullScreen(true);
    pushModalNavigation('chart_fullscreen', () => {
      setIsChartFullScreen(false);
      try {
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      } catch {}
      try {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        }
      } catch {}
    });

    // Request orientation lock if supported on mobile devices
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (e) {}

    // Request browser fullscreen if available
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      } else if (document.body.requestFullscreen) {
        await document.body.requestFullscreen().catch(() => {});
      }
    } catch (err) {}
  };

  // Exit Rotated View
  const handleExitRotatedView = async () => {
    popModalNavigation('chart_fullscreen');
  };

  // Keyboard Escape listener to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isChartFullScreen) {
        handleExitRotatedView();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChartFullScreen]);

  // Browser fullscreenchange listener
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (!isFs && isChartFullScreen) {
        setIsChartFullScreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, [isChartFullScreen]);

  // Toggle body class when chart is in rotated fullscreen mode (hides floating action button, etc.)
  useEffect(() => {
    if (isChartFullScreen) {
      document.body.classList.add('chart-rotated-fullscreen-active');
    } else {
      document.body.classList.remove('chart-rotated-fullscreen-active');
    }
    return () => {
      document.body.classList.remove('chart-rotated-fullscreen-active');
    };
  }, [isChartFullScreen]);

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

  // Compute Category Breakdown for Bar & List (supports both expense & income)
  const categoryBreakdown = useMemo(() => {
    const map = {};
    let totalAmount = 0;

    let filteredTxs = transactions;
    if (timeframe === 'yearly') {
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      filteredTxs = transactions.filter(t => (t.date || '') >= yearStart);
    } else {
      const days = parseInt(timeframe, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - (days - 1));
      const cutoffStr = cutoff.toISOString().split('T')[0];
      filteredTxs = transactions.filter(t => (t.date || '') >= cutoffStr);
    }

    // Fallback to all transactions if filtered set has no transactions of selected type
    if (filteredTxs.filter(t => t.type === breakdownType).length === 0) {
      filteredTxs = transactions;
    }

    for (const t of filteredTxs) {
      if (t.type === breakdownType) {
        const amt = Number(t.amount) || 0;
        totalAmount += amt;
        const catKey = t.category || (breakdownType === 'income' ? 'other_inc' : 'other_exp');
        map[catKey] = (map[catKey] || 0) + amt;
      }
    }

    const availableCats = CATEGORIES[breakdownType] || [];

    const items = Object.keys(map).map(catId => {
      const catMeta = availableCats.find(c => c.id === catId) || getCategoryInfo(catId, breakdownType);
      const amount = map[catId];
      const rawPercent = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
      const percentLabel = formatCategoryPercent(amount, totalAmount);
      return {
        id: catId,
        name: catMeta.name,
        icon: catMeta.icon,
        color: catMeta.color,
        amount,
        percent: rawPercent,
        percentLabel,
        type: breakdownType
      };
    });

    items.sort((a, b) => b.amount - a.amount);
    return { items, totalAmount };
  }, [transactions, timeframe, breakdownType]);

  const totalPeriodIncome = useMemo(() => 
    barChartData.reduce((acc, d) => acc + (d.income || 0), 0)
  , [barChartData]);

  const totalPeriodExpense = useMemo(() => 
    barChartData.reduce((acc, d) => acc + (d.expense || 0), 0)
  , [barChartData]);

  const netPeriodBalance = totalPeriodIncome - totalPeriodExpense;

  const chartW = isChartFullScreen ? 1000 : 760;
  const chartH = isChartFullScreen ? 400 : 260;
  const chartBaseY = isChartFullScreen ? 330 : 215;
  const chartMaxH = isChartFullScreen ? 260 : 175;
  const chartDateY = isChartFullScreen ? 365 : 242;
  const chartDateFontSize = isChartFullScreen ? 11 : 9.5;

  const timeframeTransactions = useMemo(() => {
    if (timeframe === 'yearly') {
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      return transactions.filter(t => (t.date || '') >= yearStart);
    } else {
      const days = parseInt(timeframe, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - (days - 1));
      const cutoffStr = cutoff.toISOString().split('T')[0];
      return transactions.filter(t => (t.date || '') >= cutoffStr);
    }
  }, [transactions, timeframe]);

  const totalFilteredIncome = useMemo(() => 
    timeframeTransactions.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0)
  , [timeframeTransactions]);

  const totalFilteredExpense = useMemo(() => 
    timeframeTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0)
  , [timeframeTransactions]);

  const netFiltered = totalFilteredIncome - totalFilteredExpense;

  const timeframeLabel = useMemo(() => {
    if (timeframe === 'yearly') return 'YEARLY';
    return `${timeframe} DAYS`;
  }, [timeframe]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Tracker Summary Banner (Inflow & Outflow) */}
      <div className="daily-banner analytics-banner">
        <div className="daily-banner-info">
          <span className="daily-banner-subtitle">
            Tracker Summary ({timeframeLabel})
          </span>
          <div className="daily-banner-title-row">
            <h2 className="daily-banner-title">
              Inflow & Outflow
            </h2>
            {/* Mobile View: Transaction badge moved to green-line position with green color */}
            <span className="badge badge-income daily-banner-tx-badge-mobile">
              {timeframeTransactions.length} {timeframeTransactions.length === 1 ? 'transaction' : 'transactions'}
            </span>
          </div>
          {/* Desktop View: Original badges row with transaction badge and red-marked net badge */}
          <div className="daily-banner-badges-desktop">
            <span className="badge badge-neutral">
              {timeframeTransactions.length} {timeframeTransactions.length === 1 ? 'transaction' : 'transactions'}
            </span>
            <span 
              className={`badge ${netFiltered >= 0 ? 'badge-income' : 'badge-expense'} daily-banner-net-badge`}
              title={`Net: ${netFiltered >= 0 ? '+' : ''}${formatCurrency(netFiltered, symbol, { compact: false, settings })}`}
            >
              Net: {netFiltered >= 0 ? '+' : ''}
              {formatCurrency(netFiltered, symbol, { compact: true, settings })}
            </span>
          </div>
        </div>

        <div className="daily-banner-stats">
          <div className="daily-stat-item daily-stat-net">
            <span className="daily-stat-label">Net Balance</span>
            <span 
              className="daily-stat-value amount-val" 
              style={{ color: netFiltered >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}
              title={formatCurrency(netFiltered, symbol, { compact: false, settings })}
            >
              {netFiltered >= 0 ? '+' : ''}{formatCurrency(netFiltered, symbol, { compact: true, settings })}
            </span>
          </div>

          <div className="daily-stat-item">
            <span className="daily-stat-label">Inflow</span>
            <span 
              className="daily-stat-value amount-val" 
              style={{ color: 'var(--color-income)' }}
              title={formatCurrency(totalFilteredIncome, symbol, { compact: false, settings })}
            >
              +{formatCurrency(totalFilteredIncome, symbol, { compact: true, settings })}
            </span>
          </div>
          <div className="daily-stat-item">
            <span className="daily-stat-label">Outflow</span>
            <span 
              className="daily-stat-value amount-val" 
              style={{ color: 'var(--color-expense)' }}
              title={formatCurrency(totalFilteredExpense, symbol, { compact: false, settings })}
            >
              -{formatCurrency(totalFilteredExpense, symbol, { compact: true, settings })}
            </span>
          </div>

          <button 
            type="button"
            className="btn btn-primary daily-banner-action-btn"
            onClick={() => onOpenTransactionModal && onOpenTransactionModal()}
          >
            <Plus size={18} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Grid: Bar Chart & Doughnut Chart */}
      <div className="analytics-charts-grid" style={{ gap: '1.5rem' }}>
        {/* Daily Inflow vs Outflow Bar Chart */}
        <div 
          className={`card daily-chart-card ${isChartFullScreen ? 'daily-chart-rotated-fullscreen' : ''}`}
          style={!isChartFullScreen ? { 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.75rem', 
            position: 'relative',
            width: '100%',
            maxWidth: '820px',
            margin: '0 auto'
          } : undefined}
        >
          {isChartFullScreen ? (
            <div className="daily-chart-fs-inner rotated-90">
              {/* Fullscreen Rotated Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                flexWrap: 'wrap', 
                gap: '0.5rem', 
                borderBottom: '1px solid var(--border-subtle)', 
                paddingBottom: '0.5rem',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
                    <BarChart3 size={19} color="var(--color-brand)" /> 
                    {timeframe === 'yearly' ? 'Monthly Income vs. Expense (12 Months)' : 'Daily Income vs. Expense'}
                  </h3>
                  <span className="badge badge-brand" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
                    Rotated View (90°)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.78rem', fontWeight: 600, flexWrap: 'wrap' }}>
                  {/* Indicators */}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-income)' }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: 'var(--color-income)' }} />
                    Income
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-expense)' }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: 'var(--color-expense)' }} />
                    Expense
                  </span>

                  {/* Close Button */}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleExitRotatedView}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.24rem 0.75rem', fontSize: '0.78rem', fontWeight: 600 }}
                    title="Close (Return to Dashboard)"
                  >
                    <X size={15} /> Close
                  </button>
                </div>
              </div>

              {/* Fullscreen Chart Stage - Fills 100% of remaining container */}
              <div 
                style={{ 
                  position: 'relative', 
                  width: '100%', 
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  marginTop: '0.35rem'
                }}
              >
                <svg 
                  width="100%" 
                  height="100%" 
                  viewBox={`0 0 ${chartW} ${chartH}`} 
                  preserveAspectRatio="none"
                  style={{ overflow: 'visible', width: '100%', height: '100%' }}
                >
                  {/* Horizontal Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = chartBaseY - ratio * chartMaxH;
                    return (
                      <g key={idx}>
                        <line x1="0" y1={y} x2={chartW} y2={y} stroke="var(--border-subtle)" strokeDasharray="4 4" strokeWidth="1" />
                        <text x="6" y={y - 5} fill="var(--text-muted)" fontSize={chartDateFontSize} fontFamily="var(--font-mono)">
                          {formatCurrency(ratio * maxBarValue, symbol)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Data Bars */}
                  {barChartData.map((d, idx) => {
                    const totalBars = barChartData.length;
                    const slotWidth = chartW / totalBars;
                    const barWidth = Math.max(12, Math.min(36, slotWidth * 0.36));
                    const centerX = idx * slotWidth + slotWidth / 2;

                    const incomeHeight = maxBarValue > 0 ? (d.income / maxBarValue) * chartMaxH : 0;
                    const expenseHeight = maxBarValue > 0 ? (d.expense / maxBarValue) * chartMaxH : 0;

                    const incomeY = chartBaseY - incomeHeight;
                    const expenseY = chartBaseY - expenseHeight;

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
                          height={chartBaseY + 20} 
                          fill="transparent" 
                        />

                        {/* Income Bar */}
                        <rect 
                          x={centerX - barWidth - 1} 
                          y={incomeY} 
                          width={barWidth} 
                          height={Math.max(2, incomeHeight)} 
                          rx={4}
                          fill="var(--color-income)" 
                          opacity={hoveredBar && hoveredBar.date !== d.date ? 0.4 : 0.9}
                        />

                        {/* Expense Bar */}
                        <rect 
                          x={centerX + 1} 
                          y={expenseY} 
                          width={barWidth} 
                          height={Math.max(2, expenseHeight)} 
                          rx={4}
                          fill="var(--color-expense)" 
                          opacity={hoveredBar && hoveredBar.date !== d.date ? 0.4 : 0.9}
                        />

                        {/* Date label */}
                        <text 
                          x={centerX} 
                          y={chartDateY} 
                          textAnchor="middle" 
                          fill="var(--text-muted)" 
                          fontSize={chartDateFontSize} 
                          fontFamily="var(--font-mono)"
                        >
                          {d.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Interactive Tooltip on hover */}
                {hoveredBar && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.5rem 0.85rem',
                      fontSize: '0.78rem',
                      boxShadow: 'var(--shadow-md)',
                      pointerEvents: 'none',
                      zIndex: 20
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
          ) : (
            /* Normal Card View */
            <>
              {/* Centered & Bigger Header */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.75rem', 
                textAlign: 'center',
                paddingTop: '0.2rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '0.35rem'
              }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 800, 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '0.55rem', 
                  margin: 0,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)'
                }}>
                  <BarChart3 size={24} color="var(--color-brand)" /> 
                  {timeframe === 'yearly' ? 'Monthly Income vs. Expense (12 Months)' : 'Daily Income vs. Expense'}
                </h3>

                {/* Period Selector Tabs (Moved from Top Banner) */}
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.25rem', 
                  background: 'var(--bg-elevated)', 
                  padding: '0.25rem 0.35rem', 
                  borderRadius: 'var(--radius-full)', 
                  border: '1px solid var(--border-subtle)',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)'
                }}>
                  {[
                    { id: '7', label: '7 Days' },
                    { id: '14', label: '14 Days' },
                    { id: '30', label: '30 Days' },
                    { id: 'yearly', label: 'Yearly' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className={`btn ${timeframe === p.id ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ 
                        padding: '0.32rem 0.85rem', 
                        fontSize: '0.78rem', 
                        fontWeight: 700, 
                        borderRadius: 'var(--radius-full)',
                        transition: 'all 0.2s ease',
                        boxShadow: timeframe === p.id ? '0 2px 8px var(--color-brand-glow)' : 'none'
                      }}
                      onClick={() => setTimeframe(p.id)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Normal SVG Bar Chart Stage - Centered & Optimized Width */}
              <div 
                style={{ 
                  position: 'relative', 
                  width: '100%', 
                  height: '260px', 
                  minHeight: '260px',
                  overflow: 'hidden',
                  marginTop: '0.35rem'
                }}
              >
                <svg 
                  width="100%" 
                  height="100%" 
                  viewBox={`0 0 ${chartW} ${chartH}`} 
                  preserveAspectRatio="none"
                  style={{ overflow: 'visible' }}
                >
                  {/* Horizontal Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = chartBaseY - ratio * chartMaxH;
                    return (
                      <g key={idx}>
                        <line x1="0" y1={y} x2={chartW} y2={y} stroke="var(--border-subtle)" strokeDasharray="4 4" strokeWidth="1" />
                        <text x="8" y={y - 5} fill="var(--text-muted)" fontSize={chartDateFontSize} fontFamily="var(--font-mono)" fontWeight="600">
                          {formatCurrency(ratio * maxBarValue, symbol)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Solid Baseline */}
                  <line x1="0" y1={chartBaseY} x2={chartW} y2={chartBaseY} stroke="var(--border-medium)" strokeWidth="1.2" />

                  {/* Data Bars */}
                  {barChartData.map((d, idx) => {
                    const totalBars = barChartData.length;
                    const slotWidth = chartW / totalBars;
                    const barWidth = Math.max(8, Math.min(26, slotWidth * 0.32));
                    const centerX = idx * slotWidth + slotWidth / 2;

                    const incomeHeight = maxBarValue > 0 ? (d.income / maxBarValue) * chartMaxH : 0;
                    const expenseHeight = maxBarValue > 0 ? (d.expense / maxBarValue) * chartMaxH : 0;

                    const incomeY = chartBaseY - incomeHeight;
                    const expenseY = chartBaseY - expenseHeight;

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
                          height={chartBaseY + 25} 
                          fill="transparent" 
                        />

                        {/* Income Bar */}
                        {d.income > 0 ? (
                          <rect 
                            x={centerX - barWidth - 2} 
                            y={incomeY} 
                            width={barWidth} 
                            height={Math.max(4, incomeHeight)} 
                            rx={4}
                            fill="var(--color-income)" 
                            opacity={hoveredBar && hoveredBar.date !== d.date ? 0.35 : 0.95}
                          />
                        ) : (
                          <line 
                            x1={centerX - barWidth - 2} 
                            y1={chartBaseY} 
                            x2={centerX - 2} 
                            y2={chartBaseY} 
                            stroke="var(--color-income)" 
                            strokeWidth="2" 
                            opacity="0.3" 
                          />
                        )}

                        {/* Expense Bar */}
                        {d.expense > 0 ? (
                          <rect 
                            x={centerX + 2} 
                            y={expenseY} 
                            width={barWidth} 
                            height={Math.max(4, expenseHeight)} 
                            rx={4}
                            fill="var(--color-expense)" 
                            opacity={hoveredBar && hoveredBar.date !== d.date ? 0.35 : 0.95}
                          />
                        ) : (
                          <line 
                            x1={centerX + 2} 
                            y1={chartBaseY} 
                            x2={centerX + barWidth + 2} 
                            y2={chartBaseY} 
                            stroke="var(--color-expense)" 
                            strokeWidth="2" 
                            opacity="0.3" 
                          />
                        )}

                        {/* Date label */}
                        {(totalBars <= 14 || idx % 2 === 0) && (
                          <text 
                            x={centerX} 
                            y={chartDateY} 
                            textAnchor="middle" 
                            fill={hoveredBar && hoveredBar.date === d.date ? 'var(--text-primary)' : 'var(--text-muted)'} 
                            fontSize={chartDateFontSize} 
                            fontFamily="var(--font-mono)"
                            fontWeight={hoveredBar && hoveredBar.date === d.date ? '700' : '500'}
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
                      top: '12px',
                      right: '12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.6rem 0.95rem',
                      fontSize: '0.8rem',
                      boxShadow: 'var(--shadow-lg)',
                      pointerEvents: 'none',
                      zIndex: 20
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.25rem' }}>
                      {hoveredBar.fullDate || hoveredBar.date}
                    </div>
                    <div style={{ color: 'var(--color-income)', display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <span>Income:</span>
                      <span style={{ fontWeight: 700 }}>+{formatCurrency(hoveredBar.income, symbol)}</span>
                    </div>
                    <div style={{ color: 'var(--color-expense)', display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <span>Expense:</span>
                      <span style={{ fontWeight: 700 }}>-{formatCurrency(hoveredBar.expense, symbol)}</span>
                    </div>
                    <div style={{ 
                      color: hoveredBar.income - hoveredBar.expense >= 0 ? 'var(--color-income)' : 'var(--color-expense)', 
                      fontWeight: 700, 
                      marginTop: '0.25rem',
                      borderTop: '1px dashed var(--border-subtle)',
                      paddingTop: '0.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}>
                      <span>Net:</span>
                      <span>{hoveredBar.income - hoveredBar.expense >= 0 ? '+' : ''}{formatCurrency(hoveredBar.income - hoveredBar.expense, symbol)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rotate Button at Bottom-Right (Mobile Only) */}
              <button
                type="button"
                className="chart-bottom-rotate-btn"
                onClick={handleEnterRotatedView}
                title="Rotate Chart (Landscape View)"
                aria-label="Rotate Chart (Landscape View)"
              >
                <RotateCw size={13} className="rotate-icon" />
                <span className="rotate-btn-text">Rotate</span>
              </button>
            </>
          )}
        </div>

        {/* Category Breakdown (Expenses vs Income) - Centered Matching Width */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.35rem 1.6rem', width: '100%', maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
                <PieIcon size={18} color={breakdownType === 'income' ? 'var(--color-income)' : 'var(--color-purple)'} />
                {breakdownType === 'income' ? 'Income' : 'Expense'} Breakdown by Category
              </h3>

              {/* Expense vs Income Toggle Buttons */}
              <div 
                className="category-breakdown-type-toggle"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.2rem', 
                  background: 'var(--bg-elevated)', 
                  padding: '0.2rem 0.28rem', 
                  borderRadius: 'var(--radius-full)', 
                  border: '1px solid var(--border-subtle)',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)'
                }}
                role="group"
                aria-label="Category Breakdown Type"
              >
                <button
                  id="breakdown-toggle-expense"
                  type="button"
                  className={`btn ${breakdownType === 'expense' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ 
                    padding: '0.26rem 0.8rem', 
                    fontSize: '0.78rem', 
                    fontWeight: 700, 
                    borderRadius: 'var(--radius-full)',
                    transition: 'all 0.2s ease',
                    boxShadow: breakdownType === 'expense' ? '0 2px 8px var(--color-brand-glow)' : 'none'
                  }}
                  onClick={() => setBreakdownType('expense')}
                  aria-pressed={breakdownType === 'expense'}
                >
                  Expenses
                </button>
                <button
                  id="breakdown-toggle-income"
                  type="button"
                  className={`btn ${breakdownType === 'income' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ 
                    padding: '0.26rem 0.8rem', 
                    fontSize: '0.78rem', 
                    fontWeight: 700, 
                    borderRadius: 'var(--radius-full)',
                    transition: 'all 0.2s ease',
                    background: breakdownType === 'income' ? 'var(--color-income)' : undefined,
                    borderColor: breakdownType === 'income' ? 'var(--color-income)' : undefined,
                    color: breakdownType === 'income' ? '#ffffff' : undefined,
                    boxShadow: breakdownType === 'income' ? '0 2px 8px rgba(16, 185, 129, 0.35)' : 'none'
                  }}
                  onClick={() => setBreakdownType('income')}
                  aria-pressed={breakdownType === 'income'}
                >
                  Income
                </button>
              </div>
            </div>

            <span className="badge badge-neutral" style={{ fontSize: '0.8rem', padding: '0.26rem 0.75rem', fontWeight: 600 }}>
              Total: {formatCurrency(categoryBreakdown.totalAmount, symbol)}
            </span>
          </div>

          {categoryBreakdown.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                No {breakdownType === 'income' ? 'income' : 'expense'} transactions logged to categorize.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: '0.85rem', fontSize: '0.82rem', padding: '0.4rem 0.9rem' }}
                onClick={() => onOpenTransactionModal && onOpenTransactionModal(breakdownType)}
              >
                <Plus size={14} /> Add {breakdownType === 'income' ? 'Income' : 'Expense'} Entry
              </button>
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
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)'
              }}>
                {categoryBreakdown.items.map(cat => (
                  <div 
                    key={cat.id} 
                    style={{ 
                      width: `${cat.percent}%`, 
                      minWidth: cat.amount > 0 ? '4px' : '0px',
                      background: cat.color,
                      transition: 'width 0.3s ease',
                      cursor: 'pointer'
                    }}
                    title={`${cat.name}: ${cat.percentLabel} (${formatCurrency(cat.amount, symbol)}) • Click to view all history`}
                    onClick={() => handleOpenCategoryHistory(cat)}
                  />
                ))}
              </div>

              {/* Category List in Responsive Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
                gap: '0.65rem', 
                maxHeight: '260px', 
                overflowY: 'auto' 
              }}>
                {categoryBreakdown.items.map(cat => (
                  <div 
                    key={cat.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenCategoryHistory(cat)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenCategoryHistory(cat);
                      }
                    }}
                    className="category-breakdown-row-btn"
                    title={`Click to view all ${cat.name} transaction history`}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.95rem',
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>{cat.icon}</span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{cat.name}</span>
                        <span style={{ fontSize: '0.7rem', color: breakdownType === 'income' ? 'var(--color-income)' : 'var(--color-brand)', fontWeight: 500 }}>
                          Click to view history
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{cat.percentLabel}</span>
                      <span className={`amount-val ${breakdownType === 'income' ? 'income' : 'expense'}`} style={{ fontSize: '0.92rem', fontWeight: 700 }}>
                        {breakdownType === 'income' ? '+' : ''}{formatCurrency(cat.amount, symbol)}
                      </span>
                      <ChevronRight size={15} color="var(--text-muted)" className="category-row-arrow" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Full Transaction History Modal */}
      <CategoryHistoryModal
        isOpen={Boolean(selectedCategoryHistory)}
        category={selectedCategoryHistory}
        allTransactions={transactions}
        timeframe={timeframe}
        settings={settings}
        onClose={handleCloseCategoryHistory}
        onOpenTransactionModal={onOpenTransactionModal}
        onDeleteTransaction={onDeleteTransaction}
        onDuplicateTransaction={onDuplicateTransaction}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
}
