import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, Calculator } from 'lucide-react';
import { CATEGORIES, PAYMENT_METHODS, getCategoryInfo } from '../services/storage';
import { pushModalNavigation, popModalNavigation } from '../services/navigation';
import MobileCategoryPicker from './MobileCategoryPicker';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function TransactionModal({
  isOpen,
  initialType = 'expense',
  editingTransaction = null,
  settings,
  onClose,
  onSave,
}) {
  const [type, setType] = useState(initialType || 'expense');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [category, setCategory] = useState('food');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');

  const currencySymbol = settings?.currencySymbol || '₹';

  // Combined categories for display
  const allCategories = useMemo(() => {
    return [...(CATEGORIES.expense || []), ...(CATEGORIES.income || [])];
  }, []);

  const currentCategoryMeta = useMemo(() => {
    return allCategories.find(c => c.id === category) || getCategoryInfo(category, type);
  }, [allCategories, category, type]);

  const selectedCategoryColor = currentCategoryMeta?.color || (type === 'income' ? '#10B981' : '#EF4444');

  // Strictly Mobile View Only: screen width <= 768px (never laptop or PC)
  const [isMobileDevice, setIsMobileDevice] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileDevice(typeof window !== 'undefined' && window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);



  // Helper for current HH:MM in local time
  const getNowTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Parse current date state into year, month (0-11), and day (1-31)
  const [currYear, currMonth, currDay] = useMemo(() => {
    if (date && typeof date === 'string' && date.includes('-')) {
      const parts = date.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        return [parts[0], parts[1] - 1, parts[2]];
      }
    }
    const now = new Date();
    return [now.getFullYear(), now.getMonth(), now.getDate()];
  }, [date]);

  const [viewYear, setViewYear] = useState(currYear);
  const [viewMonth, setViewMonth] = useState(currMonth);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
  const datePickerRef = useRef(null);

  // Sync state on open or edit
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type || 'expense');
      setAmount(
        editingTransaction.amount !== undefined && editingTransaction.amount !== null
          ? String(editingTransaction.amount)
          : ''
      );
      setRecipient(editingTransaction.recipient || '');
      setCategory(editingTransaction.category || (editingTransaction.type === 'income' ? 'salary' : 'food'));
      setPaymentMethod(editingTransaction.paymentMethod || 'cash');
      setDate(editingTransaction.date || new Date().toISOString().split('T')[0]);
      setTime(editingTransaction.time || getNowTime());
      setNote(editingTransaction.note || '');
    } else {
      setType(initialType || 'expense');
      setAmount('');
      setRecipient('');
      setCategory(initialType === 'income' ? 'salary' : 'food');
      setPaymentMethod('cash');
      setDate(new Date().toISOString().split('T')[0]);
      setTime(getNowTime());
      setNote('');
    }
    setIsDatePickerOpen(false);
    setIsMobileCategoryOpen(false);
  }, [editingTransaction, initialType, isOpen]);

  // Sync picker viewed year/month with current parsed date
  useEffect(() => {
    setViewYear(currYear);
    setViewMonth(currMonth);
  }, [currYear, currMonth, isOpen]);

  const handleOpenDatePicker = () => {
    setIsDatePickerOpen(true);
    pushModalNavigation('tx_date_picker', () => setIsDatePickerOpen(false));
  };

  const handleCloseDatePicker = () => {
    popModalNavigation('tx_date_picker');
  };

  const handleToggleDatePicker = () => {
    if (isDatePickerOpen) {
      handleCloseDatePicker();
    } else {
      handleOpenDatePicker();
    }
  };

  const handleOpenMobileCategory = () => {
    // Dismiss any active mobile keyboard/autofill before opening category picker
    if (typeof document !== 'undefined' && document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    setIsMobileCategoryOpen(true);
    pushModalNavigation('tx_mobile_category', () => setIsMobileCategoryOpen(false));
  };

  const handleCloseMobileCategory = () => {
    setIsMobileCategoryOpen(false);
    popModalNavigation('tx_mobile_category');
  };

  const handleToggleMobileCategory = () => {
    if (isMobileCategoryOpen) {
      handleCloseMobileCategory();
    } else {
      handleOpenMobileCategory();
    }
  };

  const handleSelectMobileCategory = (catId) => {
    setCategory(catId);
    const isIncome = CATEGORIES.income.some(c => c.id === catId);
    const isExpense = CATEGORIES.expense.some(c => c.id === catId);

    if (isIncome && type !== 'income') {
      setType('income');
    } else if (isExpense && type !== 'expense') {
      setType('expense');
    }

    setTimeout(() => {
      handleCloseMobileCategory();
    }, 160);
  };

  // Close picker on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        handleCloseDatePicker();
      }
    }
    if (isDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDatePickerOpen]);

  // 1-Click Month selection
  const handleSelectMonth = (mIdx) => {
    setViewMonth(mIdx);
    const maxDays = new Date(viewYear, mIdx + 1, 0).getDate();
    const safeDay = Math.min(currDay, maxDays);
    const newDateStr = `${viewYear}-${String(mIdx + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
    setDate(newDateStr);
  };

  // Day selection
  const handleSelectDay = (dayNum) => {
    const newDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    setDate(newDateStr);
    handleCloseDatePicker();
  };

  // Year change
  const handleYearChange = (newYear) => {
    setViewYear(newYear);
    const maxDays = new Date(newYear, viewMonth + 1, 0).getDate();
    const safeDay = Math.min(currDay, maxDays);
    const newDateStr = `${newYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
    setDate(newDateStr);
  };

  // Quick "Today" action
  const handleSetToday = () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setDate(todayStr);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    handleCloseDatePicker();
  };

  // Compute days for the month view
  const calendarDays = useMemo(() => {
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ empty: true, id: `empty-${i}` });
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push({ empty: false, day: d, id: `day-${d}` });
    }
    return days;
  }, [viewYear, viewMonth]);

  // Formatted date string for button display
  const formattedDateDisplay = useMemo(() => {
    const monthName = MONTH_SHORT[currMonth] || 'Jan';
    const dayFormatted = String(currDay).padStart(2, '0');
    return {
      day: dayFormatted,
      month: monthName,
      year: currYear,
      full: `${dayFormatted}-${monthName}-${currYear}`
    };
  }, [currDay, currMonth, currYear]);

  // Year choices for quick dropdown
  const yearOptions = useMemo(() => {
    const currentY = new Date().getFullYear();
    const years = [];
    for (let y = currentY - 5; y <= currentY + 5; y++) {
      years.push(y);
    }
    return years;
  }, []);

  if (!isOpen) return null;

  const handleTypeChange = (newType) => {
    setType(newType);
    const isCurrentlyIncome = CATEGORIES.income.some(c => c.id === category);
    const isCurrentlyExpense = CATEGORIES.expense.some(c => c.id === category);

    if (newType === 'income' && !isCurrentlyIncome) {
      setCategory('salary');
    } else if (newType === 'expense' && !isCurrentlyExpense) {
      setCategory('food');
    }
  };

  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    setCategory(selectedCategory);

    const isIncome = CATEGORIES.income.some(c => c.id === selectedCategory);
    const isExpense = CATEGORIES.expense.some(c => c.id === selectedCategory);

    if (isIncome && type !== 'income') {
      setType('income');
    } else if (isExpense && type !== 'expense') {
      setType('expense');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanAmount = String(amount).replace(/,/g, '.');
    const numAmount = parseFloat(cleanAmount);
    if (!numAmount || numAmount <= 0) {
      alert('Please enter a valid amount greater than zero.');
      return;
    }

    onSave({
      ...(editingTransaction ? { id: editingTransaction.id } : {}),
      type,
      amount: numAmount,
      recipient: recipient ? recipient.trim() : (editingTransaction?.recipient || ''),
      category: category || (type === 'income' ? 'salary' : 'food'),
      paymentMethod: paymentMethod || 'cash',
      date: date || new Date().toISOString().split('T')[0],
      time: time || getNowTime(),
      note: note.trim(),
    });
  };


  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget && typeof onClose === 'function') {
          onClose();
        }
      }}
    >
      <div 
        className="add-tx-modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-tx-modal-title"
      >


        {/* Header */}
        <div className="add-tx-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <h2 id="add-tx-modal-title" className="add-tx-title">
              {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            {currentCategoryMeta && (
              <span 
                className="add-tx-header-cat-pill"
                style={{
                  background: `${selectedCategoryColor}18`,
                  color: selectedCategoryColor,
                  border: `1px solid ${selectedCategoryColor}40`,
                  boxShadow: `0 2px 8px ${selectedCategoryColor}20`,
                  transition: 'all 0.25s ease'
                }}
              >
                <span>{currentCategoryMeta?.icon}</span>
                <span>{currentCategoryMeta?.name}</span>
              </span>
            )}
          </div>
          <button 
            type="button" 
            className="add-tx-close-btn" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof onClose === 'function') {
                onClose();
              }
            }} 
            aria-label="Close"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} autoComplete="off" className={`add-tx-body ${isMobileCategoryOpen ? 'mobile-cat-active' : ''}`}>
          {/* Row 1: Type (Pill Toggle) and Amount */}
          <div className="add-tx-row-2col">
            <div className="add-tx-field">
              <label className="add-tx-label">Type</label>
              <div className="add-tx-type-toggle">
                <button
                  type="button"
                  className={`add-tx-type-pill ${type === 'income' ? 'active-income' : ''}`}
                  onClick={() => handleTypeChange('income')}
                >
                  Income
                </button>
                <button
                  type="button"
                  className={`add-tx-type-pill ${type === 'expense' ? 'active-expense' : ''}`}
                  onClick={() => handleTypeChange('expense')}
                >
                  Expense
                </button>
              </div>
            </div>

            <div className="add-tx-field">
              <label className="add-tx-label" htmlFor="tx-amount">Amount</label>
              <input
                id="tx-amount"
                type="number"
                step="any"
                min="0.01"
                required
                autoFocus={!isMobileDevice}
                autoComplete="off"
                name="tx_amount_field"
                data-lpignore="true"
                data-form-type="other"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                inputMode="decimal"
                className="add-tx-input add-tx-amount-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>


          {/* Row 3: Category */}
          <div className="add-tx-field">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label className="add-tx-label" htmlFor={isMobileDevice ? "tx-category-mobile" : "tx-category"} style={{ margin: 0 }}>Category</label>
              {currentCategoryMeta && (
                <span 
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 650,
                    color: selectedCategoryColor,
                    background: `${selectedCategoryColor}14`,
                    border: `1px solid ${selectedCategoryColor}35`,
                    padding: '0.12rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <span>{currentCategoryMeta?.icon}</span>
                  <span>{currentCategoryMeta?.name}</span>
                </span>
              )}
            </div>

            {/* Quick Category Color Chips for Desktop */}
            {!isMobileDevice && (
              <div className="add-tx-category-chips-grid">
                {(type === 'income' ? CATEGORIES.income : CATEGORIES.expense.filter(c => c.id !== 'groceries')).map((cat) => {
                  const isSelected = category === cat.id;
                  const catColor = cat.color || '#6366F1';
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`add-tx-cat-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => setCategory(cat.id)}
                      style={isSelected ? {
                        borderColor: catColor,
                        background: `${catColor}18`,
                        color: 'var(--text-primary)',
                        boxShadow: `0 2px 10px ${catColor}30`,
                        borderWidth: '1.5px'
                      } : {
                        borderColor: 'var(--border-subtle)',
                        background: 'var(--bg-app)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = `${catColor}70`;
                          e.currentTarget.style.background = `${catColor}0d`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                          e.currentTarget.style.background = 'var(--bg-app)';
                        }
                      }}
                      title={cat.name}
                    >
                      <span 
                        className="add-tx-cat-chip-icon"
                        style={{
                          background: `${catColor}18`,
                          border: `1px solid ${catColor}35`
                        }}
                      >
                        {cat.icon}
                      </span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {!isMobileDevice ? (
              <div 
                className="add-tx-select-wrapper"
                style={{
                  borderLeft: `4px solid ${selectedCategoryColor}`,
                  borderRadius: '8px',
                  transition: 'border-color 0.25s ease'
                }}
              >
                <select
                  id="tx-category"
                  className="add-tx-select"
                  value={category}
                  onChange={handleCategoryChange}
                  required
                >
                  {type === 'expense' ? (
                    <>
                      <optgroup label="Expense Categories">
                        {CATEGORIES.expense.filter(c => c.id !== 'groceries').map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Income Categories">
                        {CATEGORIES.income.map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                      </optgroup>
                    </>
                  ) : (
                    <>
                      <optgroup label="Income Categories">
                        {CATEGORIES.income.map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Expense Categories">
                        {CATEGORIES.expense.filter(c => c.id !== 'groceries').map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                      </optgroup>
                    </>
                  )}
                </select>
              </div>
            ) : (
              /* Mobile View Category Trigger Button with active colored underline */
              <>
                <button
                  type="button"
                  id="tx-category-mobile"
                  className={`mobile-tx-cat-trigger ${isMobileCategoryOpen ? 'active' : ''}`}
                  onClick={handleToggleMobileCategory}
                  style={{
                    borderBottom: isMobileCategoryOpen 
                      ? `2px solid ${type === 'income' ? 'var(--color-income, #10b981)' : 'var(--color-expense, #ef4444)'}`
                      : '1px solid var(--border-medium)',
                  }}
                  aria-haspopup="dialog"
                  aria-expanded={isMobileCategoryOpen}
                  title="Tap to select category"
                >
                  <div className="mobile-tx-cat-trigger-content">
                    <span className="mobile-tx-cat-trigger-icon">{currentCategoryMeta?.icon || '🏷️'}</span>
                    <span className="mobile-tx-cat-trigger-name">{currentCategoryMeta?.name || 'Select Category'}</span>
                  </div>
                  <span 
                    className="mobile-tx-cat-trigger-status"
                    style={{
                      color: isMobileCategoryOpen 
                        ? (type === 'income' ? 'var(--color-income, #10b981)' : 'var(--color-expense, #ef4444)')
                        : 'var(--text-muted)'
                    }}
                  >
                    {isMobileCategoryOpen ? '▲' : '▼'}
                  </span>
                </button>

                {/* Mobile View 3-Column Category Picker (Inline in yellow area) */}
                {isMobileCategoryOpen && (
                  <MobileCategoryPicker
                    isOpen={isMobileCategoryOpen}
                    onClose={handleCloseMobileCategory}
                    category={category}
                    onSelectCategory={handleSelectMobileCategory}
                    type={type}
                  />
                )}
              </>
            )}
          </div>

          {/* Row 4: Payment Method */}
          <div className="add-tx-field">
            <label className="add-tx-label">Payment Method</label>
            <div className="add-tx-pm-grid">
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    className={`add-tx-pm-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => setPaymentMethod(pm.id)}
                    title={`Pay via ${pm.name}`}
                  >
                    <span className="add-tx-pm-icon">{pm.icon}</span>
                    <span className="add-tx-pm-name">{pm.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 5: Date and Time */}
          <div className="add-tx-row-2col add-tx-date-time-row">
            <div className="add-tx-field add-tx-date-field" ref={datePickerRef}>
              <div className="add-tx-time-label-row">
                <label className="add-tx-label" htmlFor="tx-date">Date</label>
                <span className="add-tx-date-hint" title="Click month to view all 12 months in 1 click">1-Click Month</span>
              </div>

              {/* Date Trigger Button */}
              <button
                type="button"
                id="tx-date"
                className={`add-tx-input add-tx-date-trigger-btn ${isDatePickerOpen ? 'active' : ''}`}
                onClick={handleToggleDatePicker}
                aria-haspopup="dialog"
                aria-expanded={isDatePickerOpen}
                title="Click to view 12 months and calendar"
              >
                <div className="tx-date-segments">
                  <span className="tx-date-segment-day">{formattedDateDisplay.day}</span>
                  <span className="tx-date-sep">-</span>
                  <span className="tx-date-segment-month" title="Click to display 12 months">
                    {formattedDateDisplay.month}
                  </span>
                  <span className="tx-date-sep">-</span>
                  <span className="tx-date-segment-year">{formattedDateDisplay.year}</span>
                </div>
                <Calendar size={15} className="tx-date-cal-icon" />
              </button>

              {/* Date & 12-Month Picker Popover */}
              {isDatePickerOpen && (
                <>
                  <div 
                    className="tx-date-picker-backdrop" 
                    onClick={handleCloseDatePicker} 
                  />
                  <div 
                    className="tx-date-picker-popover" 
                    role="dialog"
                    aria-label="Choose Month and Day"
                  >
                    {/* Header: Year Navigation */}
                    <div className="tx-picker-header">
                      <button 
                        type="button" 
                        className="tx-picker-nav-btn" 
                        onClick={() => handleYearChange(viewYear - 1)}
                        title="Previous Year"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <div className="tx-picker-year-wrapper">
                        <select
                          className="tx-picker-year-select"
                          value={viewYear}
                          onChange={(e) => handleYearChange(Number(e.target.value))}
                          aria-label="Select Year"
                        >
                          {yearOptions.map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      <button 
                        type="button" 
                        className="tx-picker-nav-btn" 
                        onClick={() => handleYearChange(viewYear + 1)}
                        title="Next Year"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* Section 1: All 12 Months (1-Click Change) */}
                    <div className="tx-picker-section">
                      <div className="tx-picker-section-title">
                        <span>Month (1-Click Select)</span>
                        <span className="tx-picker-active-month-name">{MONTH_NAMES[viewMonth]}</span>
                      </div>
                      <div className="tx-month-grid">
                        {MONTH_SHORT.map((mShort, idx) => {
                          const isSelected = viewMonth === idx;
                          return (
                            <button
                              key={mShort}
                              type="button"
                              className={`tx-month-pill ${isSelected ? 'active' : ''}`}
                              onClick={() => handleSelectMonth(idx)}
                              title={`Change to ${MONTH_NAMES[idx]}`}
                            >
                              {mShort}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section 2: Days in Selected Month */}
                    <div className="tx-picker-section">
                      <div className="tx-days-grid">
                        <div className="tx-weekday-labels">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(wd => (
                            <span key={wd} className="tx-weekday-label">{wd}</span>
                          ))}
                        </div>
                        <div className="tx-days-cells">
                          {calendarDays.map((item) => {
                            if (item.empty) {
                              return <span key={item.id} className="tx-day-cell empty" />;
                            }
                            const isSelected = currDay === item.day && currMonth === viewMonth && currYear === viewYear;
                            const isToday = new Date().getDate() === item.day && new Date().getMonth() === viewMonth && new Date().getFullYear() === viewYear;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                className={`tx-day-btn ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                                onClick={() => handleSelectDay(item.day)}
                              >
                                {item.day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="tx-picker-footer">
                      <button 
                        type="button" 
                        className="tx-picker-today-btn"
                        onClick={handleSetToday}
                      >
                        Today
                      </button>
                      <button 
                        type="button" 
                        className="tx-picker-done-btn"
                        onClick={() => setIsDatePickerOpen(false)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="add-tx-field">
              <div className="add-tx-time-label-row">
                <label className="add-tx-label" htmlFor="tx-time">Time</label>
                <button
                  type="button"
                  className="add-tx-now-btn"
                  onClick={() => setTime(getNowTime())}
                  title="Reset to current local time"
                >
                  Now
                </button>
              </div>
              <input
                id="tx-time"
                type="time"
                required
                className="add-tx-input add-tx-time-input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Row 6: Notes */}
          <div className="add-tx-field">
            <label className="add-tx-label" htmlFor="tx-notes">Notes</label>
            <input
              id="tx-notes"
              type="text"
              className="add-tx-input"
              placeholder="Optional notes"
              autoComplete="off"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Footer Actions */}
          <div className="add-tx-footer">
            <button 
              type="button" 
              className="add-tx-cancel-btn" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof onClose === 'function') {
                  onClose();
                }
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="add-tx-save-btn"
            >
              Save Transaction
            </button>
          </div>
        </form>


      </div>
    </div>
  );
}
