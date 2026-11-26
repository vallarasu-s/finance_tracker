import React from 'react';
import { Wifi, WifiOff, ShieldCheck } from 'lucide-react';

/**
 * Compact workspace footer showing sync status, privacy indicator, and keyboard shortcuts.
 */
export default function Footer({ isOnline = false, onOpenHelp }) {
  return (
    <footer
      style={{
        marginTop: 'auto',
        padding: '1rem 1.5rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 650, color: 'var(--text-secondary)' }}>Finance Tracker</span>
        <span>•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <ShieldCheck size={13} color="#10b981" />
          Offline-First Vault
        </span>
        <span>•</span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            color: isOnline ? '#10b981' : 'var(--text-muted)',
            fontWeight: 600,
          }}
        >
          {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          {isOnline ? 'Java + MongoDB Connected' : 'Local Mode'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
        <span>Shortcuts: <kbd>N</kbd> New Entry · <kbd>G</kbd> New Goal · <kbd>?</kbd> Help</span>
        {onOpenHelp && (
          <button
            type="button"
            onClick={onOpenHelp}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--color-brand)',
              cursor: 'pointer',
              fontSize: 'inherit',
              fontWeight: 600,
            }}
          >
            Help & Docs
          </button>
        )}
      </div>
    </footer>
  );
}
