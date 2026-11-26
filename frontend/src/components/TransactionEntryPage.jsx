import React, { useState, useMemo } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import {
  CATEGORIES,
  PAYMENT_METHODS,
  parseShortAmount,
  formatCurrency,
  MAX_TRANSACTION_AMOUNT,
} from '../services/transactionService';
import ExpenseCard from '../components/ExpenseCard';
import IncomeCard from '../components/IncomeCard';

/**
 * Shared standalone entry page backing AddExpense and AddIncome views.
 */
export default function TransactionEntryPage({
  type = 'expense',
  transactions = [],
  settings = {},
  onSaveTransaction,
  onDeleteTransaction,
  onBack,
}) {
  const isIncome = type === 'income';
  const symbol = settings.currencySymbol || '$';
  const categoryList = isIncome
    ? CATEGORIES.income
    : CATEGORIES.expense.filter((c) => c.id !== 'groceries');

  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [category, setCategory] = useState(isIncome ? 'salary' : 'food');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const parsed = useMemo(() => parseShortAmount(amount), [amount]);
  const recentEntries = useMemo(
    () => transactions.filter((t) => t.type === type).slice(0, 5),
    [transactions, type]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!parsed.isValid || parsed.value <= 0) {
      setError('Please enter a valid positive amount (e.g. 500, 10k, 2L).');
      return;
    }
    if (parsed.value > MAX_TRANSACTION_AMOUNT) {
      setError('Amount exceeds maximum allowed limit.');
      return;
    }
    setError('');
    const now = new Date();
    onSaveTransaction?.({
      type,
      amount: parsed.value,
      recipient: recipient.trim(),
      category,
      paymentMethod,
      date,
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      note: note.trim(),
    });
    setAmount('');
    setRecipient('');
    setNote('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="daily-banner">
        <div>
          <h2 style={{ margin: 0 }}>{isIncome ? 'Add Income' : 'Add Expense'}</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {isIncome
              ? 'Record salary, freelance payouts, or dividend income.'
              : 'Record daily spending, bills, and card or UPI payments.'}
          </p>
        </div>
        {onBack && (
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="fogo-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && (
          <div className="auth-error-alert" role="alert">
            <span>{error}</span>
          </div>
        )}

        <div className="add-tx-row-2col">
          <div className="add-tx-field">
            <label className="add-tx-label">Amount ({symbol}) *</label>
            <input
              type="text"
              className="add-tx-input"
              placeholder="e.g. 500, 2.5k, 1L"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {parsed.isValid && parsed.value > 0 && (
              <span style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                {formatCurrency(parsed.value, symbol, { settings })}
              </span>
            )}
          </div>

          <div className="add-tx-field">
            <label className="add-tx-label">{isIncome ? 'Source / Payer' : 'Merchant / Recipient'}</label>
            <input
              type="text"
              className="add-tx-input"
              placeholder={isIncome ? 'e.g. Employer Inc., Client' : 'e.g. Cafe, Supermarket'}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
        </div>

        <div className="add-tx-row-2col">
          <div className="add-tx-field">
            <label className="add-tx-label">Category</label>
            <select
              className="add-tx-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categoryList.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="add-tx-field">
            <label className="add-tx-label">Date</label>
            <input
              type="date"
              className="add-tx-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="add-tx-field">
          <label className="add-tx-label">Payment Method</label>
          <div className="add-tx-pm-grid">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.id}
                type="button"
                className={`add-tx-pm-chip ${paymentMethod === pm.id ? 'active' : ''}`}
                onClick={() => setPaymentMethod(pm.id)}
              >
                <span className="add-tx-pm-icon">{pm.icon}</span>
                <span className="add-tx-pm-name">{pm.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="add-tx-field">
          <label className="add-tx-label">Note</label>
          <input
            type="text"
            className="add-tx-input"
            placeholder="Optional description..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="add-tx-footer">
          <button type="submit" className="add-tx-save-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={16} />
            <span>{isIncome ? 'Record Income' : 'Record Expense'}</span>
          </button>
        </div>
      </form>

      {recentEntries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Recent {isIncome ? 'Income' : 'Expenses'}
          </h4>
          {recentEntries.map((tx) =>
            isIncome ? (
              <IncomeCard key={tx.id} transaction={tx} settings={settings} onDelete={onDeleteTransaction} />
            ) : (
              <ExpenseCard key={tx.id} transaction={tx} settings={settings} onDelete={onDeleteTransaction} />
            )
          )}
        </div>
      )}
    </div>
  );
}
