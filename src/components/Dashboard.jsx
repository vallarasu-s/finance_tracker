import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Wallet, 
  Coins, 
  CreditCard, 
  ArrowUp, 
  ArrowDown, 
  MoreVertical, 
  Plus,
  Eye,
  CheckCircle2,
  Receipt,
  Check,
  Trash2,
  Clock,
  ListTodo,
  RotateCcw,
  Calendar,
  Copy,
  Edit3,
  LayoutList,
  Table as TableIcon,
  ChevronDown,
  User,
  FileText
} from 'lucide-react';
import { 
  formatCurrency, 
  formatTime12Hour, 
  formatDate, 
  CATEGORIES, 
  getDailyTodos, 
  saveDailyTodos, 
  DEFAULT_DAILY_TODOS, 
  getPaymentMethodInfo,
  getCategoryInfo
} from '../services/storage';

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
  onDeleteTransaction,
  onDuplicateTransaction,
}) {
  const symbol = settings.currencySymbol || '$';

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

  // 4 KPI Display amounts - strictly computed from transactions (0 for new user accounts)
  const displayRevenue = totalIncome;
  const displayExpenses = totalExpense;
  const displayProfit = currentBalance;
  const displayCash = currentBalance;

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

  // Combined categories for resolving category names and icons
  const allCategories = useMemo(() => {
    return [...(CATEGORIES.expense || []), ...(CATEGORIES.income || [])];
  }, []);

  // Today's Client Transactions State & Filters (Strictly Today's Transactions)
  const [tableFilter, setTableFilter] = useState('all'); // 'all' | 'income' | 'payment'
  const [viewMode, setViewMode] = useState('list'); // 'list' (yellow mark view) | 'table'
  
  // Track expanded transaction card IDs (shows only category & amount until clicked)
  const [expandedTxIds, setExpandedTxIds] = useState(new Set());

  const toggleTxExpand = (txId) => {
    setExpandedTxIds(prev => {
      const next = new Set(prev);
      if (next.has(txId)) {
        next.delete(txId);
      } else {
        next.add(txId);
      }
      return next;
    });
  };

  // Strictly filter transactions to TODAY only ("what i mark viwe only today tration")
  const todayTransactionsList = useMemo(() => {
    return transactions.filter(t => t.date === todayStr);
  }, [transactions, todayStr]);

  const filteredTodayTransactions = useMemo(() => {
    if (tableFilter === 'all') return todayTransactionsList;
    if (tableFilter === 'income') return todayTransactionsList.filter(t => t.type === 'income');
    if (tableFilter === 'payment' || tableFilter === 'expense') return todayTransactionsList.filter(t => t.type === 'expense');
    return todayTransactionsList;
  }, [todayTransactionsList, tableFilter]);

  const todayIncomeCount = useMemo(() => todayTransactionsList.filter(t => t.type === 'income').length, [todayTransactionsList]);
  const todayPaymentCount = useMemo(() => todayTransactionsList.filter(t => t.type === 'expense').length, [todayTransactionsList]);

  // Formatted date header matching Screenshot 2 (e.g. TODAY, THU, OCT 1, 2026)
  const formattedTodayHeader = useMemo(() => {
    const now = new Date();
    const weekday = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const month = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = now.getDate();
    const year = now.getFullYear();
    return `TODAY, ${weekday}, ${month} ${day}, ${year}`;
  }, []);

  return (
    <div className="fogo-dashboard-layout">
      {/* ====================================================================
          TOP ROW: 4 KPI Cards
          ==================================================================== */}
      <div className="fogo-top-grid">
        {/* 4 Metric Cards */}
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
              <span>{transactions.length > 0 ? '5% This month' : '0% This month'}</span>
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
              <span>{transactions.length > 0 ? '5% This month' : '0% This month'}</span>
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
              <span>{transactions.length > 0 ? '7% This month' : '0% This month'}</span>
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
              <span>{transactions.length > 0 ? '2% This month' : '0% This month'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          BOTTOM ROW: Client Transactions Table + Daily Financial Todos
          ==================================================================== */}
      <div className="fogo-middle-grid">
        {/* Client Transactions Table (Left, 2fr) - View strictly today's transactions matching yellow-mark cards */}
        <div className="fogo-card fogo-table-card">
          <div className="fogo-card-header client-table-card-header">
            <div className="client-table-title-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 className="fogo-card-title">Daily Transactions</h3>
                <span className="badge badge-neutral" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', fontWeight: 700, color: 'var(--color-brand)', background: 'var(--color-brand-light)' }}>
                  Today ({todayTransactionsList.length})
                </span>
              </div>
              
              {/* Quick Type Filter Tabs (Strictly Income & Payment for Today) */}
              <div className="client-tx-filter-pills" role="tablist" aria-label="Transaction type filter">
                <button
                  type="button"
                  className={`client-filter-btn ${tableFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setTableFilter('all')}
                >
                  All ({todayTransactionsList.length})
                </button>
                <button
                  type="button"
                  className={`client-filter-btn income-btn ${tableFilter === 'income' ? 'active' : ''}`}
                  onClick={() => setTableFilter('income')}
                >
                  <ArrowUp size={12} />
                  <span>Income ({todayIncomeCount})</span>
                </button>
                <button
                  type="button"
                  className={`client-filter-btn payment-btn ${tableFilter === 'payment' ? 'active' : ''}`}
                  onClick={() => setTableFilter('payment')}
                >
                  <ArrowDown size={12} />
                  <span>Payment ({todayPaymentCount})</span>
                </button>
              </div>
            </div>

            <div className="client-table-actions">
              {/* View Switcher Toggle: List vs Table */}
              <div className="view-mode-toggle" style={{ display: 'inline-flex', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', padding: '2px' }}>
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                  style={{ 
                    padding: '0.25rem 0.55rem', 
                    borderRadius: 'var(--radius-full)', 
                    border: 'none', 
                    background: viewMode === 'list' ? 'var(--bg-card)' : 'transparent', 
                    color: viewMode === 'list' ? 'var(--color-brand)' : 'var(--text-muted)', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.25rem', 
                    fontSize: '0.72rem', 
                    fontWeight: 700,
                    boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <LayoutList size={13} />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="Table View"
                  style={{ 
                    padding: '0.25rem 0.55rem', 
                    borderRadius: 'var(--radius-full)', 
                    border: 'none', 
                    background: viewMode === 'table' ? 'var(--bg-card)' : 'transparent', 
                    color: viewMode === 'table' ? 'var(--color-brand)' : 'var(--text-muted)', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.25rem', 
                    fontSize: '0.72rem', 
                    fontWeight: 700,
                    boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <TableIcon size={13} />
                  <span>Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* Day Header with Daily Net Summary matching yellow mark in Screenshot 2 */}
          <div className="timeline-date-header" style={{ margin: '0.65rem 0 0.85rem 0', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="timeline-date-title">
              <Calendar size={15} color="var(--color-brand)" />
              <span>{formattedTodayHeader}</span>
            </div>

            <div className="timeline-date-totals">
              {todayIncome > 0 && (
                <span style={{ color: 'var(--color-income)', fontWeight: 700 }} className="amount-val">
                  +{formatCurrency(todayIncome, symbol)}
                </span>
              )}
              {todayExpense > 0 && (
                <span style={{ color: 'var(--color-expense)', fontWeight: 700 }} className="amount-val">
                  -{formatCurrency(todayExpense, symbol)}
                </span>
              )}
              <span 
                className={`badge ${todayNet >= 0 ? 'badge-income' : 'badge-expense'}`}
                style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                Net: {todayNet >= 0 ? '+' : ''}{formatCurrency(todayNet, symbol)}
              </span>
            </div>
          </div>

          {/* Content Body: Empty State OR List View (Yellow Mark) OR Table View */}
          {filteredTodayTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <Calendar size={36} style={{ opacity: 0.35, margin: '0 auto 0.75rem auto' }} />
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem', fontSize: '1rem' }}>No Transactions Today</h4>
              <p style={{ fontSize: '0.82rem', margin: '0 auto 1rem auto', maxWidth: '340px' }}>
                {tableFilter !== 'all' ? `No today ${tableFilter} transactions recorded yet.` : 'No transactions recorded for today yet. Start logging your daily income or expenses.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="fogo-btn-quick-add"
                  onClick={() => onOpenTransactionModal && onOpenTransactionModal('income')}
                >
                  <Plus size={13} /> Add Income
                </button>
                <button
                  type="button"
                  className="fogo-btn-quick-add payment-quick"
                  onClick={() => onOpenTransactionModal && onOpenTransactionModal('expense')}
                >
                  <Plus size={13} /> Add Payment
                </button>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            /* Yellow Mark View: Timeline Cards matching Screenshot 2 */
            <div className="timeline-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filteredTodayTransactions.map((tx) => {
                const catObj = (getCategoryInfo ? getCategoryInfo(tx.category, tx.type) : null) || allCategories.find(c => c.id === tx.category);
                const isInc = tx.type === 'income';
                const catColor = catObj?.color || (isInc ? '#10B981' : '#F97316');
                const isExpanded = expandedTxIds.has(tx.id);
                const pm = getPaymentMethodInfo(tx.paymentMethod);

                return (
                  <div 
                    key={tx.id} 
                    className={`transaction-card has-category-bg ${isExpanded ? 'is-expanded' : ''}`}
                    style={{
                      background: `linear-gradient(135deg, ${catColor}1c 0%, ${catColor}10 100%)`,
                      borderColor: `${catColor}35`,
                      '--tx-hover-bg': `linear-gradient(135deg, ${catColor}28 0%, ${catColor}18 100%)`,
                      '--tx-hover-border': `${catColor}60`,
                      '--tx-hover-shadow': `${catColor}24`
                    }}
                    onClick={() => toggleTxExpand(tx.id)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleTxExpand(tx.id);
                      }
                    }}
                  >
                    {/* Header Row: Strictly Category & Amount only (Collapsed view) */}
                    <div className="tx-header-row">
                      <div className="tx-main">
                        <div 
                          className="tx-icon-badge"
                          style={{ 
                            background: `${catColor}28`,
                            border: `1px solid ${catColor}45`
                          }}
                        >
                          <span>{catObj?.icon || (isInc ? '💰' : '📦')}</span>
                        </div>
                        <div className="tx-details">
                          <span className="tx-title">{catObj?.name || tx.category || 'Transaction'}</span>
                        </div>
                      </div>

                      <div className="tx-right">
                        <span 
                          className="tx-amount"
                          style={{ color: isInc ? 'var(--color-income)' : 'var(--color-expense)', whiteSpace: 'nowrap' }}
                        >
                          {isInc ? '+' : '-'}{formatCurrency(tx.amount, symbol)}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Details: Revealed when user clicks */}
                    {isExpanded && (
                      <div className="tx-expanded-details" onClick={(e) => e.stopPropagation()}>
                        <div className="tx-detail-badges">
                          {tx.date && (
                            <span className="tx-detail-badge" title="Transaction Date">
                              <Calendar size={13} color="var(--color-brand)" />
                              <span>{formatDate(tx.date)}</span>
                            </span>
                          )}
                          <span className="tx-detail-badge" title="Transaction Time">
                            <Clock size={13} color="var(--color-brand)" />
                            <span>{formatTime12Hour(tx.time) || '12:00 PM'}</span>
                          </span>
                          {tx.paymentMethod && (
                            <span className="tx-detail-badge" title={`Payment Method: ${pm.name}`}>
                              <span>{pm.icon}</span>
                              <span>{pm.name}</span>
                            </span>
                          )}
                          <span className="tx-detail-badge" title="Transaction Type">
                            <span className={`fogo-status-pill ${isInc ? 'income' : 'payment'}`} style={{ padding: '0.15rem 0.45rem', fontSize: '0.72rem' }}>
                              {isInc ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                              <span>{isInc ? 'Income' : 'Payment'}</span>
                            </span>
                          </span>
                        </div>

                        {(tx.recipient || tx.note) && (
                          <div className="tx-detail-extra">
                            {tx.recipient && (
                              <div className="tx-detail-row">
                                <User size={13} color="var(--text-muted)" />
                                <span>Payee / Source: <strong>{tx.recipient}</strong></span>
                              </div>
                            )}
                            {tx.note && (
                              <div className="tx-detail-row">
                                <FileText size={13} color="var(--text-muted)" />
                                <span>Note: <em>{tx.note}</em></span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="tx-detail-actions">
                          <button 
                            type="button"
                            className="tx-action-btn"
                            title="Duplicate Transaction"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateTransaction && onDuplicateTransaction(tx);
                            }}
                          >
                            <Copy size={13} />
                            <span>Duplicate</span>
                          </button>
                          <button 
                            type="button"
                            className="tx-action-btn edit-btn"
                            title="Edit Transaction"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenTransactionModal && onOpenTransactionModal(tx.type, tx);
                            }}
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>
                          <button 
                            type="button"
                            className="tx-action-btn delete-btn"
                            title="Delete Transaction"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteTransaction && onDeleteTransaction(tx.id);
                            }}
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View: Tabular Layout strictly for Today's Transactions */
            <div className="fogo-table-wrapper">
              <table className="fogo-transactions-table">
                <thead>
                  <tr>
                    <th>ID No:</th>
                    <th>Client / Category</th>
                    <th>Time</th>
                    <th>Transaction type</th>
                    <th>Amount</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTodayTransactions.map((tx, idx) => {
                    const catObj = (getCategoryInfo ? getCategoryInfo(tx.category, tx.type) : null) || allCategories.find(c => c.id === tx.category);
                    const isInc = tx.type === 'income';
                    const catColor = catObj?.color || (isInc ? '#10B981' : '#F97316');
                    const pm = getPaymentMethodInfo(tx.paymentMethod);

                    return (
                      <tr key={tx.id || idx}>
                        <td className="cell-id">#{tx.id ? String(tx.id).slice(-4) : (1588 + idx)}</td>
                        <td className="cell-client">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                            <span style={{ fontSize: '1.1rem' }}>{catObj?.icon || (isInc ? '💰' : '📦')}</span>
                            <div>
                              <strong>{catObj?.name || tx.category || (isInc ? 'Income' : 'Expense')}</strong>
                              {tx.recipient && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{tx.recipient}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="cell-date">
                          <div>{formatTime12Hour(tx.time) || '12:00 PM'}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDate(tx.date)}</div>
                        </td>
                        <td className="cell-type">
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span className={`fogo-status-pill ${isInc ? 'income' : 'payment'}`}>
                              {isInc ? (
                                <ArrowUp size={11} className="pill-arrow-icon" />
                              ) : (
                                <ArrowDown size={11} className="pill-arrow-icon" />
                              )}
                              <span>{isInc ? 'Income' : 'Payment'}</span>
                            </span>
                            <span className="table-pm-tag" title={`Payment Method: ${pm.name}`}>
                              <span>{pm.icon}</span> <span>{pm.name}</span>
                            </span>
                          </div>
                        </td>
                        <td className="cell-amount amount-val">
                          <span className={isInc ? 'table-amount-income' : 'table-amount-payment'}>
                            {isInc ? '+' : '-'}{formatCurrency(tx.amount, symbol)}
                          </span>
                        </td>
                        <td className="cell-action" style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon-only"
                              onClick={() => onDuplicateTransaction && onDuplicateTransaction(tx)}
                              title="Duplicate Transaction"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon-only"
                              onClick={() => onOpenTransactionModal && onOpenTransactionModal(tx.type, tx)}
                              title="Edit Transaction"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon-only"
                              style={{ color: 'var(--color-expense)' }}
                              onClick={() => onDeleteTransaction && onDeleteTransaction(tx.id)}
                              title="Delete Transaction"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Daily Financial Todos Card (Right, 1fr) */}
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
    </div>
  );
}
