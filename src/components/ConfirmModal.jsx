import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, Info, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'info'
  onConfirm,
  onClose,
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose && onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div 
      className="modal-overlay confirm-modal-overlay" 
      onClick={onClose}
      role="presentation"
      style={{ zIndex: 1300 }}
    >
      <div 
        className="modal-dialog confirm-modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="confirm-modal-header">
          <div className="confirm-icon-wrapper" style={{
            background: isDanger ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            color: isDanger ? '#ef4444' : '#f59e0b',
          }}>
            {isDanger ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
          </div>
          <button 
            type="button" 
            className="btn-close-modal confirm-modal-close" 
            onClick={onClose} 
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        <div className="confirm-modal-body">
          <h3 id="confirm-modal-title" className="confirm-modal-title">
            {title}
          </h3>
          <p className="confirm-modal-message">
            {message}
          </p>
        </div>

        <div className="confirm-modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary confirm-btn-cancel" 
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            className={`btn ${isDanger ? 'btn-danger confirm-btn-danger' : 'btn-primary'}`} 
            onClick={() => {
              onConfirm && onConfirm();
            }}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
