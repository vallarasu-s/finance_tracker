import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar as CalendarIcon, 
  Filter, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  Edit3, 
  Copy,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  SlidersHorizontal,
  PieChart,
  BarChart2,
  List,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  User,
  FileText,
  Clock
} from 'lucide-react';
import { 
  formatCurrency, 
  formatTime12Hour, 
  formatDate, 
  CATEGORIES, 
  getPaymentMethodInfo,
  getCategoryInfo 
} from '../services/storage';

export default function DailyTransactions({
  transactions = [],
  settings = {},
  onOpenTransactionModal,
  onDeleteTransaction,
  onDuplicateTransaction,
}) {
  const symbol = settings.currencySymbol || '₹';

  // Sub-navigation view state: 'calendar' (Money Manager style) | 'daily' | 'monthly' | 'total'
  const [activeView, setActiveView] = useState('calendar');

  // Month navigation state for Calendar View (e.g. Sep 2026)
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth()); // 0-11
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

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

  // Month Navigation Handlers
  const handlePrevMonth = () => {
    setCalMonth(prev => {
      if (prev === 0) {
        setCalYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCalMonth(prev => {
      if (prev === 11) {
        setCalYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleJumpToToday = () => {
    const current = new Date();
    setCalYear(current.getFullYear());
    setCalMonth(current.getMonth());
    setSelectedDate(todayStr);
  };

  // Month display label e.g. "Sep 2026" (matches screenshot: "< Sep 2026 >")
  const calMonthDisplay = useMemo(() => {
    const d = new Date(calYear, calMonth, 1);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [calYear, calMonth]);

  // All transactions in the currently viewed month
  const viewedMonthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => (t.date || '').startsWith(viewedMonthPrefix));
  }, [transactions, viewedMonthPrefix]);

  // Month Summary Totals (Income in blue, Expenses in red, Total in white)
  const monthIncome = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount || 0), 0);
  }, [monthTransactions]);

  const monthExpense = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount || 0), 0);
  }, [monthTransactions]);

  const monthNet = monthIncome - monthExpense;

  // Generate Calendar Days Grid (7 columns: Sun through Sat)
  const calendarGridDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const startWeekday = firstDay.getDay(); // 0 = Sun, 6 = Sat
    const daysInCurrentMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

    const prevMonthIndex = calMonth === 0 ? 11 : calMonth - 1;
    const prevMonthYear = calMonth === 0 ? calYear - 1 : calYear;

    const nextMonthIndex = calMonth === 11 ? 0 : calMonth + 1;
    const nextMonthYear = calMonth === 11 ? calYear + 1 : calYear;

    const cells = [];

    // 1. Previous month trailing days
    for (let i = startWeekday - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const dateStr = `${prevMonthYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      const weekday = (startWeekday - 1 - i + 7) % 7;

      const txs = transactions.filter(t => t.date === dateStr);
      const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
      const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
      const net = inc - exp;

      cells.push({
        dateStr,
        dayNumber: dNum,
        displayLabel: String(dNum),
        isCurrentMonth: false,
        targetYear: prevMonthYear,
        targetMonth: prevMonthIndex,
        weekday,
        income: inc,
        expense: exp,
        net,
        hasTransactions: txs.length > 0
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const weekday = new Date(calYear, calMonth, d).getDay();

      const txs = transactions.filter(t => t.date === dateStr);
      const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
      const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
      const net = inc - exp;

      const displayLabel = String(d);

      cells.push({
        dateStr,
        dayNumber: d,
        displayLabel,
        isCurrentMonth: true,
        targetYear: calYear,
        targetMonth: calMonth,
        weekday,
        income: inc,
        expense: exp,
        net,
        hasTransactions: txs.length > 0
      });
    }

    // 3. Next month leading days (to complete 5 or 6 weeks)
    const totalSoFar = cells.length;
    const targetTotal = totalSoFar > 35 ? 42 : 35;
    const remaining = targetTotal - totalSoFar;

    for (let nd = 1; nd <= remaining; nd++) {
      const dateStr = `${nextMonthYear}-${String(nextMonthIndex + 1).padStart(2, '0')}-${String(nd).padStart(2, '0')}`;
      const weekday = new Date(nextMonthYear, nextMonthIndex, nd).getDay();

      const txs = transactions.filter(t => t.date === dateStr);
      const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
      const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
      const net = inc - exp;

      const displayLabel = String(nd);

      cells.push({
        dateStr,
        dayNumber: nd,
        displayLabel,
        isCurrentMonth: false,
        targetYear: nextMonthYear,
        targetMonth: nextMonthIndex,
        weekday,
        income: inc,
        expense: exp,
        net,
        hasTransactions: txs.length > 0
      });
    }

    return cells;
  }, [calYear, calMonth, transactions]);

  // Click on Day cell
  const handleSelectDay = (cell) => {
    setSelectedDate(cell.dateStr);
    if (!cell.isCurrentMonth) {
      setCalYear(cell.targetYear);
      setCalMonth(cell.targetMonth);
    }
  };

  // Selected Day Transactions Details
  const selectedDayTransactions = useMemo(() => {
    return transactions.filter(t => t.date === selectedDate);
  }, [transactions, selectedDate]);

  const selectedDayIncome = useMemo(() => {
    return selectedDayTransactions
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount || 0), 0);
  }, [selectedDayTransactions]);

  const selectedDayExpense = useMemo(() => {
    return selectedDayTransactions
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount || 0), 0);
  }, [selectedDayTransactions]);

  const selectedDayNet = selectedDayIncome - selectedDayExpense;

  const formattedSelectedDateHeader = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Format cell numbers with clean decimals or compact notation
  const formatCellAmount = (val) => {
    if (!val || val === 0) return '';
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    }
    return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // =========================================================================
  // DAILY TIMELINE VIEW FILTERS (Preserved from existing component)
  // =========================================================================
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'yesterday', 'week', 'month'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'income', 'expense'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const sevenDaysAgoDate = new Date();
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgoDate.toISOString().split('T')[0];

  const currentMonthStr = todayStr.substring(0, 7);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (dateFilter === 'today' && tx.date !== todayStr) return false;
      if (dateFilter === 'yesterday' && tx.date !== yesterdayStr) return false;
      if (dateFilter === 'week' && (tx.date < sevenDaysAgoStr || tx.date > todayStr)) return false;
      if (dateFilter === 'month' && !tx.date.startsWith(currentMonthStr)) return false;

      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;

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

  const groupedTransactions = useMemo(() => {
    const groups = {};
    for (const tx of filteredTransactions) {
      const d = tx.date || 'Undated';
      if (!groups[d]) groups[d] = [];
      groups[d].push(tx);
    }

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

  const allCategories = useMemo(() => [...CATEGORIES.expense, ...CATEGORIES.income], []);

  // =========================================================================
  // MONTHLY VIEW: 12-Month Table Comparison
  // =========================================================================
  const monthsComparison = useMemo(() => {
    const months = [];
    for (let m = 0; m < 12; m++) {
      const prefix = `${calYear}-${String(m + 1).padStart(2, '0')}`;
      const mDate = new Date(calYear, m, 1);
      const mLabel = mDate.toLocaleDateString('en-US', { month: 'short' });
      const mFullName = mDate.toLocaleDateString('en-US', { month: 'long' });

      const txs = transactions.filter(t => (t.date || '').startsWith(prefix));
      const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
      const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
      const net = inc - exp;

      months.push({
        monthIndex: m,
        prefix,
        label: mLabel,
        fullName: mFullName,
        count: txs.length,
        income: inc,
        expense: exp,
        net
      });
    }
    return months;
  }, [calYear, transactions]);

  // =========================================================================
  // TOTAL VIEW: Category Breakdown
  // =========================================================================
  const categoryTotals = useMemo(() => {
    const map = {};
    for (const tx of transactions) {
      const cat = tx.category || 'other';
      if (!map[cat]) {
        map[cat] = {
          category: cat,
          income: 0,
          expense: 0,
          count: 0
        };
      }
      map[cat].count++;
      if (tx.type === 'income') {
        map[cat].income += Number(tx.amount || 0);
      } else {
        map[cat].expense += Number(tx.amount || 0);
      }
    }
    return Object.values(map).sort((a, b) => (b.expense + b.income) - (a.expense + a.income));
  }, [transactions]);

  return (
    <div className="fogo-trans-tracker-container">
      {/* =====================================================================
          SUB-NAVIGATION HEADER TABS (Matches Money Manager screenshot)
          [ Daily ] [ Calendar ] [ Monthly ] [ Total ]
          ===================================================================== */}
      <div className="fogo-tracker-tabs-header">
        <div className="fogo-tracker-tabs" role="tablist">
          <button
            type="button"
            className={`fogo-tracker-tab-btn ${activeView === 'daily' ? 'active' : ''}`}
            onClick={() => setActiveView('daily')}
            role="tab"
            aria-selected={activeView === 'daily'}
          >
            <List size={16} />
            <span>Daily</span>
          </button>

          <button
            type="button"
            className={`fogo-tracker-tab-btn ${activeView === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveView('calendar')}
            role="tab"
            aria-selected={activeView === 'calendar'}
          >
            <CalendarIcon size={16} />
            <span>Calendar</span>
          </button>

          <button
            type="button"
            className={`fogo-tracker-tab-btn ${activeView === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveView('monthly')}
            role="tab"
            aria-selected={activeView === 'monthly'}
          >
            <BarChart2 size={16} />
            <span>Monthly</span>
          </button>

          <button
            type="button"
            className={`fogo-tracker-tab-btn ${activeView === 'total' ? 'active' : ''}`}
            onClick={() => setActiveView('total')}
            role="tab"
            aria-selected={activeView === 'total'}
          >
            <PieChart size={16} />
            <span>Total</span>
          </button>
        </div>

        <div className="fogo-tracker-action-wrapper">
          <button 
            type="button"
            className="btn btn-primary fogo-tracker-new-tx-btn"
            onClick={() => onOpenTransactionModal && onOpenTransactionModal('expense', { date: selectedDate })}
          >
            <Plus size={16} />
            <span className="new-tx-label-full">New Transaction</span>
            <span className="new-tx-label-short">New</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          VIEW 1: CALENDAR VIEW (Matches Screenshot from User)
          ===================================================================== */}
      {activeView === 'calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Main Calendar Card */}
          <div className="fogo-calendar-card">
            {/* Top Month Navigation Bar: < Sep 2026 > + Quick tools */}
            <div className="calendar-month-bar">
              <div className="calendar-month-selector">
                <button
                  type="button"
                  className="calendar-nav-arrow-btn"
                  onClick={handlePrevMonth}
                  title="Previous Month"
                  aria-label="Previous Month"
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  type="button"
                  className="calendar-month-title-btn"
                  onClick={handleJumpToToday}
                  title="Click to jump to Today"
                >
                  <span>{calMonthDisplay}</span>
                  <ChevronRight size={15} style={{ opacity: 0.6 }} />
                </button>

                <button
                  type="button"
                  className="calendar-nav-arrow-btn"
                  onClick={handleNextMonth}
                  title="Next Month"
                  aria-label="Next Month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="calendar-month-tools">
                <button
                  type="button"
                  className="calendar-tool-btn"
                  onClick={handleJumpToToday}
                  title="Go to Current Day"
                >
                  <RotateCcw size={13} />
                  <span>Today</span>
                </button>

                <button
                  type="button"
                  className="calendar-tool-btn"
                  onClick={() => setActiveView('daily')}
                  title="Switch to Search & Filter List View"
                >
                  <Search size={13} />
                  <span>Search</span>
                </button>
              </div>
            </div>

            {/* Monthly Financial Summary Strip (Income blue, Expenses red, Total white) */}
            <div className="calendar-summary-strip">
              <div className="calendar-summary-col">
                <span className="summary-col-label">Income</span>
                <span className="summary-col-amount income" title={formatCurrency(monthIncome, symbol, { compact: false, settings })}>
                  {formatCurrency(monthIncome, symbol, { compact: true, settings })}
                </span>
              </div>

              <div className="calendar-summary-col">
                <span className="summary-col-label">Expenses</span>
                <span className="summary-col-amount expense" title={formatCurrency(monthExpense, symbol, { compact: false, settings })}>
                  {formatCurrency(monthExpense, symbol, { compact: true, settings })}
                </span>
              </div>

              <div className="calendar-summary-col">
                <span className="summary-col-label">Total</span>
                <span className="summary-col-amount total" title={`${monthNet >= 0 ? '+' : ''}${formatCurrency(monthNet, symbol, { compact: false, settings })}`}>
                  {monthNet >= 0 ? '+' : ''}{formatCurrency(monthNet, symbol, { compact: true, settings })}
                </span>
              </div>
            </div>

            {/* Calendar Grid Container */}
            <div className="calendar-grid-wrapper">
              {/* Day of Week Headers (Sun in Red, Sat in Blue, Weekdays in Slate) */}
              <div className="calendar-weekdays-row">
                <div className="calendar-weekday-cell sun">Sun</div>
                <div className="calendar-weekday-cell">Mon</div>
                <div className="calendar-weekday-cell">Tue</div>
                <div className="calendar-weekday-cell">Wed</div>
                <div className="calendar-weekday-cell">Thu</div>
                <div className="calendar-weekday-cell">Fri</div>
                <div className="calendar-weekday-cell sat">Sat</div>
              </div>

              {/* Calendar Days Matrix */}
              <div className="calendar-days-grid">
                {calendarGridDays.map((cell, idx) => {
                  const isSun = cell.weekday === 0;
                  const isSat = cell.weekday === 6;
                  const isSelected = cell.dateStr === selectedDate;
                  const isToday = cell.dateStr === todayStr;

                  return (
                    <div
                      key={cell.dateStr + '-' + idx}
                      className={`calendar-day-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectDay(cell)}
                      title={`${cell.dateStr}${cell.hasTransactions ? ` | Income: +${formatCurrency(cell.income, symbol)}, Expense: -${formatCurrency(cell.expense, symbol)}` : ''}`}
                    >
                      {/* Top Day Header: Day number + Today dot */}
                      <div className="calendar-day-header">
                        <span className={`calendar-day-number ${isSun ? 'sun' : isSat ? 'sat' : ''}`}>
                          {cell.displayLabel}
                        </span>
                        {isToday && !isSelected && <span className="calendar-today-dot" title="Today" />}
                      </div>

                      {/* Financial amounts inside cell (stacked: Income blue, Expense red, Net white) */}
                      {cell.hasTransactions && (
                        <div className="calendar-day-finance">
                          {cell.income > 0 && (
                            <span className="cal-amt-income">
                              {formatCellAmount(cell.income)}
                            </span>
                          )}
                          {cell.expense > 0 && (
                            <span className="cal-amt-expense">
                              {formatCellAmount(cell.expense)}
                            </span>
                          )}
                          {cell.income > 0 && cell.expense > 0 && (
                            <span className="cal-amt-net">
                              {formatCellAmount(cell.net)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Date Transaction Breakdown Details */}
          <div className="calendar-selected-day-card">
            <div className="selected-day-header-row">
              <div className="selected-day-date-info">
                <div className="selected-day-badge-icon">
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <h3 className="selected-day-title">{formattedSelectedDateHeader}</h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {selectedDayTransactions.length} {selectedDayTransactions.length === 1 ? 'transaction' : 'transactions'} recorded
                  </div>
                </div>
              </div>

              <div className="selected-day-totals-strip">
                {selectedDayIncome > 0 && (
                  <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem' }} className="amount-val">
                    +{formatCurrency(selectedDayIncome, symbol)}
                  </span>
                )}
                {selectedDayExpense > 0 && (
                  <span style={{ color: '#ff5757', fontWeight: 700, fontSize: '0.85rem' }} className="amount-val">
                    -{formatCurrency(selectedDayExpense, symbol)}
                  </span>
                )}
                <span 
                  className={`badge ${selectedDayNet >= 0 ? 'badge-income' : 'badge-expense'}`}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', fontWeight: 700 }}
                >
                  Net: {selectedDayNet >= 0 ? '+' : ''}{formatCurrency(selectedDayNet, symbol)}
                </span>
              </div>
            </div>

            {/* List of Transactions on Selected Day */}
            {selectedDayTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <CalendarRange size={36} style={{ opacity: 0.35, margin: '0 auto 0.65rem auto' }} />
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem', fontSize: '0.95rem' }}>No Transactions on this Day</h4>
                <p style={{ fontSize: '0.82rem', margin: '0 auto 1rem auto', maxWidth: '320px' }}>
                  Tap below to log your income or expenses for {formattedSelectedDateHeader}.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="fogo-btn-quick-add"
                    onClick={() => onOpenTransactionModal && onOpenTransactionModal('income', { date: selectedDate })}
                  >
                    <Plus size={13} /> Add Income
                  </button>
                  <button
                    type="button"
                    className="fogo-btn-quick-add payment-quick"
                    onClick={() => onOpenTransactionModal && onOpenTransactionModal('expense', { date: selectedDate })}
                  >
                    <Plus size={13} /> Add Expense
                  </button>
                </div>
              </div>
            ) : (
              <div className="timeline-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {selectedDayTransactions.map(tx => {
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
                      {/* Header Row: Category & Amount only */}
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
                            style={{ color: isInc ? '#38bdf8' : '#ff5757', whiteSpace: 'nowrap', fontWeight: 700 }}
                          >
                            {isInc ? '+' : '-'}{formatCurrency(tx.amount, symbol)}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Details: Revealed when clicked */}
                      {isExpanded && (
                        <div className="tx-expanded-details" onClick={(e) => e.stopPropagation()}>
                          <div className="tx-detail-badges">
                            {tx.date && (
                              <span className="tx-detail-badge" title="Transaction Date">
                                <CalendarIcon size={13} color="var(--color-brand)" />
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
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: DAILY TIMELINE VIEW (Full Search & Category Chips)
          ===================================================================== */}
      {activeView === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Toolbar: Search, Date Filter, Type Filter */}
          <div className="toolbar">
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

            <div className="toolbar-group toolbar-date-group">
              <span className="toolbar-group-label">Date:</span>
              <div className="toolbar-date-options">
                {['all', 'today', 'yesterday', 'week', 'month'].map(period => (
                  <button
                    key={period}
                    className={`btn btn-secondary toolbar-filter-btn ${dateFilter === period ? 'btn-primary' : ''}`}
                    onClick={() => setDateFilter(period)}
                  >
                    <span className="toolbar-filter-label-full">
                      {period === 'week' ? 'Last 7 Days' : period === 'month' ? 'This Month' : period === 'all' ? 'All' : period === 'today' ? 'Today' : 'Yesterday'}
                    </span>
                    <span className="toolbar-filter-label-short">
                      {period === 'week' ? '7 Days' : period === 'month' ? 'Month' : period === 'all' ? 'All' : period === 'today' ? 'Today' : 'Yesterday'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="toolbar-group toolbar-type-group">
              <span className="toolbar-group-label">Type:</span>
              <div className="toolbar-type-options">
                <button 
                  className={`btn btn-secondary toolbar-filter-btn ${typeFilter === 'all' ? 'btn-primary' : ''}`}
                  onClick={() => setTypeFilter('all')}
                >
                  All
                </button>
                <button 
                  className={`btn btn-secondary toolbar-filter-btn ${typeFilter === 'income' ? 'btn-income' : ''}`}
                  onClick={() => setTypeFilter('income')}
                >
                  Income
                </button>
                <button 
                  className={`btn btn-secondary toolbar-filter-btn ${typeFilter === 'expense' ? 'btn-expense' : ''}`}
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
                onClick={() => onOpenTransactionModal && onOpenTransactionModal()}
              >
                <Plus size={16} /> Add Transaction
              </button>
            </div>
          ) : (
            <div className="timeline-section">
              {groupedTransactions.map(group => (
                <div key={group.date} className="timeline-group">
                  <div className="timeline-date-header">
                    <div className="timeline-date-title">
                      <CalendarIcon size={15} color="var(--color-brand)" />
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

                  {group.items.map(tx => {
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
                        {/* Header Row: Category & Amount only */}
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

                        {/* Expanded Details: Revealed when clicked */}
                        {isExpanded && (
                          <div className="tx-expanded-details" onClick={(e) => e.stopPropagation()}>
                            <div className="tx-detail-badges">
                              {tx.date && (
                                <span className="tx-detail-badge" title="Transaction Date">
                                  <CalendarIcon size={13} color="var(--color-brand)" />
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
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          VIEW 3: MONTHLY VIEW (12-Month Table Overview)
          ===================================================================== */}
      {activeView === 'monthly' && (
        <div className="monthly-overview-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {calYear} Monthly Financial Breakdown
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Compare monthly income, expenses, and net margin across the year.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="calendar-nav-arrow-btn"
                onClick={() => setCalYear(y => y - 1)}
                title="Previous Year"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontWeight: 800, fontSize: '1rem', padding: '0 0.5rem' }}>{calYear}</span>
              <button 
                type="button" 
                className="calendar-nav-arrow-btn"
                onClick={() => setCalYear(y => y + 1)}
                title="Next Year"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="monthly-table-wrapper">
            <table className="monthly-overview-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Income</th>
                  <th>Expenses</th>
                  <th>Net Savings</th>
                  <th>Entries</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {monthsComparison.map(m => (
                  <tr key={m.prefix}>
                    <td style={{ fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--color-brand)' }}>{m.label}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({m.fullName})</span>
                      </div>
                    </td>
                    <td style={{ color: '#38bdf8', fontWeight: 700 }}>
                      {m.income > 0 ? `+${formatCurrency(m.income, symbol)}` : '—'}
                    </td>
                    <td style={{ color: '#ff5757', fontWeight: 700 }}>
                      {m.expense > 0 ? `-${formatCurrency(m.expense, symbol)}` : '—'}
                    </td>
                    <td style={{ fontWeight: 800, color: m.net > 0 ? '#38bdf8' : m.net < 0 ? '#ff5757' : 'inherit' }}>
                      {m.net !== 0 ? `${m.net > 0 ? '+' : ''}${formatCurrency(m.net, symbol)}` : '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {m.count} txs
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          setCalMonth(m.monthIndex);
                          setActiveView('calendar');
                        }}
                      >
                        View Calendar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 4: TOTAL VIEW (Category Breakdown & Statistics)
          ===================================================================== */}
      {activeView === 'total' && (
        <div className="total-breakdown-card">
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Category Totals & Distribution
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Summary of all your transactions organized by categories.
            </p>
          </div>

          <div className="total-categories-grid">
            {categoryTotals.map(item => {
              const catMeta = allCategories.find(c => c.id === item.category) || { name: item.category, icon: '🏷️', color: '#6366f1' };
              const totalVal = item.expense + item.income;

              return (
                <div 
                  key={item.category} 
                  className="category-stat-pill"
                  style={{ cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
                  onClick={() => {
                    setSelectedCategory(item.category);
                    setActiveView('daily');
                  }}
                  title={`View all ${catMeta.name} transactions`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>{catMeta.icon}</span>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{catMeta.name}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.count} transactions</div>
                      </div>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                      {formatCurrency(totalVal, symbol)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.35rem' }}>
                    {item.income > 0 && (
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                        +{formatCurrency(item.income, symbol)} In
                      </span>
                    )}
                    {item.expense > 0 && (
                      <span style={{ color: '#ff5757', fontWeight: 700 }}>
                        -{formatCurrency(item.expense, symbol)} Out
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
