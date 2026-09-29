import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Wallet, 
  Coins, 
  CreditCard, 
  ArrowUp, 
  ArrowDown, 
  MoreVertical, 
  ChevronDown, 
  ExternalLink,
  Plus,
  Eye,
  CheckCircle2,
  Receipt,
  BarChart3,
  Check,
  Trash2,
  Clock,
  ListTodo,
  RotateCcw,
  HelpCircle,
  Lightbulb,
  X
} from 'lucide-react';
import { formatCurrency, getDailyTodos, saveDailyTodos, DEFAULT_DAILY_TODOS } from '../services/storage';

// Default Client Transactions Table Rows (Strictly Income & Payment Types)
const DEFAULT_CLIENT_TABLE_ROWS = [
  { id: '#1588', client: 'Ralph Edwards', date: '9/23/26', type: 'Payment', amount: 396.84, status: 'payment' },
  { id: '#1589', client: 'Darrell Steward', date: '5/7/26', type: 'Income', amount: 1250.00, status: 'income' },
  { id: '#1590', client: 'Kathryn Murphy', date: '9/18/26', type: 'Payment', amount: 480.00, status: 'payment' },
  { id: '#1591', client: 'Courtney Henry', date: '7/11/26', type: 'Payment', amount: 245.50, status: 'payment' },
  { id: '#1592', client: 'Eleanor Pena', date: '8/15/26', type: 'Income', amount: 890.20, status: 'income' },
  { id: '#1593', client: 'Albert Flores', date: '8/20/26', type: 'Income', amount: 1450.00, status: 'income' },
];

