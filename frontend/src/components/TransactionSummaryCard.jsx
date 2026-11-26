import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Trash2, Edit3 } from 'lucide-react';
import { formatCurrency, formatDate, formatTime12Hour } from '../utils/formatCurrency';
import { getCategoryInfo, getPaymentMethodInfo } from '../services/storage';

/**
 * Shared parameterized transaction card used by ExpenseCard and IncomeCard.
 */
export default function TransactionSummaryCard({
  transaction,
  variant = 'expense',
  settings = {},
  onEdit,
  onDelete,
  onClick,
}) {
  if (!transaction) return null;

  const isIncome = variant === 'income' || transaction.type === 'income';
  const symbol = settings.currencySymbol || '$';
  const catInfo = getCategoryInfo(transaction.category, isIncome ? 'income' : 'expense');
  const pmInfo = getPaymentMethodInfo(transaction.paymentMethod);

  const accentColor = isIncome ? '#10b981' : '#ef4444';
  const tintBg = isIncome ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';
  const title = transaction.recipient || transaction.note || catInfo.name;

  return (
    <div
      className="fogo-card"
      onClick={() => onClick?.(transaction)}
      style={{
        padding: '0.9rem 1.05rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.85rem',
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: tintBg,
            color: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.15rem',
            flexShrink: 0,
          }}
        >
          {catInfo.icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <strong
              style={{
                fontSize: '0.92rem',
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </strong>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              marginTop: '0.15rem',
              flexWrap: 'wrap',
            }}
          >
            <span>{catInfo.name}</span>
            <span>•</span>
            <span>{pmInfo.icon} {pmInfo.label}</span>
            {transaction.date && (
              <>
                <span>•</span>
                <span>{formatDate(transaction.date)}{transaction.time ? ` ${formatTime12Hour(transaction.time)}` : ''}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
        <strong
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: accentColor,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          {isIncome ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
          {isIncome ? '+' : '-'}
          {formatCurrency(transaction.amount, symbol, { settings })}
        </strong>

        {(onEdit || onDelete) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {onEdit && (
              <button
                type="button"
                className="holding-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(transaction);
                }}
                title="Edit"
              >
                <Edit3 size={14} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="holding-icon-btn delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(transaction.id);
                }}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
