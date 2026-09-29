import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, PiggyBank, Plus, Minus, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, formatTime12Hour } from '../services/storage';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function GoalDepositModal({
  isOpen,
  goal,
  settings,
  onClose,
  onApplyDeposit,
  onViewFullHistory,
}) {
  const symbol = settings.currencySymbol || '$';
  const [actionType, setActionType] = useState('deposit'); // 'deposit' or 'withdraw'
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [note, setNote] = useState('');

  // Helper for current local HH:MM
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

  useEffect(() => {
    if (isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      setTime(getNowTime());
      setAmount('');
      setNote('');
      setIsDatePickerOpen(false);
    }
  }, [isOpen, goal]);

  useEffect(() => {
    setViewYear(currYear);
    setViewMonth(currMonth);
  }, [currYear, currMonth, isOpen]);

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

  const handleSelectMonth = (mIdx) => {
    setViewMonth(mIdx);
    const maxDays = new Date(viewYear, mIdx + 1, 0).getDate();
    const safeDay = Math.min(currDay, maxDays);
    const newDateStr = `${viewYear}-${String(mIdx + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
    setDate(newDateStr);
  };

  const handleSelectDay = (dayNum) => {
    const newDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    setDate(newDateStr);
    setIsDatePickerOpen(false);
  };

  const handleYearChange = (newYear) => {
    setViewYear(newYear);
    const maxDays = new Date(newYear, viewMonth + 1, 0).getDate();
    const safeDay = Math.min(currDay, maxDays);
    const newDateStr = `${newYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
    setDate(newDateStr);
  };

  const handleSetToday = () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setDate(todayStr);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setIsDatePickerOpen(false);
  };

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

  const yearOptions = useMemo(() => {
    const currentY = new Date().getFullYear();
    const years = [];
    for (let y = currentY - 5; y <= currentY + 5; y++) {
      years.push(y);
    }
    return years;
  }, []);

  if (!isOpen || !goal) return null;

  const current = Number(goal.currentAmount) || 0;
  const target = Number(goal.targetAmount) || 1;
  const parsedAmt = parseFloat(amount) || 0;

  const previewAmount = actionType === 'deposit' 
    ? current + parsedAmt 
    : Math.max(0, current - parsedAmt);

  const previewPercent = Math.min(100, Math.round((previewAmount / target) * 100));

  const handleQuickAdd = (preset) => {
    setAmount(String(preset));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!parsedAmt || parsedAmt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const delta = actionType === 'deposit' ? parsedAmt : -parsedAmt;
    onApplyDeposit(goal.id, delta, {
      date: date || new Date().toISOString().split('T')[0],
      time: time || getNowTime(),
      note: note.trim(),
      actionType,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', overflow: 'visible' }}>
        <div className="modal-header">
          <div className="modal-title">
            <PiggyBank size={20} color="var(--color-goal)" />
            <span>Manage Funds: {goal.title}</span>
          </div>
          <button className="btn btn-ghost btn-icon-only" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ overflow: 'visible' }}>
          {/* Action Type Segmented Control */}
          <div className="form-group">
            <div className="segmented-control">
              <button
                type="button"
                className={`segment-btn ${actionType === 'deposit' ? 'active-income' : ''}`}
                onClick={() => setActionType('deposit')}
              >
                <Plus size={16} /> Deposit Funds
              </button>
              <button
                type="button"
                className={`segment-btn ${actionType === 'withdraw' ? 'active-expense' : ''}`}
                onClick={() => setActionType('withdraw')}
              >
                <Minus size={16} /> Withdraw
              </button>
            </div>
          </div>

          {/* Current & Projected Status */}
          <div style={{
            padding: '1rem',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Current Balance
              </span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }} className="amount-val">
                {formatCurrency(current, symbol)}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Projected After Action
              </span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-goal)' }} className="amount-val">
                {formatCurrency(previewAmount, symbol)} ({previewPercent}%)
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="form-group">
            <label className="form-label">
              Amount to {actionType === 'deposit' ? 'Deposit' : 'Withdraw'} ({symbol})
            </label>
            <input
              type="number"
              step="1"
              min="1"
              required
              autoFocus
              className="form-input amount-val"
              style={{ fontSize: '1.4rem', fontWeight: 700 }}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Quick Preset Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {[25, 50, 100, 250, 500].map(preset => (
              <button
                type="button"
                key={preset}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.45rem 0', fontSize: '0.8rem' }}
                onClick={() => handleQuickAdd(preset)}
              >
                +{preset}
              </button>
            ))}
          </div>

          {/* Date & Time Row */}
          <div className="add-tx-row-2col" style={{ marginBottom: '1rem' }}>
            {/* Date Field with 1-Click 12-Month Popover */}
            <div className="add-tx-field add-tx-date-field" ref={datePickerRef}>
              <div className="add-tx-time-label-row">
                <label className="add-tx-label" htmlFor="goal-deposit-date">Date</label>
                <span className="add-tx-date-hint" title="Click month to view all 12 months in 1 click">1-Click Month</span>
              </div>

              {/* Date Trigger Button */}
              <button
                type="button"
                id="goal-deposit-date"
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

            {/* Time Field */}
            <div className="add-tx-field">
              <div className="add-tx-time-label-row">
                <label className="add-tx-label" htmlFor="goal-deposit-time">Time</label>
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
                id="goal-deposit-time"
                type="time"
                required
                className="add-tx-input add-tx-time-input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Recent Goal Transaction History */}
          {Array.isArray(goal.history) && goal.history.length > 0 && (
            <div style={{
              margin: '0.25rem 0 1rem 0',
              padding: '0.85rem',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Recent Goal Activity
                </span>
                {onViewFullHistory && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: '0.72rem', padding: '0.15rem 0.4rem', height: 'auto', color: 'var(--color-goal)', fontWeight: 600 }}
                    onClick={() => onViewFullHistory(goal)}
                  >
                    View All History ({goal.history.length}) →
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {goal.history.slice(0, 2).map((item, idx) => {
                  const isDep = item.type === 'deposit';
                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.35rem 0.5rem',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                        <span style={{ color: isDep ? 'var(--color-income)' : 'var(--color-expense)', fontWeight: 700 }}>
                          {isDep ? '↓' : '↑'}
                        </span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.note || (isDep ? 'Deposit' : 'Withdrawal')}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', flexShrink: 0 }}>
                          ({item.date}{item.time ? ` • ${formatTime12Hour(item.time)}` : ''})
                        </span>
                      </div>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: isDep ? 'var(--color-income)' : 'var(--color-expense)', flexShrink: 0, marginLeft: '0.5rem' }}>
                        {isDep ? '+' : '-'}{formatCurrency(item.amount, symbol)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="modal-footer" style={{ margin: '0 -1.5rem -1.5rem -1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className={`btn ${actionType === 'deposit' ? 'btn-income' : 'btn-expense'}`}
            >
              Confirm {actionType === 'deposit' ? 'Deposit' : 'Withdrawal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
