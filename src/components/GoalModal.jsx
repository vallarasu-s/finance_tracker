import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, DollarSign } from 'lucide-react';
import { GOAL_ICONS } from '../services/storage';

export default function GoalModal({
  isOpen,
  editingGoal = null,
  settings,
  onClose,
  onSave,
}) {
  const symbol = settings.currencySymbol || '$';

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [notes, setNotes] = useState('');

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
      setCurrentAmount('0');
      const nextYear = new Date();
      nextYear.setMonth(nextYear.getMonth() + 6);
      setTargetDate(nextYear.toISOString().split('T')[0]);
      setIcon('🎯');
      setNotes('');
    }
  }, [editingGoal, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    if (!target || target <= 0) {
      alert('Please enter a target amount greater than zero.');
      return;
    }

    onSave({
      ...(editingGoal ? { id: editingGoal.id } : {}),
      title: title.trim() || 'New Goal',
      targetAmount: target,
      currentAmount: Math.max(0, parseFloat(currentAmount) || 0),
      targetDate,
      icon,
      notes: notes.trim(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Target size={20} color="var(--color-goal)" />
            <span>{editingGoal ? 'Edit Financial Goal' : 'Create Financial Goal'}</span>
          </div>
          <button className="btn btn-ghost btn-icon-only" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Goal Title */}
          <div className="form-group">
            <label className="form-label">Goal Title / Purpose</label>
            <input
              type="text"
              required
              autoFocus
              className="form-input"
              placeholder="e.g. Emergency Rainy Day Fund, M3 Pro Laptop..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Icon Selector */}
          <div className="form-group">
            <label className="form-label">Choose Theme Icon</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {GOAL_ICONS.map(item => (
                <button
                  type="button"
                  key={item.id}
                  className={`category-option ${icon === item.icon ? 'selected' : ''}`}
                  onClick={() => setIcon(item.icon)}
                >
                  <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
                  <span style={{ fontSize: '0.7rem' }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Amount */}
          <div className="form-group">
            <label className="form-label">Target Amount ({symbol})</label>
            <input
              type="number"
              step="1"
              min="1"
              required
              className="form-input amount-val"
              placeholder="e.g. 5000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
            />
          </div>

          {/* Current Saved Amount (Only for new goal or adjustment) */}
          <div className="form-group">
            <label className="form-label">Initial Amount Already Saved ({symbol})</label>
            <input
              type="number"
              step="1"
              min="0"
              className="form-input amount-val"
              placeholder="0"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
            />
          </div>

          {/* Target Completion Date */}
          <div className="form-group">
            <label className="form-label">Target Completion Date</label>
            <input
              type="date"
              required
              className="form-input"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes or Strategy (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Why this goal matters, action plan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-footer" style={{ margin: '0 -1.5rem -1.5rem -1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingGoal ? 'Update Goal' : 'Save Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
