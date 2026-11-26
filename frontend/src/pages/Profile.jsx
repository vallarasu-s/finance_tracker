import React from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  Wifi,
  WifiOff,
  Settings,
  Database,
  LogOut,
  Calendar,
} from 'lucide-react';
import { getCurrencyInfo } from '../utils/formatCurrency';

/**
 * User Profile & Account Overview page.
 */
export default function Profile({
  currentUser,
  settings = {},
  isOnline = false,
  stats = { transactions: 0, goals: 0, investments: 0 },
  onOpenSettings,
  onOpenBackup,
  onTriggerSync,
  onLogout,
}) {
  const currencyInfo = getCurrencyInfo(settings.currency || 'USD');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="daily-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {currentUser?.avatar || 'FT'}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{currentUser?.name || 'Finance Tracker'}</h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              {currentUser?.role || 'Personal Account'} · @{currentUser?.username || 'financetracker'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {onOpenSettings && (
            <button type="button" className="btn btn-secondary" onClick={onOpenSettings}>
              <Settings size={16} />
              <span>Settings</span>
            </button>
          )}
          {onLogout && (
            <button type="button" className="btn btn-secondary" onClick={onLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <div className="fogo-card" style={{ padding: '1.1rem' }}>
          <span className="metric-label">Account Email</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.4rem' }}>
            <Mail size={15} color="#10b981" />
            <strong>{currentUser?.email || 'Not configured'}</strong>
          </div>
        </div>

        <div className="fogo-card" style={{ padding: '1.1rem' }}>
          <span className="metric-label">Member Since</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.4rem' }}>
            <Calendar size={15} color="#3b82f6" />
            <strong>{currentUser?.joinedDate || '2026-01-01'}</strong>
          </div>
        </div>

        <div className="fogo-card" style={{ padding: '1.1rem' }}>
          <span className="metric-label">Active Currency & Theme</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.4rem' }}>
            <User size={15} color="#8b5cf6" />
            <strong>
              {currencyInfo.flag} {currencyInfo.code} ({settings.currencySymbol || '$'}) ·{' '}
              {(settings.theme || 'dark') === 'dark' ? 'Dark' : 'Light'}
            </strong>
          </div>
        </div>

        <div className="fogo-card" style={{ padding: '1.1rem' }}>
          <span className="metric-label">Backend & Cloud Sync</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.4rem' }}>
            {isOnline ? <Wifi size={15} color="#10b981" /> : <WifiOff size={15} color="#f59e0b" />}
            <strong>{isOnline ? 'Java + MongoDB Online' : '100% Offline Mode'}</strong>
          </div>
        </div>
      </div>

      <div className="fogo-card" style={{ padding: '1.2rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <ShieldCheck size={20} color="#10b981" />
          <div>
            <strong>Stored Records Summary</strong>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {stats.transactions} Transactions · {stats.goals} Financial Goals · {stats.investments} Investment Holdings
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {onTriggerSync && (
            <button type="button" className="btn btn-primary" onClick={onTriggerSync}>
              <span>Sync Now</span>
            </button>
          )}
          {onOpenBackup && (
            <button type="button" className="btn btn-secondary" onClick={onOpenBackup}>
              <Database size={16} />
              <span>Backup & Restore</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
