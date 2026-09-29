import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  Edit3, 
  Copy,
  CalendarRange
} from 'lucide-react';
import { formatCurrency, formatTime12Hour, formatDate, CATEGORIES } from '../services/storage';

export default function DailyTransactions({
  transactions,
  settings,
  onOpenTransactionModal,
  onDeleteTransaction,
  onDuplicateTransaction,
}) {
  const symbol = settings.currencySymbol || '$';

  // Filters state
  const [dateFilter, setDateFilter] = useState('today'); // 'all', 'today', 'yesterday', 'week', 'month'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'income', 'expense'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper date calculations
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const sevenDaysAgoDate = new Date();
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgoDate.toISOString().split('T')[0];

  const currentMonthStr = todayStr.substring(0, 7);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Date filter
      if (dateFilter === 'today' && tx.date !== todayStr) return false;
      if (dateFilter === 'yesterday' && tx.date !== yesterdayStr) return false;
      if (dateFilter === 'week' && (tx.date < sevenDaysAgoStr || tx.date > todayStr)) return false;
      if (dateFilter === 'month' && !tx.date.startsWith(currentMonthStr)) return false;

      // Type filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

      // Category filter
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const noteMatch = (tx.note || '').toLowerCase().includes(query);
        const recipientMatch = (tx.recipient || '').toLowerCase().includes(query);
        const catMatch = (tx.category || '').toLowerCase().includes(query);
        const payMatch = (tx.paymentMethod || '').toLowerCase().includes(query);
        const amountMatch = String(tx.amount || '').includes(query);
        if (!noteMatch && !recipientMatch && !catMatch && !payMatch && !amountMatch) return false;
      }

      return true;
    });
  }, [transactions, dateFilter, typeFilter, selectedCategory, searchQuery, todayStr, yesterdayStr, sevenDaysAgoStr, currentMonthStr]);

  // Group filtered transactions by Date
  const groupedTransactions = useMemo(() => {
    const groups = {};
    for (const tx of filteredTransactions) {
      const d = tx.date || 'Undated';
      if (!groups[d]) groups[d] = [];
      groups[d].push(tx);
    }

    // Sort dates descending
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedDates.map(date => {
      const items = groups[date];
      const dayIncome = items.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
      const dayExpense = items.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
      const dayNet = dayIncome - dayExpense;

      return {
        date,
        items,
        dayIncome,
        dayExpense,
        dayNet
      };
    });
  }, [filteredTransactions]);

  // Format date header label
  const formatDateLabel = (dStr) => {
    if (dStr === todayStr) return `Today, ${formatNiceDate(dStr)}`;
    if (dStr === yesterdayStr) return `Yesterday, ${formatNiceDate(dStr)}`;
    return formatNiceDate(dStr);
  };

  const formatNiceDate = (dStr) => {
    try {
      const [year, month, day] = dStr.split('-');
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  // Calculate filtered totals
  const totalFilteredIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const totalFilteredExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const netFiltered = totalFilteredIncome - totalFilteredExpense;
  const allCategories = [...CATEGORIES.expense, ...CATEGORIES.income];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Daily Banner with Totals */}
      <div className="daily-banner">
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Daily Tracker Summary ({dateFilter.toUpperCase()})
          </span>
          <h2 className="daily-banner-title" style={{ marginTop: '0.25rem' }}>
            {dateFilter === 'today' ? "Today's Daily Activity" : "Daily Inflow & Outflow"}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.4rem' }}>
            <span className="badge badge-neutral">
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
            </span>
            <span className={`badge ${netFiltered >= 0 ? 'badge-income' : 'badge-expense'}`}>
              Net: {netFiltered >= 0 ? '+' : ''}
              {formatCurrency(netFiltered, symbol)}
            </span>
          </div>
        </div>

        <div className="daily-banner-stats">
          <div className="daily-stat-item daily-stat-net">
            <span className="daily-stat-label">Net Balance</span>
            <span 
              className="daily-stat-value amount-val" 
              style={{ color: netFiltered >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}
            >
              {netFiltered >= 0 ? '+' : ''}{formatCurrency(netFiltered, symbol)}
            </span>
          </div>

          <div className="daily-stat-item">
            <span className="daily-stat-label">Inflow</span>
            <span className="daily-stat-value amount-val" style={{ color: 'var(--color-income)' }}>
              +{formatCurrency(totalFilteredIncome, symbol)}
            </span>
          </div>
          <div className="daily-stat-item">
            <span className="daily-stat-label">Outflow</span>
            <span className="daily-stat-value amount-val" style={{ color: 'var(--color-expense)' }}>
              -{formatCurrency(totalFilteredExpense, symbol)}
            </span>
          </div>

          <button 
            className="btn btn-primary daily-banner-action-btn"
            onClick={() => onOpenTransactionModal()}
          >
            <Plus size={18} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search, Date Filter, Type Filter */}
      <div className="toolbar">
        {/* Search */}
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text"
            className="form-input search-input"
            placeholder="Search notes, merchants, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Date Filter Buttons */}
        <div className="toolbar-group toolbar-date-group">
          <span className="toolbar-group-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Date:</span>
          <div className="toolbar-date-options">
            {['all', 'today', 'yesterday', 'week', 'month'].map(period => (
              <button
                key={period}
                className={`btn btn-secondary ${dateFilter === period ? 'btn-primary' : ''}`}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', textTransform: 'capitalize' }}
                onClick={() => setDateFilter(period)}
              >
                {period === 'week' ? 'Last 7 Days' : period === 'month' ? 'This Month' : period}
              </button>
            ))}
          </div>
        </div>

        {/* Type Filter Buttons */}
        <div className="toolbar-group toolbar-type-group">
          <span className="toolbar-group-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Type:</span>
          <div className="toolbar-type-options">
            <button 
              className={`btn btn-secondary ${typeFilter === 'all' ? 'btn-primary' : ''}`}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => setTypeFilter('all')}
            >
              All
            </button>
            <button 
              className={`btn btn-secondary ${typeFilter === 'income' ? 'btn-income' : ''}`}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => setTypeFilter('income')}
            >
              Income
            </button>
            <button 
              className={`btn btn-secondary ${typeFilter === 'expense' ? 'btn-expense' : ''}`}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => setTypeFilter('expense')}
            >
              Expense
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="category-chips-scroll">
        <button
          className={`badge ${selectedCategory === 'all' ? 'badge-income' : 'badge-neutral'}`}
          style={{ cursor: 'pointer', padding: '0.4rem 0.8rem' }}
          onClick={() => setSelectedCategory('all')}
        >
          All Categories
        </button>
        {allCategories.map(cat => (
          <button
            key={cat.id}
            className={`badge ${selectedCategory === cat.id ? 'badge-goal' : 'badge-neutral'}`}
            style={{ cursor: 'pointer', padding: '0.4rem 0.8rem' }}
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Grouped Day-by-Day Timeline */}
      {groupedTransactions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
          <CalendarRange size={48} style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No Transactions Found
          </h3>
          <p style={{ maxWidth: '400px', margin: '0 auto 1.25rem auto' }}>
            No transactions match the selected filters or search terms. Try clearing filters or add a new transaction.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => onOpenTransactionModal()}
          >
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      ) : (
        <div className="timeline-section">
          {groupedTransactions.map(group => (
            <div key={group.date} className="timeline-group">
              {/* Day Header with Daily Net Summary */}
              <div className="timeline-date-header">
                <div className="timeline-date-title">
                  <Calendar size={15} color="var(--color-brand)" />
                  <span>{formatDateLabel(group.date)}</span>
                </div>

                <div className="timeline-date-totals">
                  {group.dayIncome > 0 && (
                    <span style={{ color: 'var(--color-income)' }} className="amount-val">
                      +{formatCurrency(group.dayIncome, symbol)}
                    </span>
                  )}
                  {group.dayExpense > 0 && (
                    <span style={{ color: 'var(--color-expense)' }} className="amount-val">
                      -{formatCurrency(group.dayExpense, symbol)}
                    </span>
                  )}
                  <span 
                    className={`badge ${group.dayNet >= 0 ? 'badge-income' : 'badge-expense'}`}
                    style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', whiteSpace: 'nowrap' }}
                  >
                    Net: {group.dayNet >= 0 ? '+' : ''}{formatCurrency(group.dayNet, symbol)}
                  </span>
                </div>
              </div>

              {/* Day Transaction Items */}
              {group.items.map(tx => {
                const catObj = allCategories.find(c => c.id === tx.category);
                const isInc = tx.type === 'income';

                return (
                  <div key={tx.id} className="transaction-card">
                    <div className="tx-main">
                      <div 
                        className="tx-icon-badge"
                        style={{ background: catObj ? `${catObj.color}20` : 'rgba(255,255,255,0.08)' }}
                      >
                        <span>{catObj?.icon || (isInc ? '💰' : '📦')}</span>
                      </div>
                      <div className="tx-details">
                        <span className="tx-title">{tx.recipient || tx.note || catObj?.name || 'Transaction'}</span>
                        <div className="tx-meta">
                          {tx.recipient && tx.note && (
                            <>
                              <span>{tx.note}</span>
                              <span>•</span>
                            </>
                          )}
                          <span style={{ color: catObj?.color || 'inherit', fontWeight: 600 }}>
                            {catObj?.name || tx.category}
                          </span>
                          {tx.date && (
                            <>
                              <span>•</span>
                              <span className="tx-date-val">{formatDate(tx.date)}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="tx-time-val">{formatTime12Hour(tx.time) || '12:00 PM'}</span>
                          {tx.paymentMethod && (
                            <>
                              <span>•</span>
                              <span style={{ textTransform: 'capitalize' }}>
                                {tx.paymentMethod}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="tx-right">
                      <span 
                        className="tx-amount"
                        style={{ color: isInc ? 'var(--color-income)' : 'var(--color-expense)', whiteSpace: 'nowrap' }}
                      >
                        {isInc ? '+' : '-'}{formatCurrency(tx.amount, symbol)}
                      </span>

                      <div className="tx-actions">
                        <button 
                          className="btn btn-ghost btn-icon-only"
                          title="Duplicate Transaction"
                          onClick={() => onDuplicateTransaction(tx)}
                        >
                          <Copy size={15} />
                        </button>
                        <button 
                          className="btn btn-ghost btn-icon-only"
                          title="Edit Transaction"
                          onClick={() => onOpenTransactionModal(null, tx)}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          className="btn btn-ghost btn-icon-only"
                          style={{ color: 'var(--color-expense)' }}
                          title="Delete Transaction"
                          onClick={() => onDeleteTransaction(tx.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
