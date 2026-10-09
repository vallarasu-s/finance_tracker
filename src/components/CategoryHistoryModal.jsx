import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Receipt,
  ArrowUpDown,
  Filter,
  DollarSign,
  TrendingDown,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { formatCurrency, formatTime12Hour, getPaymentMethodInfo } from '../services/storage';

const formatNiceDate = (dStr) => {
  if (!dStr) return 'No Date';
  try {
    const [year, month, day] = dStr.split('-');
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dStr;
  }
};

export default function CategoryHistoryModal({
  isOpen,
  category,
  allTransactions = [],
  settings = {},
  onClose,
  onOpenTransactionModal,
  onDeleteTransaction,
  onDuplicateTransaction,
  onNavigateTab
}) {
  const symbol = settings?.currencySymbol || '₹';
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'month'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'highest', 'lowest'

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset internal filter states when a new category is opened
  useEffect(() => {
    if (isOpen) {
      setTimeFilter('all');
      setSortOrder('newest');
    }
  }, [isOpen, category?.id]);

  // All transactions matching this category
  const categoryTransactions = useMemo(() => {
    if (!category || !Array.isArray(allTransactions)) return [];
    const targetId = (category.id || '').toLowerCase().trim();
    const targetName = (category.name || '').toLowerCase().trim();

    return allTransactions.filter(t => {
      const cat = (t.category || '').toLowerCase().trim();
      return cat === targetId || cat === targetName;
    });
  }, [allTransactions, category]);

  // High-level statistics for this category (all-time)
  const stats = useMemo(() => {
    const total = categoryTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const count = categoryTransactions.length;
    const max = count > 0 ? Math.max(...categoryTransactions.map(t => Number(t.amount) || 0)) : 0;
    return { total, count, max };
  }, [categoryTransactions]);

  // Filtered & sorted transactions
  const displayedTransactions = useMemo(() => {
    let list = [...categoryTransactions];

    // Filter by date
    if (timeFilter === 'month') {
      const now = new Date();
      const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      list = list.filter(t => (t.date || '').startsWith(prefix));
    }

    // Sort
    list.sort((a, b) => {
      if (sortOrder === 'highest') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      if (sortOrder === 'lowest') return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      if (sortOrder === 'oldest') {
        const da = `${a.date || ''} ${a.time || ''}`;
        const db = `${b.date || ''} ${b.time || ''}`;
        return da.localeCompare(db);
      }
      // default: newest
      const da = `${a.date || ''} ${a.time || ''}`;
      const db = `${b.date || ''} ${b.time || ''}`;
      return db.localeCompare(da);
    });

    return list;
  }, [categoryTransactions, timeFilter, sortOrder]);

  if (!isOpen || !category) return null;

  const catColor = category.color || 'var(--color-brand)';

  return (
    <div 
      className="modal-overlay category-history-modal-overlay" 
      onClick={onClose}
    >
      <div 
        className="modal-dialog category-history-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle (App-like Bottom Sheet Feel) */}
        <div className="cat-history-drag-handle" aria-hidden="true" />

        {/* Top Header */}
        <div className="modal-header cat-history-header">
          <div className="cat-history-header-left">
            <div 
              className="cat-history-icon-badge"
              style={{
                background: `${catColor}20`,
                borderColor: `${catColor}40`,
                boxShadow: `0 4px 14px ${catColor}25`
              }}
            >
              <span>{category.icon || '🏷️'}</span>
            </div>
            <div className="cat-history-header-text">
              <div className="cat-history-title-row">
                <h3 className="cat-history-title">
                  {category.name} History
                </h3>
                <span className="badge badge-neutral cat-history-entries-badge">
                  {stats.count} {stats.count === 1 ? 'entry' : 'entries'}
                </span>
              </div>
              <p className="cat-history-subtitle">
                Complete breakdown of all expenses recorded under {category.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-close-modal"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="cat-history-body">
          {/* Key Metric Highlights Grid (Total Spent, Total Entries, Highest Entry) */}
          <div className="cat-history-metrics-grid">
            <div className="cat-history-metric-card">
              <span className="cat-history-metric-label">Total Spent</span>
              <span className="cat-history-metric-val amount-val expense">
                {formatCurrency(stats.total, symbol)}
              </span>
            </div>

            <div className="cat-history-metric-card">
              <span className="cat-history-metric-label">Total Entries</span>
              <span className="cat-history-metric-val">
                {stats.count}
              </span>
            </div>

            <div className="cat-history-metric-card">
              <span className="cat-history-metric-label">Highest Entry</span>
              <span className="cat-history-metric-val amount-val expense">
                {formatCurrency(stats.max, symbol)}
              </span>
            </div>
          </div>

          {/* Controls: Time Filter Pills & Sort Selector */}
          <div className="cat-history-controls-box">
            <div className="cat-history-pills-row">
              <div className="cat-history-pills-list">
                <button
                  type="button"
                  className={`btn cat-history-pill-btn ${timeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTimeFilter('all')}
                >
                  All History ({categoryTransactions.length})
                </button>
                <button
                  type="button"
                  className={`btn cat-history-pill-btn ${timeFilter === 'month' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTimeFilter('month')}
                >
                  This Month
                </button>
              </div>

              {/* Sort Order Selector */}
              <div className="cat-history-sort-wrapper">
                <ArrowUpDown size={14} color="var(--text-muted)" />
                <select
                  className="form-input cat-history-sort-select"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Amount</option>
                  <option value="lowest">Lowest Amount</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="cat-history-list">
            {displayedTransactions.length === 0 ? (
              <div className="cat-history-empty">
                <Receipt size={36} className="cat-history-empty-icon" />
                <h4 className="cat-history-empty-title">No Transactions Found</h4>
                <p className="cat-history-empty-desc">
                  {categoryTransactions.length === 0
                    ? `No expenses have been recorded for ${category.name} yet.`
                    : 'No transactions recorded for this period.'}
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    onClose();
                    onOpenTransactionModal && onOpenTransactionModal('expense', { category: category.id });
                  }}
                >
                  <Plus size={15} /> Add {category.name} Expense
                </button>
              </div>
            ) : (
              displayedTransactions.map((tx) => {
                const pm = getPaymentMethodInfo(tx.paymentMethod);
                const title = tx.recipient || tx.note || `${category.name} Expense`;
                const isInc = tx.type === 'income';

                return (
                  <div key={tx.id} className="cat-history-tx-card">
                    {/* Left/Main Details */}
                    <div className="cat-history-tx-main">
                      <div
                        className="cat-history-tx-icon"
                        style={{ background: `${catColor}18` }}
                      >
                        <span>{category.icon || '🏷️'}</span>
                      </div>

                      <div className="cat-history-tx-info">
                        <div className="cat-history-tx-title">{title}</div>
                        <div className="cat-history-tx-meta">
                          {tx.recipient && tx.note && (
                            <>
                              <span>{tx.note}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>{formatNiceDate(tx.date)}</span>
                          {tx.time && (
                            <>
                              <span>•</span>
                              <span>{formatTime12Hour(tx.time)}</span>
                            </>
                          )}
                          {pm && (
                            <>
                              <span>•</span>
                              <span className="cat-history-pm-badge">
                                <span>{pm.icon}</span> <span>{pm.name}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right/Bottom Side (Amount & Actions) */}
                    <div className="cat-history-tx-side">
                      <span className={`cat-history-tx-amount amount-val ${isInc ? 'income' : 'expense'}`}>
                        {isInc ? '+' : '-'}{formatCurrency(tx.amount, symbol)}
                      </span>

                      <div className="cat-history-tx-actions">
                        {onDuplicateTransaction && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon-only"
                            title="Duplicate Entry"
                            onClick={() => onDuplicateTransaction(tx)}
                          >
                            <Copy size={15} />
                          </button>
                        )}
                        {onOpenTransactionModal && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon-only"
                            title="Edit Entry"
                            onClick={() => {
                              onClose();
                              onOpenTransactionModal(tx.type || 'expense', tx);
                            }}
                          >
                            <Edit3 size={15} />
                          </button>
                        )}
                        {onDeleteTransaction && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon-only delete-action-btn"
                            title="Delete Entry"
                            onClick={() => onDeleteTransaction(tx.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="modal-footer cat-history-footer">
          <button
            type="button"
            className="btn btn-primary cat-history-primary-action-btn"
            onClick={() => {
              onClose();
              onOpenTransactionModal && onOpenTransactionModal('expense', { category: category.id });
            }}
          >
            <Plus size={16} /> Add {category.name} Expense
          </button>

          <div className="cat-history-footer-secondary">
            {onNavigateTab && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  onClose();
                  onNavigateTab('transactions');
                }}
                title="Go to main Transactions Tracker"
              >
                <ExternalLink size={15} /> Transactions Tracker
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
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
