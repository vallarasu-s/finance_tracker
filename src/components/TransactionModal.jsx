import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../services/storage';

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
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');

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
      setDate(editingTransaction.date || new Date().toISOString().split('T')[0]);
      setTime(editingTransaction.time || getNowTime());
      setNote(editingTransaction.note || '');
    } else {
      setType(initialType || 'expense');
      setAmount('');
      setRecipient('');
      setCategory(initialType === 'income' ? 'salary' : 'food');
      setDate(new Date().toISOString().split('T')[0]);
      setTime(getNowTime());
      setNote('');
    }
    setIsDatePickerOpen(false);
  }, [editingTransaction, initialType, isOpen]);

  // Sync picker viewed year/month with current parsed date
  useEffect(() => {
    setViewYear(currYear);
    setViewMonth(currMonth);
  }, [currYear, currMonth, isOpen]);

  // Close picker on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsDatePickerOpen(false);
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
    setIsDatePickerOpen(false);
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
    setIsDatePickerOpen(false);
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
    // When switching types, if current category belongs to the other type, switch to sensible default category
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

    // Automatically synchronize Type (Income or Expense) based on category chosen
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
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Please enter a valid amount greater than zero.');
      return;
    }

    onSave({
      ...(editingTransaction ? { id: editingTransaction.id } : {}),
      type,
      amount: numAmount,
      recipient: recipient.trim(),
      category: category || (type === 'income' ? 'salary' : 'food'),
      date: date || new Date().toISOString().split('T')[0],
      time: time || getNowTime(),
      note: note.trim(),
      paymentMethod: editingTransaction?.paymentMethod || 'bank',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="add-tx-modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-tx-modal-title"
      >
        {/* Header */}
        <div className="add-tx-header">
          <h2 id="add-tx-modal-title" className="add-tx-title">
            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button 
            type="button" 
            className="add-tx-close-btn" 
            onClick={onClose} 
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="add-tx-body">
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
                autoFocus
                className="add-tx-input add-tx-amount-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Recipient / Source */}
          <div className="add-tx-field">
            <label className="add-tx-label" htmlFor="tx-recipient">Recipient / Source</label>
            <input
              id="tx-recipient"
              type="text"
              className="add-tx-input"
              placeholder="e.g. Employer"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          {/* Row 3: Category */}
          <div className="add-tx-field">
            <label className="add-tx-label" htmlFor="tx-category">Category</label>
            <div className="add-tx-select-wrapper">
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
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Income Categories">
                      {CATEGORIES.income.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  </>
                ) : (
                  <>
                    <optgroup label="Income Categories">
                      {CATEGORIES.income.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Expense Categories">
                      {CATEGORIES.expense.filter(c => c.id !== 'groceries').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Row 4: Date and Time */}
          <div className="add-tx-row-2col">
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
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
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
                    onClick={() => setIsDatePickerOpen(false)} 
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

          {/* Row 4: Notes */}
          <div className="add-tx-field">
            <label className="add-tx-label" htmlFor="tx-notes">Notes</label>
            <input
              id="tx-notes"
              type="text"
              className="add-tx-input"
              placeholder="Optional notes"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Footer Actions */}
          <div className="add-tx-footer">
            <button 
              type="button" 
              className="add-tx-cancel-btn" 
              onClick={onClose}
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