export default function Dashboard({
  transactions = [],
  goals = [],
  settings = {},
  onNavigateTab,
  onOpenTransactionModal,
  onOpenDepositModal,
  currentUser,
  todos: propTodos,
  onToggleTodo: propOnToggleTodo,
  onAddTodo: propOnAddTodo,
  onDeleteTodo: propOnDeleteTodo,
  onResetTodos: propOnResetTodos,
  onOpenHelp,
}) {
  const symbol = settings.currencySymbol || '$';
  const [timeframe, setTimeframe] = useState('This week');
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const [showChartHelp, setShowChartHelp] = useState(false);

  // Financial Calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const currentBalance = totalIncome - totalExpense;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(t => t.date === todayStr);

  const todayIncome = todayTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const todayExpense = todayTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const todayNet = todayIncome - todayExpense;

  // Monthly numbers
  const currentMonthStr = todayStr.substring(0, 7);
  const monthTransactions = transactions.filter(t => (t.date || '').startsWith(currentMonthStr));

  const monthIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const monthExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const monthProfit = monthIncome - monthExpense;

  // 4 KPI Display amounts (use live data with sensible fallbacks matching reference screenshot)
  const displayRevenue = currentBalance !== 0 ? Math.abs(currentBalance) : 689;
  const displayExpenses = monthExpense > 0 ? monthExpense : 460;
  const displayProfit = monthProfit > 0 ? monthProfit : 840;
  const displayCash = todayIncome > 0 ? todayIncome : 568;

  // Profit and Loss View Mode: 'monthly' or 'daily' (Analytics Style)
  const [pnlView, setPnlView] = useState('monthly');
  const [hoveredPnl, setHoveredPnl] = useState(null);

  // Dynamic calculation for Profit & Loss from user transactions (Income vs Expenses)
  const pnlData = useMemo(() => {
    const today = new Date();
    const result = [];

    if (pnlView === 'yearly') {
      // Last 5 Years (e.g. 2022 to 2026)
      const currentYear = today.getFullYear();
      for (let i = 4; i >= 0; i--) {
        const yr = currentYear - i;
        const yrStr = `${yr}`;
        const yearTxs = transactions.filter(t => (t.date || '').startsWith(yrStr));
        const profit = yearTxs.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const loss = yearTxs.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);

        result.push({
          key: yrStr,
          label: `${yr}`,
          fullDate: `Year ${yr}`,
          profit,
          loss,
          net: profit - loss
        });
      }
    } else if (pnlView === 'monthly') {
      // Last 8 months (e.g. Jan to Aug or up to current month)
      for (let i = 7; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short' });

        const monthTxs = transactions.filter(t => (t.date || '').startsWith(yearMonth));
        const profit = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const loss = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);

        result.push({
          key: yearMonth,
          label,
          fullDate: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          profit,
          loss,
          net: profit - loss
        });
      }
    } else {
      // Last 14 days (daily income vs expense breakdown like Analytics)
      for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const dayTxs = transactions.filter(t => t.date === dStr);
        const profit = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const loss = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);

        result.push({
          key: dStr,
          label: i % 2 === 0 ? label : '',
          fullDate: dStr,
          profit,
          loss,
          net: profit - loss
        });
      }
    }

    // If transactions are empty, provide sample baseline so chart renders handsomely
    const hasData = result.some(r => r.profit > 0 || r.loss > 0);
    if (!hasData) {
      const demoSamples = [
        { profit: 4800, loss: 2200 },
        { profit: 6500, loss: 3100 },
        { profit: 5200, loss: 2600 },
        { profit: 7000, loss: 1900 },
        { profit: 9000, loss: 3800 },
        { profit: 6800, loss: 2700 },
        { profit: 6200, loss: 2400 },
        { profit: 7400, loss: 3200 },
      ];
      return result.map((r, idx) => {
        const s = demoSamples[idx % demoSamples.length];
        return { ...r, profit: s.profit, loss: s.loss, net: s.profit - s.loss };
      });
    }

    return result;
  }, [transactions, pnlView]);

  // Max value for Y-axis scaling
  const pnlMaxValue = useMemo(() => {
    let max = 100;
    for (const d of pnlData) {
      if (d.profit > max) max = d.profit;
      if (d.loss > max) max = d.loss;
    }
    return Math.ceil((max * 1.15) / 500) * 500;
  }, [pnlData]);

  // Daily Financial Todos State (uses propTodos when provided from App shell)
  const [localTodos, setLocalTodos] = useState(() => getDailyTodos());
  const todos = propTodos || localTodos;

  const [todoFilter, setTodoFilter] = useState('pending'); // 'all' | 'pending' | 'done'
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoCategory, setNewTodoCategory] = useState('Bills');

  const handleToggleTodo = (id) => {
    if (propOnToggleTodo) {
      propOnToggleTodo(id);
      return;
    }
    setLocalTodos(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      saveDailyTodos(updated);
      return updated;
    });
  };

  const handleAddTodo = (e) => {
    if (e) e.preventDefault();
    if (!newTodoText.trim()) return;
    if (propOnAddTodo) {
      propOnAddTodo(newTodoText.trim(), newTodoCategory);
      setNewTodoText('');
      setIsAddingTodo(false);
      return;
    }
    const newTodo = {
      id: 'todo-' + Date.now(),
      text: newTodoText.trim(),
      category: newTodoCategory,
      completed: false,
      due: 'Today'
    };
    setLocalTodos(prev => {
      const updated = [newTodo, ...prev];
      saveDailyTodos(updated);
      return updated;
    });
    setNewTodoText('');
    setIsAddingTodo(false);
  };

  const handleDeleteTodo = (id) => {
    if (propOnDeleteTodo) {
      propOnDeleteTodo(id);
      return;
    }
    setLocalTodos(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveDailyTodos(updated);
      return updated;
    });
  };

  const handleResetTodos = () => {
    if (propOnResetTodos) {
      propOnResetTodos();
      return;
    }
    setLocalTodos(DEFAULT_DAILY_TODOS);
    saveDailyTodos(DEFAULT_DAILY_TODOS);
  };

  const completedCount = useMemo(() => todos.filter(t => t.completed).length, [todos]);
  const progressPercent = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  const filteredTodos = useMemo(() => {
    if (todoFilter === 'pending') return todos.filter(t => !t.completed);
    if (todoFilter === 'done') return todos.filter(t => t.completed);
    return todos;
  }, [todos, todoFilter]);

  // Client Transactions Table - Strictly Income & Payment Types
  const [tableFilter, setTableFilter] = useState('all'); // 'all' | 'income' | 'payment'

  const allTableRows = useMemo(() => {
    if (transactions.length === 0) return DEFAULT_CLIENT_TABLE_ROWS;
    return transactions.slice(0, 8).map((tx, i) => {
      const isIncome = tx.type === 'income';
      return {
        id: `#${1588 + i}`,
        client: tx.recipient || tx.note || tx.category || (isIncome ? 'Client Receipt' : 'Vendor Payment'),
        date: tx.date ? tx.date.split('-').slice(1).join('/') : '9/23/26',
        type: isIncome ? 'Income' : 'Payment',
        amount: tx.amount,
        status: isIncome ? 'income' : 'payment',
        rawTx: tx
      };
    });
  }, [transactions]);

  const filteredTableRows = useMemo(() => {
    if (tableFilter === 'all') return allTableRows;
    return allTableRows.filter(r => r.status === tableFilter);
  }, [allTableRows, tableFilter]);

  const incomeRowCount = useMemo(() => allTableRows.filter(r => r.status === 'income').length, [allTableRows]);
  const paymentRowCount = useMemo(() => allTableRows.filter(r => r.status === 'payment').length, [allTableRows]);

  return (
    <div className="fogo-dashboard-layout">
      {/* ====================================================================
          TOP ROW: 4 KPI Cards (2x2) + Profit and Loss Chart
          ==================================================================== */}
      <div className="fogo-top-grid">
        {/* 4 Metric Cards (2x2) */}
        <div className="fogo-kpi-quad">
          {/* Card 1: Total Revenue (Solid Vibrant Blue Card) */}
          <div className="fogo-kpi-card blue-hero">
            <div className="kpi-card-header">
              <span className="kpi-card-title">Total Revenue</span>
              <div className="kpi-card-icon-pill white-tint">
                <ShoppingBag size={18} />
              </div>
            </div>
            <div className="kpi-card-amount">
              {formatCurrency(displayRevenue, symbol)}
            </div>
            <div className="kpi-card-badge blue-pill">
              <ArrowUp size={12} />
              <span>5% This month</span>
            </div>
          </div>

          {/* Card 2: Total Expenses */}
          <div className="fogo-kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-card-title">Total Expenses</span>
              <div className="kpi-card-icon-pill blue-tint">
                <ShoppingBag size={18} color="var(--color-brand)" />
              </div>
            </div>
            <div className="kpi-card-amount">
              {formatCurrency(displayExpenses, symbol)}
            </div>
            <div className="kpi-card-badge red-pill">
              <ArrowDown size={12} />
              <span>5% This month</span>
            </div>
          </div>

          {/* Card 3: New Profit */}
          <div className="fogo-kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-card-title">New Profit</span>
              <div className="kpi-card-icon-pill blue-tint">
                <Coins size={18} color="var(--color-brand)" />
              </div>
            </div>
            <div className="kpi-card-amount">
              {formatCurrency(displayProfit, symbol)}
            </div>
            <div className="kpi-card-badge green-pill">
              <ArrowUp size={12} />
              <span>7% This month</span>
            </div>
          </div>

          {/* Card 4: Cash Balance */}
          <div className="fogo-kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-card-title">Cash Balance</span>
              <div className="kpi-card-icon-pill blue-tint">
                <Wallet size={18} color="var(--color-brand)" />
              </div>
            </div>
            <div className="kpi-card-amount">
              {formatCurrency(displayCash, symbol)}
            </div>
            <div className="kpi-card-badge green-pill">
              <ArrowUp size={12} />
              <span>2% This month</span>
            </div>
          </div>
        </div>

        {/* Dynamic Profit and Loss Bar Chart Card (Analytics Style) */}
        <div className="fogo-card fogo-pnl-card">
          <div className="fogo-card-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.65rem' }}>
            <div>
              <h3 className="fogo-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BarChart3 size={18} color="var(--color-brand)" /> Profit and Loss
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {pnlView === 'yearly' ? 'Multi-year financial comparison' : pnlView === 'monthly' ? 'Monthly trend & net margin' : 'Recent 14-day daily breakdown'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Timeframe Toggle: Monthly vs Daily vs Yearly */}
              <div className="pnl-timeframe-toggle">
                <button
                  type="button"
                  className={`pnl-timeframe-btn ${pnlView === 'monthly' ? 'active' : ''}`}
                  onClick={() => setPnlView('monthly')}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className={`pnl-timeframe-btn ${pnlView === 'daily' ? 'active' : ''}`}
                  onClick={() => setPnlView('daily')}
                >
                  Daily
                </button>
                <button
                  type="button"
                  className={`pnl-timeframe-btn ${pnlView === 'yearly' ? 'active' : ''}`}
                  onClick={() => setPnlView('yearly')}
                >
                  Yearly
                </button>
              </div>

              {/* Legend with Profit and Loss dots */}
              <div className="fogo-pnl-legend">
                <span className="pnl-legend-item">
                  <span className="legend-dot profit-dot" /> Profit
                </span>
                <span className="pnl-legend-item">
                  <span className="legend-dot loss-dot" /> Loss
                </span>
              </div>

              <button 
                type="button" 
                className="fogo-card-more-btn"
                title="View Full Analytics"
                onClick={() => onNavigateTab && onNavigateTab('analytics')}
              >
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          {/* SVG Interactive Bar Chart (Analytics Style) */}
          <div className="fogo-pnl-svg-container">
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 540 210" 
              preserveAspectRatio="none"
              style={{ overflow: 'visible' }}
            >
              {/* Horizontal Grid lines with dynamic Y-axis values */}
              {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                const y = 168 - ratio * 140;
                const val = Math.round(ratio * pnlMaxValue);
                const label = val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : `${val}`;
                return (
                  <g key={idx}>
                    <line x1="38" y1={y} x2="535" y2={y} stroke="var(--border-subtle)" strokeDasharray="4 4" strokeWidth="1" />
                    <text x="32" y={y + 3} textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">
                      {label}
                    </text>
                  </g>
                );
              })}

              {/* Data Bars */}
              {pnlData.map((d, idx) => {
                const totalItems = pnlData.length;
                const chartWidth = 490;
                const slotWidth = chartWidth / totalItems;
                const barWidth = Math.max(6, Math.min(15, slotWidth * 0.36));
                const centerX = 42 + idx * slotWidth + slotWidth / 2;

                const profitHeight = pnlMaxValue > 0 ? (d.profit / pnlMaxValue) * 140 : 0;
                const lossHeight = pnlMaxValue > 0 ? (d.loss / pnlMaxValue) * 140 : 0;

                const profitY = 168 - profitHeight;
                const lossY = 168 - lossHeight;

                const isHovered = hoveredPnl && hoveredPnl.key === d.key;
                const isDimmed = hoveredPnl && hoveredPnl.key !== d.key;

                return (
                  <g 
                    key={d.key || idx}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredPnl(d)}
                    onMouseLeave={() => setHoveredPnl(null)}
                  >
                    {/* Hotspot */}
                    <rect 
                      x={42 + idx * slotWidth} 
                      y="15" 
                      width={slotWidth} 
                      height="175" 
                      fill="transparent" 
                    />

                    {/* Profit Bar (Income) */}
                    <rect 
                      x={centerX - barWidth - 1.5} 
                      y={profitY} 
                      width={barWidth} 
                      height={Math.max(3, profitHeight)} 
                      rx="3"
                      fill="var(--color-income)" 
                      opacity={isDimmed ? 0.35 : 0.95}
                      style={{ transition: 'opacity 0.2s ease, height 0.3s ease' }}
                    />

                    {/* Loss Bar (Expense) */}
                    <rect 
                      x={centerX + 1.5} 
                      y={lossY} 
                      width={barWidth} 
                      height={Math.max(3, lossHeight)} 
                      rx="3"
                      fill="var(--color-expense)" 
                      opacity={isDimmed ? 0.35 : 0.9}
                      style={{ transition: 'opacity 0.2s ease, height 0.3s ease' }}
                    />

                    {/* X-axis Label */}
                    <text 
                      x={centerX} 
                      y="190" 
                      textAnchor="middle" 
                      fill={isHovered ? 'var(--text-primary)' : 'var(--text-muted)'} 
                      fontSize="9" 
                      fontWeight={isHovered ? '700' : '600'}
                      fontFamily="var(--font-main)"
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Interactive Tooltip on Hover */}
            {hoveredPnl && (
              <div className="pnl-chart-tooltip">
                <div className="tooltip-title">{hoveredPnl.fullDate || hoveredPnl.label}</div>
                <div className="tooltip-row profit">
                  <span>Profit:</span> <strong>+{formatCurrency(hoveredPnl.profit, symbol)}</strong>
                </div>
                <div className="tooltip-row loss">
                  <span>Loss:</span> <strong>-{formatCurrency(hoveredPnl.loss, symbol)}</strong>
                </div>
                <div className="tooltip-row net">
                  <span>Net:</span> 
                  <strong className={hoveredPnl.net >= 0 ? 'pos' : 'neg'}>
                    {hoveredPnl.net >= 0 ? '+' : ''}{formatCurrency(hoveredPnl.net, symbol)}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================================
          MIDDLE ROW: Revenue and Expenses Over Time + Today's Activity
          ==================================================================== */}
      <div className="fogo-middle-grid">
        {/* Revenue and Expenses Over Time Spline Wave Line Chart */}
        <div className="fogo-card fogo-spline-card">
          <div className="fogo-card-header">
            <div className="fogo-card-title-group">
              <h3 className="fogo-card-title">Revenue and Expenses Over Time</h3>
              <button
                type="button"
                className={`fogo-chart-help-btn ${showChartHelp ? 'active' : ''}`}
                onClick={() => setShowChartHelp(prev => !prev)}
                title="What is the purpose of this chart & what to do with it?"
                aria-label="What is this chart & how it helps"
              >
                <HelpCircle size={15} />
                <span className="fogo-chart-help-btn-text">Purpose & Guide</span>
              </button>
            </div>

            <div className="fogo-card-header-actions">
              <div className="fogo-timeframe-dropdown">
                <button
                  type="button"
                  className="timeframe-select-btn"
                  onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
                >
                  <span>{timeframe}</span>
                  <ChevronDown size={14} />
                </button>
                {isTimeframeOpen && (
                  <div className="timeframe-menu">
                    {['This week', 'This month', 'This year'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`timeframe-menu-item ${timeframe === t ? 'active' : ''}`}
                        onClick={() => { setTimeframe(t); setIsTimeframeOpen(false); }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Chart Purpose & What-to-Do Guide */}
          {showChartHelp && (
            <div className="fogo-chart-inline-help">
              <div className="fogo-chart-inline-help-top">
                <div className="fogo-chart-inline-help-title">
                  <Lightbulb size={16} style={{ color: '#f59e0b' }} />
                  <strong>Chart Purpose & What To Do</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {onOpenHelp && (
                    <button
                      type="button"
                      className="fogo-chart-help-link-btn"
                      onClick={() => onOpenHelp('revenue-chart')}
                      title="Open full guide in Help Center"
                    >
                      <span>Full Knowledge Base Guide</span>
                      <ExternalLink size={12} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="fogo-chart-inline-help-close"
                    onClick={() => setShowChartHelp(false)}
                    aria-label="Close guide"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="fogo-chart-inline-help-grid">
                <div className="fogo-chart-inline-help-item">
                  <span className="fogo-chart-inline-tag purpose">🎯 What Purpose This Chart Serves</span>
                  <p>
                    Visually contrasts incoming <strong>Revenue (Green Wave)</strong> with outgoing <strong>Expenses (Blue/Amber Wave)</strong>. Its primary purpose is to confirm you are cash-flow positive and alert you to unexpected cost peaks before savings decline.
                  </p>
                </div>
                <div className="fogo-chart-inline-help-item">
                  <span className="fogo-chart-inline-tag action">⚡ What To Do With This Chart</span>
                  <ul className="fogo-chart-inline-list">
                    <li><strong>Switch Timeframe:</strong> Toggle Week, Month, or Year to evaluate short-term burn vs. macro seasonality.</li>
                    <li><strong>Keep Surplus Positive:</strong> Make sure the green wave stays higher than the blue line. If blue crosses above, pause non-critical expenses.</li>
                    <li><strong>Allocate Surpluses:</strong> When green spikes, deposit extra earnings into your <em>Financial Goals</em>.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SVG Spline Wave Chart */}
          <div className="fogo-spline-body">
            <div className="spline-y-axis">
              <span>40</span>
              <span>30</span>
              <span>20</span>
              <span>10</span>
              <span>0</span>
            </div>

            <div className="spline-chart-canvas-wrap">
              {/* Floating Tooltip Pill (Matched to Screenshot) */}
              <div className="spline-tooltip-pill" style={{ left: '60%', top: '22%' }}>
                <span className="tooltip-tag">Today Revenue</span>
                <span className="tooltip-val">{formatCurrency(displayCash > 0 ? displayCash : 720, symbol)}</span>
                <div className="tooltip-arrow" />
              </div>

              <svg 
                className="spline-svg"
                viewBox="0 0 700 220" 
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Revenue wave gradient (Emerald) */}
                  <linearGradient id="fogoIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-income)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--color-income)" stopOpacity="0.0" />
                  </linearGradient>
                  {/* Target / Expense wave gradient (Amber) */}
                  <linearGradient id="fogoAmberGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-goal)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--color-goal)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="0" y1="20" x2="700" y2="20" stroke="var(--border-subtle)" strokeWidth="1" />
                <line x1="0" y1="65" x2="700" y2="65" stroke="var(--border-subtle)" strokeWidth="1" />
                <line x1="0" y1="110" x2="700" y2="110" stroke="var(--border-subtle)" strokeWidth="1" />
                <line x1="0" y1="155" x2="700" y2="155" stroke="var(--border-subtle)" strokeWidth="1" />
                <line x1="0" y1="200" x2="700" y2="200" stroke="var(--border-subtle)" strokeWidth="1" />

                {/* Amber/Gold Ribbon Area & Path */}
                <path
                  d="M 0 170 C 40 180, 80 140, 130 160 C 180 180, 220 120, 270 140 C 320 160, 360 170, 420 120 C 480 70, 520 150, 580 175 C 640 200, 670 140, 700 150 L 700 200 L 0 200 Z"
                  fill="url(#fogoAmberGrad)"
                />
                <path
                  d="M 0 170 C 40 180, 80 140, 130 160 C 180 180, 220 120, 270 140 C 320 160, 360 170, 420 120 C 480 70, 520 150, 580 175 C 640 200, 670 140, 700 150"
                  fill="none"
                  stroke="var(--color-goal)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Emerald Ribbon Area & Path */}
                <path
                  d="M 0 160 C 40 120, 80 110, 130 135 C 180 160, 220 80, 270 110 C 320 140, 370 70, 420 40 C 470 10, 510 130, 560 110 C 610 90, 660 160, 700 110 L 700 200 L 0 200 Z"
                  fill="url(#fogoIncomeGrad)"
                />
                <path
                  d="M 0 160 C 40 120, 80 110, 130 135 C 180 160, 220 80, 270 110 C 320 140, 370 70, 420 40 C 470 10, 510 130, 560 110 C 610 90, 660 160, 700 110"
                  fill="none"
                  stroke="var(--color-income)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Active Tooltip Data Point */}
                <circle cx="420" cy="40" r="5" fill="var(--bg-card)" stroke="var(--color-income)" strokeWidth="3" />
              </svg>

              {/* X-Axis Month Labels */}
              <div className="spline-x-axis">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Daily Financial Todos Card */}
        <div className="fogo-card fogo-todos-card">
          <div className="fogo-card-header fogo-todos-header">
            <div className="fogo-todos-title-group">
              <div className="fogo-todos-title-row">
                <ListTodo size={19} className="fogo-todos-icon" />
                <h3 className="fogo-card-title">Daily Todos</h3>
              </div>
              <span className="fogo-todos-progress-pill">
                {completedCount}/{todos.length} Done
              </span>
            </div>

            <div className="fogo-todos-header-actions">
              <button 
                type="button" 
                className={`fogo-card-more-btn ${isAddingTodo ? 'active' : ''}`}
                title="Add Daily Todo"
                onClick={() => setIsAddingTodo(prev => !prev)}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="fogo-todos-progress-track">
            <div 
              className="fogo-todos-progress-fill" 
              style={{ width: `${progressPercent}%` }}
              title={`${progressPercent}% completed`}
            />
          </div>

          {/* Quick Filter Tabs */}
          <div className="fogo-todos-filter-bar">
            {['all', 'pending', 'done'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`fogo-todos-tab ${todoFilter === tab ? 'active' : ''}`}
                onClick={() => setTodoFilter(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="tab-count">
                  {tab === 'all' ? todos.length : tab === 'pending' ? todos.length - completedCount : completedCount}
                </span>
              </button>
            ))}
          </div>

          {/* Inline Add Task Form */}
          {isAddingTodo && (
            <form className="fogo-todo-add-box" onSubmit={handleAddTodo}>
              <input
                type="text"
                className="fogo-todo-input"
                placeholder="Task description (e.g. Pay bills, check budget)..."
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                autoFocus
              />
              <div className="fogo-todo-add-footer">
                <div className="fogo-todo-cat-chips">
                  {['Bills', 'Budget', 'Savings', 'Expense', 'Review'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      className={`todo-chip ${newTodoCategory === cat ? 'active' : ''}`}
                      onClick={() => setNewTodoCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="fogo-todo-btn-group">
                  <button type="button" className="todo-btn-ghost" onClick={() => setIsAddingTodo(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="todo-btn-add" disabled={!newTodoText.trim()}>
                    Add Task
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* List of Todos */}
          <div className="fogo-todos-list">
            {filteredTodos.length > 0 ? (
              filteredTodos.map((item) => (
                <div 
                  key={item.id} 
                  className={`fogo-todo-item ${item.completed ? 'completed' : ''}`}
                >
                  <button
                    type="button"
                    className={`fogo-todo-check-btn ${item.completed ? 'checked' : ''}`}
                    onClick={() => handleToggleTodo(item.id)}
                    aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {item.completed && <Check size={12} strokeWidth={3} />}
                  </button>

                  <div className="fogo-todo-info" onClick={() => handleToggleTodo(item.id)}>
                    <span className="fogo-todo-label">{item.text}</span>
                    <div className="fogo-todo-meta">
                      <span className={`todo-cat-tag cat-${(item.category || 'other').toLowerCase()}`}>
                        {item.category}
                      </span>
                      {item.due && (
                        <span className="todo-due-tag">
                          <Clock size={10} />
                          {item.due}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="fogo-todo-del-btn"
                    title="Delete task"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTodo(item.id);
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            ) : (
              <div className="fogo-todos-empty">
                {todoFilter === 'done' ? (
                  <p>No completed tasks yet.</p>
                ) : todoFilter === 'pending' ? (
                  <div className="todos-empty-done">
                    <CheckCircle2 size={24} className="empty-done-icon" />
                    <p>All tasks completed for today! 🎉</p>
                  </div>
                ) : (
                  <div className="todos-empty-zero">
                    <p>No daily tasks found.</p>
                    <button type="button" className="btn-reset-todos" onClick={handleResetTodos}>
                      <RotateCcw size={12} /> Reset default todos
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================================
          BOTTOM ROW: Client Transactions Table
          ==================================================================== */}
      <div className="fogo-card fogo-table-card">
        <div className="fogo-card-header client-table-card-header">
          <div className="client-table-title-group">
            <h3 className="fogo-card-title">Client Transactions Table</h3>
            
            {/* Quick Type Filter Tabs (Strictly Income & Payment) */}
            <div className="client-tx-filter-pills" role="tablist" aria-label="Transaction type filter">
              <button
                type="button"
                className={`client-filter-btn ${tableFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTableFilter('all')}
              >
                All ({allTableRows.length})
              </button>
              <button
                type="button"
                className={`client-filter-btn income-btn ${tableFilter === 'income' ? 'active' : ''}`}
                onClick={() => setTableFilter('income')}
              >
                <ArrowUp size={12} />
                <span>Income ({incomeRowCount})</span>
              </button>
              <button
                type="button"
                className={`client-filter-btn payment-btn ${tableFilter === 'payment' ? 'active' : ''}`}
                onClick={() => setTableFilter('payment')}
              >
                <ArrowDown size={12} />
                <span>Payment ({paymentRowCount})</span>
              </button>
            </div>
          </div>

          <div className="client-table-actions">
            <button
              type="button"
              className="fogo-btn-quick-add"
              onClick={() => onOpenTransactionModal && onOpenTransactionModal('income')}
              title="Add Client Income Transaction"
            >
              <Plus size={13} />
              <span>Add Income</span>
            </button>
            <button
              type="button"
              className="fogo-btn-quick-add payment-quick"
              onClick={() => onOpenTransactionModal && onOpenTransactionModal('expense')}
              title="Add Client Payment Transaction"
            >
              <Plus size={13} />
              <span>Add Payment</span>
            </button>
            <button
              type="button"
              className="fogo-btn-outline-pill"
              onClick={() => onNavigateTab && onNavigateTab('transactions')}
            >
              View Details
            </button>
          </div>
        </div>

        <div className="fogo-table-wrapper">
          <table className="fogo-transactions-table">
            <thead>
              <tr>
                <th>ID No:</th>
                <th>Client Name</th>
                <th>Date</th>
                <th>Transaction type</th>
                <th>Amount</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTableRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                    No {tableFilter !== 'all' ? tableFilter : ''} transactions recorded yet.
                  </td>
                </tr>
              ) : (
                filteredTableRows.map((row) => (
                  <tr key={row.id}>
                    <td className="cell-id">{row.id}</td>
                    <td className="cell-client">
                      <strong>{row.client}</strong>
                    </td>
                    <td className="cell-date">{row.date}</td>
                    <td className="cell-type">
                      <span className={`fogo-status-pill ${row.status}`}>
                        {row.status === 'income' ? (
                          <ArrowUp size={11} className="pill-arrow-icon" />
                        ) : (
                          <ArrowDown size={11} className="pill-arrow-icon" />
                        )}
                        <span>{row.type}</span>
                      </span>
                    </td>
                    <td className="cell-amount amount-val">
                      <span className={row.status === 'income' ? 'table-amount-income' : 'table-amount-payment'}>
                        {row.status === 'income' ? '+' : '-'}{formatCurrency(row.amount, symbol)}
                      </span>
                    </td>
                    <td className="cell-action" style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="fogo-action-dots-btn"
                        onClick={() => {
                          if (row.rawTx) {
                            onOpenTransactionModal(null, row.rawTx);
                          } else {
                            onNavigateTab('transactions');
                          }
                        }}
                        title="View / Edit Transaction"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
