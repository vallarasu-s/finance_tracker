import React, { useRef } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Sparkles, 
  Trash2, 
  ShieldCheck,
  Database
} from 'lucide-react';
import { 
  exportDataAsJSON, 
  exportTransactionsAsCSV, 
  importDataFromJSON 
} from '../services/storage';

export default function DataBackupModal({
  isOpen,
  onClose,
  onReloadData,
  onShowToast,
  onResetData,
  onLoadDemo,
}) {
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    try {
      exportDataAsJSON();
      onShowToast('JSON backup file downloaded successfully!', 'success');
    } catch (err) {
      onShowToast('Failed to export JSON: ' + err.message, 'error');
    }
  };

  const handleExportCSV = () => {
    try {
      const ok = exportTransactionsAsCSV();
      if (ok) {
        onShowToast('Transactions exported as CSV for Excel/Sheets!', 'success');
      } else {
        onShowToast('No transactions found to export.', 'info');
      }
    } catch (err) {
      onShowToast('Failed to export CSV: ' + err.message, 'error');
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const res = importDataFromJSON(text);
      if (res.success) {
        onShowToast(`Restored ${res.countTx} transactions and ${res.countGoals} goals!`, 'success');
        onReloadData();
        onClose();
      } else {
        onShowToast('Import failed: ' + res.error, 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Database size={20} color="var(--color-brand)" />
            <span>Data Storage & Offline Management</span>
          </div>
          <button className="btn btn-ghost btn-icon-only" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Offline Architecture Card */}
          <div style={{
            padding: '1rem',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <ShieldCheck size={24} color="var(--color-income)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                100% Offline-First Durability
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                All your records are stored directly on your computer inside your browser's persistent database. 
                They remain intact without internet connection. You can export or import backups at any time.
              </p>
            </div>
          </div>

          {/* Action Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* Export JSON */}
            <button 
              className="btn btn-secondary"
              style={{ display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.5rem', height: 'auto', textAlign: 'left' }}
              onClick={handleExportJSON}
            >
              <Download size={22} color="var(--color-brand)" />
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>Export JSON Backup</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Complete database snapshot</span>
              </div>
            </button>

            {/* Import JSON */}
            <button 
              className="btn btn-secondary"
              style={{ display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.5rem', height: 'auto', textAlign: 'left' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={22} color="var(--color-income)" />
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>Restore Backup</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Load from .json file</span>
              </div>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".json" 
              style={{ display: 'none' }} 
              onChange={handleImportFile}
            />

            {/* Export CSV */}
            <button 
              className="btn btn-secondary"
              style={{ display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.5rem', height: 'auto', textAlign: 'left' }}
              onClick={handleExportCSV}
            >
              <FileSpreadsheet size={22} color="var(--color-goal)" />
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>Export to CSV</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>For Excel & Google Sheets</span>
              </div>
            </button>

            {/* Load Sample Demo Data */}
            <button 
              className="btn btn-secondary"
              style={{ display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.5rem', height: 'auto', textAlign: 'left' }}
              onClick={() => {
                onLoadDemo();
                onClose();
              }}
            >
              <Sparkles size={22} color="#f59e0b" />
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>Load Sample Data</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Explore realistic demo</span>
              </div>
            </button>
          </div>

          {/* Reset Danger Zone */}
          <div style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Erase all local transactions and goals
            </span>
            <button 
              className="btn btn-secondary"
              style={{ color: 'var(--color-expense)', borderColor: 'rgba(244, 63, 94, 0.3)', fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all data? Make sure you have exported a backup first!')) {
                  onResetData();
                  onClose();
                }
              }}
            >
              <Trash2 size={14} /> Reset Data
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
