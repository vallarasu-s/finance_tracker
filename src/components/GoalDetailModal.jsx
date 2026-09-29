import React, { useState, useMemo } from 'react';
import {
  X,
  Target,
  Calendar,
  Clock,
  Plus,
  Minus,
  ArrowDownLeft,
  ArrowUpRight,
  Edit2,
  Trash2,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  PiggyBank,
  Sparkles,
  Receipt,
  FileText
} from 'lucide-react';
import { formatCurrency, formatTime12Hour, exportGoalHistoryAsCSV } from '../services/storage';

export default function GoalDetailModal({
  isOpen,
  goal,
  settings = {},
  onClose,
  onEditGoal,
  onDeleteGoal,
  onApplyDeposit,
  onDeleteGoalTransaction,
  showToast,
}) {
  const symbol = settings.currencySymbol || '$';

  // Quick Action form state (inline within modal)
  const [isActionFormOpen, setIsActionFormOpen] = useState(false);
  const [actionType, setActionType] = useState('deposit'); // 'deposit' or 'withdraw'
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [formNote, setFormNote] = useState('');

  // History filtering & search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'deposit', 'withdraw'

  // Raw history unconditionally derived
  const rawHistory = Array.isArray(goal?.history) ? goal.history : [];

  // Filtered history hook must be unconditional
  const filteredHistory = useMemo(() => {
    return rawHistory.filter(item => {
      // Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const noteMatch = (item.note || '').toLowerCase().includes(q);
        const dateMatch = (item.date || '').toLowerCase().includes(q);
        const amtMatch = String(item.amount).includes(q);
        return noteMatch || dateMatch || amtMatch;
      }
      return true;
    });
  }, [rawHistory, typeFilter, searchQuery]);

  if (!isOpen || !goal) return null;

  const current = Number(goal.currentAmount) || 0;
  const target = Number(goal.targetAmount) || 1;
  const remaining = Math.max(0, target - current);
  const percent = Math.min(100, Math.round((current / target) * 100));
  const isCompleted = current >= target;

  // Projections
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
  let daysLeft = null;
  let dailyNeeded = null;
  let isOverdue = false;

  if (targetDate && !isNaN(targetDate.getTime())) {
    const diffMs = targetDate.getTime() - today.getTime();
    daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    isOverdue = daysLeft < 0 && remaining > 0;
    if (daysLeft > 0 && remaining > 0) {
      dailyNeeded = remaining / daysLeft;
    }
  }

  // Breakdown calculations
  const totalDeposits = rawHistory
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalWithdrawals = rawHistory
    .filter(t => t.type === 'withdraw')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const depositCount = rawHistory.filter(t => t.type === 'deposit').length;
  const withdrawalCount = rawHistory.filter(t => t.type === 'withdraw').length;

  const handleOpenActionForm = (type) => {
    setActionType(type);
    setFormAmount('');
    setFormNote('');
    setFormDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    setFormTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    setIsActionFormOpen(true);
  };

  const handleApplyInlineAction = (e) => {
    e.preventDefault();
    const parsed = parseFloat(formAmount);
    if (!parsed || parsed <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const delta = actionType === 'deposit' ? parsed : -parsed;
    onApplyDeposit(goal.id, delta, {
      date: formDate || new Date().toISOString().split('T')[0],
      time: formTime || '12:00',
      note: formNote.trim() || (actionType === 'deposit' ? 'Deposit' : 'Withdrawal'),
      actionType,
    });

    setIsActionFormOpen(false);
    setFormAmount('');
    setFormNote('');
  };

  const handleQuickAddPreset = (val) => {
    setFormAmount(String(val));
  };

  const handleDeleteTransaction = (txId, tx) => {
    const isDeposit = tx.type === 'deposit';
    const msg = isDeposit
      ? `Delete this ${formatCurrency(tx.amount, symbol)} deposit? Your goal balance will decrease by ${formatCurrency(tx.amount, symbol)}.`
      : `Delete this ${formatCurrency(tx.amount, symbol)} withdrawal? Your goal balance will increase by ${formatCurrency(tx.amount, symbol)}.`;

    if (window.confirm(msg)) {
      onDeleteGoalTransaction(goal.id, txId);
    }
  };

  const handleExportCSV = () => {
    const ok = exportGoalHistoryAsCSV(goal, symbol);
    if (ok && showToast) {
      showToast('Transaction history downloaded as CSV.', 'success');
    }
  };

  const parsedActionAmt = parseFloat(formAmount) || 0;
  const projectedBalance = actionType === 'deposit'
    ? current + parsedActionAmt
    : Math.max(0, current - parsedActionAmt);
  const projectedPercent = Math.min(100, Math.round((projectedBalance / target) * 100));

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
      <div 
        className="modal-dialog goal-detail-modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        {/* Modal Top Header */}
        <div 
          className="modal-header"
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div 
              style={{ 
                width: '46px', 
                height: '46px', 
                borderRadius: '12px', 
                background: 'var(--color-goal-bg)',
                color: 'var(--color-goal)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '1.5rem',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.15)'
              }}
            >
              <span>{goal.icon || '🎯'}</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {goal.title}
                </h3>
                {isCompleted ? (
                  <span className="badge badge-income" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCircle2 size={13} /> Target Achieved!
                  </span>
                ) : isOverdue ? (
                  <span className="badge badge-expense" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertCircle size={13} /> Overdue
                  </span>
                ) : (
                  <span className="badge badge-goal" style={{ fontSize: '0.72rem' }}>
                    {percent}% Saved
                  </span>
                )}
              </div>
              {goal.notes && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  {goal.notes}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {rawHistory.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-icon-only"
                title="Export Transaction History (CSV)"
                onClick={handleExportCSV}
                style={{ color: 'var(--color-goal)' }}
              >
                <Download size={16} />
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-icon-only"
              title="Edit Goal Information"
              onClick={() => {
                onClose();
                onEditGoal(goal);
              }}
            >
              <Edit2 size={16} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-icon-only"
              style={{ color: 'var(--color-expense)' }}
              title="Delete Goal"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete the goal "${goal.title}"? All savings history for this goal will be removed.`)) {
                  onClose();
                  onDeleteGoal(goal.id);
                }
              }}
            >
              <Trash2 size={16} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-icon-only"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div 
          className="modal-body"
          style={{
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          {/* Main Financial Metrics Card */}
          <div 
            style={{
              padding: '1.25rem',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            {/* Top row: Amounts & Percentage */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Current Savings
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1.1, marginTop: '0.2rem' }}>
                  {formatCurrency(current, symbol)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Target: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(target, symbol)}</strong>
                  {!isCompleted && (
                    <span style={{ marginLeft: '0.75rem', color: 'var(--text-muted)' }}>
                      • Remaining: <strong className="amount-val" style={{ color: 'var(--color-goal)' }}>{formatCurrency(remaining, symbol)}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Progress
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: isCompleted ? 'var(--color-income)' : 'var(--color-goal)', fontFamily: 'var(--font-mono)', lineHeight: 1.1, marginTop: '0.2rem' }}>
                  {percent}%
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {isCompleted ? 'Target Achieved 🏆' : `${percent}% towards target`}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
              <div 
                style={{
                  height: '100%',
                  width: `${percent}%`,
                  background: isCompleted 
                    ? 'linear-gradient(90deg, #10B981, #059669)' 
                    : 'linear-gradient(90deg, #06B6D4, #3B82F6)',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease-out'
                }}
              />
            </div>

            {/* Sub-metrics: Timeline & Activity Stats */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem' }}>
                  <Calendar size={12} /> Target Date
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.15rem', display: 'block' }}>
                  {goal.targetDate || 'No Deadline'}
                </span>
              </div>

              {!isCompleted && daysLeft !== null && (
                <div style={{ fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem' }}>
                    <Clock size={12} /> Pace Required
                  </span>
                  <span style={{ fontWeight: 700, color: isOverdue ? 'var(--color-expense)' : 'var(--color-brand)', marginTop: '0.15rem', display: 'block' }}>
                    {isOverdue ? 'Date passed' : `${formatCurrency(dailyNeeded, symbol)} / day`}
                  </span>
                </div>
              )}

              {!isCompleted && daysLeft !== null && daysLeft > 0 && (
                <div style={{ fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    Countdown
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--color-goal)', marginTop: '0.15rem', display: 'block' }}>
                    {daysLeft} days remaining
                  </span>
                </div>
              )}

              <div style={{ fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  Total Deposits
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-income)', marginTop: '0.15rem', display: 'block' }}>
                  {formatCurrency(totalDeposits, symbol)} ({depositCount})
                </span>
              </div>

              {withdrawalCount > 0 && (
                <div style={{ fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    Total Withdrawals
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--color-expense)', marginTop: '0.15rem', display: 'block' }}>
                    {formatCurrency(totalWithdrawals, symbol)} ({withdrawalCount})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Bar (Deposit / Withdraw buttons) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  borderColor: 'transparent',
                  padding: '0.55rem 1.1rem',
                  fontSize: '0.88rem'
                }}
                onClick={() => handleOpenActionForm('deposit')}
              >
                <Plus size={16} />
                <span>Deposit Funds</span>
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  color: 'var(--color-expense)',
                  borderColor: 'var(--border-subtle)',
                  padding: '0.55rem 1rem',
                  fontSize: '0.88rem'
                }}
                onClick={() => handleOpenActionForm('withdraw')}
              >
                <Minus size={16} />
                <span>Withdraw Funds</span>
              </button>
            </div>

            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {rawHistory.length} Total {rawHistory.length === 1 ? 'Transaction' : 'Transactions'}
            </span>
          </div>

          {/* Inline Action Form (when open) */}
          {isActionFormOpen && (
            <form 
              onSubmit={handleApplyInlineAction}
              style={{
                padding: '1.25rem',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                animation: 'fadeIn 0.2s ease-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <PiggyBank size={18} color={actionType === 'deposit' ? 'var(--color-income)' : 'var(--color-expense)'} />
                  {actionType === 'deposit' ? 'Record New Deposit' : 'Record Withdrawal'}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon-only"
                  style={{ width: '28px', height: '28px', padding: 0 }}
                  onClick={() => setIsActionFormOpen(false)}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Segmented type switcher */}
              <div className="segmented-control" style={{ maxWidth: '300px' }}>
                <button
                  type="button"
                  className={`segment-btn ${actionType === 'deposit' ? 'active-income' : ''}`}
                  onClick={() => setActionType('deposit')}
                >
                  <Plus size={14} /> Deposit
                </button>
                <button
                  type="button"
                  className={`segment-btn ${actionType === 'withdraw' ? 'active-expense' : ''}`}
                  onClick={() => setActionType('withdraw')}
                >
                  <Minus size={14} /> Withdraw
                </button>
              </div>

              {/* Amount input */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Amount ({symbol})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  autoFocus
                  className="form-input amount-val"
                  placeholder="0.00"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  style={{ fontSize: '1.25rem', fontWeight: 700 }}
                />
              </div>

              {/* Quick preset chips */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[500, 1000, 2000, 5000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', height: 'auto', borderRadius: 'var(--radius-sm)' }}
                    onClick={() => handleQuickAddPreset(amt)}
                  >
                    +{formatCurrency(amt, symbol)}
                  </button>
                ))}
                {remaining > 0 && actionType === 'deposit' && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', height: 'auto', borderRadius: 'var(--radius-sm)', color: 'var(--color-goal)' }}
                    onClick={() => handleQuickAddPreset(remaining)}
                  >
                    Remaining ({formatCurrency(remaining, symbol)})
                  </button>
                )}
              </div>

              {/* Date & Note in a grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Note / Memo (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Salary bonus, side project, etc."
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                  />
                </div>
              </div>

              {/* Projected feedback */}
              {parsedActionAmt > 0 && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Resulting Balance:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(projectedBalance, symbol)} ({projectedPercent}%)
                  </strong>
                </div>
              )}

              {/* Submit / Cancel */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsActionFormOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    background: actionType === 'deposit' 
                      ? 'linear-gradient(135deg, #10B981, #059669)'
                      : 'linear-gradient(135deg, #EF4444, #DC2626)'
                  }}
                >
                  {actionType === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          )}

          {/* Transaction History Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt size={18} color="var(--color-goal)" />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Transaction History
                </h4>
                <span className="badge badge-goal" style={{ fontSize: '0.72rem' }}>
                  {filteredHistory.length} {filteredHistory.length === 1 ? 'record' : 'records'}
                </span>
              </div>

              {/* Type Filter Pills */}
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button
                  type="button"
                  className={`btn btn-ghost ${typeFilter === 'all' ? 'btn-primary' : ''}`}
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', height: 'auto', borderRadius: 'var(--radius-sm)' }}
                  onClick={() => setTypeFilter('all')}
                >
                  All ({rawHistory.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-ghost ${typeFilter === 'deposit' ? 'btn-primary' : ''}`}
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', height: 'auto', borderRadius: 'var(--radius-sm)' }}
                  onClick={() => setTypeFilter('deposit')}
                >
                  Deposits ({depositCount})
                </button>
                {withdrawalCount > 0 && (
                  <button
                    type="button"
                    className={`btn btn-ghost ${typeFilter === 'withdraw' ? 'btn-primary' : ''}`}
                    style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', height: 'auto', borderRadius: 'var(--radius-sm)' }}
                    onClick={() => setTypeFilter('withdraw')}
                  >
                    Withdrawals ({withdrawalCount})
                  </button>
                )}
              </div>
            </div>

            {/* Search Filter if more than 3 items */}
            {rawHistory.length > 2 && (
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by note, memo, or date..."
                  className="form-input"
                  style={{ paddingLeft: '2.2rem', fontSize: '0.82rem', height: '36px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            {/* Transactions List */}
            {filteredHistory.length === 0 ? (
              <div 
                style={{
                  textAlign: 'center',
                  padding: '2.5rem 1rem',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px dashed var(--border-subtle)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <PiggyBank size={36} style={{ color: 'var(--color-goal)', opacity: 0.5 }} />
                <div>
                  <h5 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                    {searchQuery ? 'No matching transactions found' : 'No transactions recorded yet'}
                  </h5>
                  <p style={{ fontSize: '0.8rem', maxWidth: '340px', margin: 0 }}>
                    {searchQuery 
                      ? 'Try clearing your search query to see all goal activity.'
                      : `Make your first deposit into ${goal.title} to start building your savings record!`
                    }
                  </p>
                </div>
                {!searchQuery && !isActionFormOpen && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                    onClick={() => handleOpenActionForm('deposit')}
                  >
                    <Plus size={14} /> Record First Deposit
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredHistory.map((item, idx) => {
                  const isDeposit = item.type === 'deposit';
                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        transition: 'background 0.15s ease',
                        gap: '0.75rem'
                      }}
                      className="goal-history-item"
                    >
                      {/* Left: Icon & Description */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                            background: isDeposit ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: isDeposit ? 'var(--color-income)' : 'var(--color-expense)',
                            border: `1px solid ${isDeposit ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
                          }}
                        >
                          {isDeposit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.note || (isDeposit ? 'Deposit' : 'Withdrawal')}
                            </span>
                            <span 
                              style={{
                                fontSize: '0.68rem',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                background: isDeposit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: isDeposit ? 'var(--color-income)' : 'var(--color-expense)'
                              }}
                            >
                              {item.type}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            <span>{item.date || 'Recent'}</span>
                            {item.time && <span>• {formatTime12Hour(item.time)}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <span 
                            style={{
                              fontSize: '1rem',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              color: isDeposit ? 'var(--color-income)' : 'var(--color-expense)'
                            }}
                          >
                            {isDeposit ? '+' : '-'}{formatCurrency(item.amount, symbol)}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="btn btn-ghost btn-icon-only"
                          style={{
                            width: '28px',
                            height: '28px',
                            padding: 0,
                            color: 'var(--text-muted)',
                            opacity: 0.6,
                            transition: 'opacity 0.15s ease, color 0.15s ease'
                          }}
                          title="Delete this transaction"
                          onClick={() => handleDeleteTransaction(item.id, item)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.color = 'var(--color-expense)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '0.6';
                            e.currentTarget.style.color = 'var(--text-muted)';
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div 
          className="modal-footer"
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Goal ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{goal.id}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
