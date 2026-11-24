import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Target } from 'lucide-react';
import { GOAL_ICONS, parseShortAmount, formatCurrency, MAX_TRANSACTION_AMOUNT } from '../services/storage';
import { isMobileOrTouch } from '../services/navigation';

export default function GoalModal({
  isOpen,
  editingGoal = null,
  settings = {},
  onClose,
  onSave,
}) {
  const symbol = settings?.currencySymbol || '$';

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [notes, setNotes] = useState('');
  const isTouchDevice = isMobileOrTouch();
  const titleInputRef = useRef(null);

  // Automatically place the typing cursor inside the typing area when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
          const len = titleInputRef.current.value ? titleInputRef.current.value.length : 0;
          try {
            titleInputRef.current.setSelectionRange(len, len);
          } catch {
            // ignore for non-text types if any
          }
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title || '');
      setTargetAmount(editingGoal.targetAmount ? String(editingGoal.targetAmount) : '');
      setCurrentAmount(editingGoal.currentAmount ? String(editingGoal.currentAmount) : '0');
      setTargetDate(editingGoal.targetDate || '');
      setIcon(editingGoal.icon || '🎯');
      setNotes(editingGoal.notes || '');
    } else {
      setTitle('');
      setTargetAmount('');
      setCurrentAmount('');
      const nextYear = new Date();
      nextYear.setMonth(nextYear.getMonth() + 6);
      setTargetDate(nextYear.toISOString().split('T')[0]);
      setIcon('🎯');
      setNotes('');
    }
  }, [editingGoal, isOpen]);

  const handleSelectIcon = (item) => {
    setIcon(item.icon);
    // If title is blank or currently matches another preset's title, update title automatically
    if (!title.trim() || GOAL_ICONS.some(g => g.label.toLowerCase() === title.trim().toLowerCase())) {
      setTitle(item.label);
    }
  };

  const parsedTarget = useMemo(() => parseShortAmount(targetAmount), [targetAmount]);
  const parsedCurrent = useMemo(() => parseShortAmount(currentAmount), [currentAmount]);
  const croreSymbol = settings?.croreSymbol || 'c';

  const applyTargetUnit = (unit) => {
    const raw = String(targetAmount || '').trim().replace(/[$₹€£¥,]/g, '');
    if (!raw) {
      setTargetAmount(`1${unit}`);
      return;
    }
    const match = raw.match(/^([0-9.]+)\s*([a-z]+)?$/i);
    if (match) {
      setTargetAmount(`${match[1]}${unit}`);
    } else {
      setTargetAmount(`${raw}${unit}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const targetParsed = parseShortAmount(targetAmount);
    if (!targetParsed.isValid || targetParsed.value <= 0) {
      alert('Please enter a target amount greater than zero (e.g. 5000, 50k, 10L, 1c).');
      return;
    }
    if (targetParsed.value > MAX_TRANSACTION_AMOUNT) {
      alert('Target amount exceeds maximum allowed limit.');
      return;
    }

    const currentParsed = parseShortAmount(currentAmount);
    const validCurrent = currentParsed.isValid ? Math.max(0, currentParsed.value) : 0;

    onSave({
      ...(editingGoal ? { id: editingGoal.id } : {}),
      title: title.trim() || 'New Goal',
      targetAmount: targetParsed.value,
      currentAmount: validCurrent,
      targetDate,
      icon,
      notes: notes.trim(),
    });
  };

  const selectedPreset = GOAL_ICONS.find(item => item.icon === icon) || { icon: '🎯', label: 'Custom' };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay goal-modal-overlay" onClick={onClose}>
      <div className="modal-dialog goal-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header goal-modal-header">
          <div className="modal-title goal-modal-title">
            <span className="goal-modal-title-text">{editingGoal ? 'Edit Financial Goal' : 'Create Financial Goal'}</span>
            <span className="goal-header-cat-pill">
              <span className="goal-header-cat-emoji">{selectedPreset.icon}</span>
              <span className="goal-header-cat-name">{selectedPreset.label}</span>
            </span>
          </div>
          <button 
            type="button" 
            className="btn-close-modal goal-modal-close" 
            onClick={onClose} 
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="goal-modal-form">
          <div className="modal-body goal-modal-body">
            {/* 1. Goal Title / Purpose - Comes FIRST as requested */}
            <div className="form-group goal-form-group">
              <label className="form-label goal-form-label" htmlFor="goal-title-input">Goal Title / Purpose</label>
              <input
                id="goal-title-input"
                ref={titleInputRef}
                type="text"
                required
                autoFocus
                className="form-input goal-form-input"
                placeholder="e.g. Emergency Rainy Day Fund, M3 Pro Laptop..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* 2. Category / Icon Selector - Comes SECOND */}
            <div className="form-group goal-form-group">
              <div className="goal-form-label-row">
                <label className="form-label goal-form-label">Category</label>
                <span className="goal-selected-pill-preview">
                  <span className="goal-preview-emoji">{selectedPreset.icon}</span>
                  <span className="goal-preview-label">{selectedPreset.label}</span>
                </span>
              </div>
              <div className="goal-icon-grid" role="radiogroup" aria-label="Goal Theme Categories">
                {GOAL_ICONS.map(item => (
                  <button
                    type="button"
                    key={item.id}
                    className={`category-option goal-icon-item ${icon === item.icon ? 'selected' : ''}`}
                    onClick={() => handleSelectIcon(item)}
                    title={item.label}
                  >
                    <span className="goal-icon-emoji">{item.icon}</span>
                    <span className="goal-icon-label">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Amount & Initial Amount in 2-column row */}
            <div className="goal-form-row-2col">
              <div className="form-group goal-form-group">
                <label className="form-label goal-form-label" style={{ marginBottom: '0.25rem' }}>Target Amount ({symbol})</label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  className="form-input amount-val goal-form-input"
                  placeholder="0.00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
                {parsedTarget.isValid && parsedTarget.unit && (
                  <div className="goal-shortform-preview">
                    ✨ {formatCurrency(parsedTarget.value, symbol, { compact: false, settings })} ({parsedTarget.baseNum} {parsedTarget.unitLabel})
                  </div>
                )}
              </div>

              <div className="form-group goal-form-group">
                <label className="form-label goal-form-label">Initial Saved ({symbol})</label>
                <input
                  type="text"
                  maxLength={16}
                  className="form-input amount-val goal-form-input"
                  placeholder="0.00"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                />
                {parsedCurrent.isValid && parsedCurrent.unit && (
                  <div className="goal-shortform-preview">
                    ✨ {formatCurrency(parsedCurrent.value, symbol, { compact: false, settings })} ({parsedCurrent.baseNum} {parsedCurrent.unitLabel})
                  </div>
                )}
              </div>
            </div>

            {/* Target Completion Date */}
            <div className="form-group goal-form-group">
              <label className="form-label goal-form-label">Target Completion Date</label>
              <input
                type="date"
                required
                className="form-input goal-date-input goal-form-input"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="form-group goal-form-group">
              <label className="form-label goal-form-label">Notes or Strategy (Optional)</label>
              <input
                type="text"
                className="form-input goal-form-input"
                placeholder="Why this goal matters, action plan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer goal-modal-footer">
            <button type="button" className="btn btn-secondary goal-modal-btn goal-modal-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary goal-modal-btn goal-modal-submit-btn">
              {editingGoal ? 'Update Goal' : 'Save Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

