import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';

        return (
          <div 
            key={t.id} 
            className={`toast ${isSuccess ? 'toast-success' : isError ? 'toast-error' : 'toast-info'}`}
          >
            {isSuccess ? (
              <CheckCircle2 size={18} color="var(--color-income)" style={{ flexShrink: 0 }} />
            ) : isError ? (
              <AlertCircle size={18} color="var(--color-expense)" style={{ flexShrink: 0 }} />
            ) : (
              <Info size={18} color="var(--color-brand)" style={{ flexShrink: 0 }} />
            )}

            <span style={{ flex: 1 }}>{t.message}</span>

            <button 
              className="btn btn-ghost btn-icon-only"
              style={{ width: '24px', height: '24px', padding: 0 }}
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss Notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
