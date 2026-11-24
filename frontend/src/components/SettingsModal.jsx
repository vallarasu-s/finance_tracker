import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Sun, 
  Moon, 
  RefreshCw, 
  Database, 
  User, 
  LogOut, 
  Wifi, 
  WifiOff, 
  Coins, 
  Palette, 
  ShieldAlert, 
  Check, 
  Sparkles,
  Search,
  Globe,
  Calculator,
  Hash,
  Cloud
} from 'lucide-react';
import { CURRENCIES } from '../services/storage';
import { getMongoStatus, saveMongoPassword } from '../services/api';
import CurrencyCalculator from './CurrencyCalculator';

const POPULAR_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'AED', 'SAR', 'SGD'];

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  transactions = [],
  onUpdateSettings,
  isOnline,
  syncStatus,
  onTriggerSync,
  onOpenBackupModal,
  currentUser,
  onLogout,
  onResetData,
}) {
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');
  const [mongoStatus, setMongoStatus] = useState(null);
  const [mongoPasswordInput, setMongoPasswordInput] = useState('');
  const [isConnectingMongo, setIsConnectingMongo] = useState(false);
  const [mongoMessage, setMongoMessage] = useState(null);

  // Fetch MongoDB connection status when modal opens
  useEffect(() => {
    if (isOpen) {
      getMongoStatus().then(status => {
        if (status) setMongoStatus(status);
      }).catch(() => {});
    }
  }, [isOpen]);

  const handleConnectMongo = async () => {
    if (!mongoPasswordInput.trim()) return;
    setIsConnectingMongo(true);
    setMongoMessage(null);
    try {
      const res = await saveMongoPassword(mongoPasswordInput.trim());
      if (res && res.connected) {
        setMongoStatus({ connected: true, cluster: 'cluster0.bkqubnl.mongodb.net', database: 'finance_tracker' });
        setMongoMessage({ type: 'success', text: 'Connected successfully to MongoDB Atlas! Cloud database is active.' });
        setMongoPasswordInput('');
        if (onTriggerSync) onTriggerSync();
      } else {
        setMongoMessage({ type: 'error', text: res?.message || 'Could not authenticate with MongoDB Atlas. Please verify password.' });
      }
    } catch (err) {
      setMongoMessage({ type: 'error', text: 'Connection failed: ' + err.message });
    } finally {
      setIsConnectingMongo(false);
    }
  };

  // Balance calculations for currency converter
  const totalIncomeAll = useMemo(() => 
    (transactions || []).filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0)
  , [transactions]);

  const totalExpenseAll = useMemo(() => 
    (transactions || []).filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0)
  , [transactions]);

  const currentBalance = totalIncomeAll - totalExpenseAll;

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeCurrencyCode = settings?.currency || 'USD';
  const activeCurrency = CURRENCIES.find(c => c.code === activeCurrencyCode) || CURRENCIES[0];

  const currentFormat = settings?.numberFormat || 'auto';
  const currencyDisplayMode = settings?.currencyDisplay || 'symbol';
  const currentCroreSymbol = settings?.croreSymbol || 'c';
  const compactNumbers = settings?.compactNumbers !== false;

  const filteredCurrencies = CURRENCIES.filter(c => {
    if (!currencySearchQuery.trim()) return true;
    const q = currencySearchQuery.toLowerCase();
    return (
      c.country.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
    );
  });

  const toggleTheme = (themeName) => {
    onUpdateSettings({ theme: themeName });
    document.documentElement.setAttribute('data-theme', themeName);
  };

  const handleCurrencyChange = (code) => {
    const selected = CURRENCIES.find(c => c.code === code);
    if (selected) {
      onUpdateSettings({ currency: selected.code, currencySymbol: selected.symbol });
    }
  };

  return (
    <div 
      className="modal-overlay modal-backdrop" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="settings-modal-title"
    >
      <div 
        className="modal-dialog modal-content settings-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-title-group">
            <h2 id="settings-modal-title" className="modal-title">Settings & Preferences</h2>
            <p className="modal-subtitle">Manage your account, display, currency, and data sync</p>
          </div>
          <button 
            type="button"
            className="btn-close-modal btn btn-ghost btn-icon-only" 
            onClick={onClose}
            aria-label="Close Settings"
            title="Close Settings"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body settings-modal-body">
          {/* Section 1: User Profile & Account */}
          <div className="settings-section">
            <div className="settings-section-header">
              <User size={18} className="settings-section-icon" />
              <span className="settings-section-title">User Account</span>
            </div>

            <div className="settings-account-card">
              <div className="settings-account-main">
                <div className="settings-user-avatar">
                  {currentUser?.avatar || 'FT'}
                </div>
                <div className="settings-account-details">
                  <div className="settings-user-name">{currentUser?.name || 'Finance Tracker'}</div>
                  <div className="settings-user-email">{currentUser?.email || 'financetracker@example.com'}</div>
                  <span className="settings-user-badge">{currentUser?.role || 'Personal Account'}</span>
                </div>
              </div>

              <button 
                type="button"
                className="btn btn-secondary btn-danger-ghost settings-logout-btn"
                onClick={() => {
                  onClose();
                  if (onLogout) onLogout();
                }}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Section 2: Appearance & Theme */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Palette size={18} className="settings-section-icon" />
              <span className="settings-section-title">Theme & Appearance</span>
            </div>

            <div className="settings-theme-toggle-group">
              <button 
                type="button"
                className={`theme-option-card ${settings.theme === 'dark' ? 'active' : ''}`}
                onClick={() => toggleTheme('dark')}
              >
                <div className="theme-option-icon dark-icon">
                  <Moon size={20} />
                </div>
                <div className="theme-option-info">
                  <span className="theme-option-name">Dark Mode</span>
                  <span className="theme-option-desc">Sleek AMOLED contrast</span>
                </div>
                {settings.theme === 'dark' && <Check size={18} className="theme-selected-check" />}
              </button>

              <button 
                type="button"
                className={`theme-option-card ${settings.theme === 'light' ? 'active' : ''}`}
                onClick={() => toggleTheme('light')}
              >
                <div className="theme-option-icon light-icon">
                  <Sun size={20} />
                </div>
                <div className="theme-option-info">
                  <span className="theme-option-name">Light Mode</span>
                  <span className="theme-option-desc">Clean, bright surface</span>
                </div>
                {settings.theme === 'light' && <Check size={18} className="theme-selected-check" />}
              </button>
            </div>
          </div>

          {/* Section 3: Country Currency & Regional Settings */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Coins size={18} className="settings-section-icon" />
              <div className="settings-section-title-wrap">
                <span className="settings-section-title">Country & Currency</span>
                <span className="settings-section-badge">{CURRENCIES.length} Available</span>
              </div>
            </div>

            <div className="settings-currency-container">
              {/* Active Selected Currency Showcase Card */}
              <div className="settings-active-currency-showcase">
                <div className="active-currency-main">
                  <span className="active-currency-flag-large">{activeCurrency.flag}</span>
                  <div className="active-currency-details">
                    <div className="active-currency-title-row">
                      <span className="active-currency-country-name">{activeCurrency.country}</span>
                      <span className="active-currency-pill-badge">Active</span>
                    </div>
                    <span className="active-currency-subtext">
                      {activeCurrency.name} • <span className="active-code-mono">{activeCurrency.code}</span>
                    </span>
                  </div>
                </div>
                <div className="active-currency-symbol-display">
                  <span className="active-symbol-char">{activeCurrency.symbol}</span>
                </div>
              </div>

              {/* Popular Currencies Quick Bar */}
              <div className="settings-popular-row">
                <span className="settings-popular-label">Popular:</span>
                <div className="settings-popular-chips">
                  {POPULAR_CURRENCIES.map(code => {
                    const curr = CURRENCIES.find(c => c.code === code);
                    if (!curr) return null;
                    const isSelected = curr.code === activeCurrencyCode;
                    return (
                      <button
                        key={code}
                        type="button"
                        className={`settings-chip-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => handleCurrencyChange(curr.code)}
                        title={`${curr.country} - ${curr.name} (${curr.symbol})`}
                      >
                        <span className="chip-flag">{curr.flag}</span>
                        <span className="chip-code">{curr.code}</span>
                        <span className="chip-sym">({curr.symbol})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Filter Box */}
              <div className="settings-currency-search-box">
                <Search size={15} className="settings-search-icon" />
                <input
                  type="text"
                  placeholder="Search country, currency, or code (e.g. India, USD, ₹)..."
                  value={currencySearchQuery}
                  onChange={(e) => setCurrencySearchQuery(e.target.value)}
                  className="settings-currency-input"
                />
                {currencySearchQuery && (
                  <button
                    type="button"
                    className="settings-search-clear-btn"
                    onClick={() => setCurrencySearchQuery('')}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Scrollable Currency Selection Grid / List */}
              <div className="settings-currency-grid-scroll">
                {filteredCurrencies.length === 0 ? (
                  <div className="settings-currency-no-results">
                    <p>No country or currency found matching "{currencySearchQuery}"</p>
                    <button
                      type="button"
                      className="settings-clear-filter-btn"
                      onClick={() => setCurrencySearchQuery('')}
                    >
                      Show all currencies
                    </button>
                  </div>
                ) : (
                  filteredCurrencies.map(c => {
                    const isSelected = c.code === activeCurrencyCode;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        className={`settings-currency-card-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleCurrencyChange(c.code)}
                      >
                        <span className="currency-card-flag">{c.flag}</span>
                        <div className="currency-card-meta">
                          <span className="currency-card-country">{c.country}</span>
                          <span className="currency-card-name">{c.name}</span>
                        </div>
                        <div className="currency-card-tag">
                          <span className="currency-card-code">{c.code}</span>
                          <span className="currency-card-symbol">{c.symbol}</span>
                        </div>
                        {isSelected && (
                          <div className="currency-card-check">
                            <Check size={13} />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Number Formatting & Shortform Style */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Hash size={18} className="settings-section-icon" />
              <div className="settings-section-title-wrap">
                <span className="settings-section-title">Number Formatting & Shortforms</span>
                <span className="settings-section-badge">Compact Display</span>
              </div>
            </div>

            <div className="settings-number-format-wrapper">
              <p className="settings-section-desc-note">
                Configure how numbers are formatted on overview cards, KPI metrics, charts, and lists.
              </p>

              {/* Format System Options */}
              <div className="settings-format-options-grid">
                <button
                  type="button"
                  className={`format-option-card ${currentFormat === 'auto' ? 'active' : ''}`}
                  onClick={() => onUpdateSettings({ numberFormat: 'auto' })}
                >
                  <div className="format-option-header">
                    <span className="format-option-title">Auto (Matches Country Currency)</span>
                    {currentFormat === 'auto' && <Check size={16} className="format-check-icon" />}
                  </div>
                  <p className="format-option-desc">Automatically selects Lakh/Crore for India, and Million/Billion for USA, Europe, etc.</p>
                  <div className="format-option-preview">
                    <span>Active: {activeCurrency.code === 'INR' ? `₹50K • ₹15L • ₹10${currentCroreSymbol}` : '$50K • $1.5M • $100M'}</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`format-option-card ${currentFormat === 'standard' ? 'active' : ''}`}
                  onClick={() => onUpdateSettings({ numberFormat: 'standard' })}
                >
                  <div className="format-option-header">
                    <span className="format-option-title">Without Shortform (Full Digits)</span>
                    {currentFormat === 'standard' && <Check size={16} className="format-check-icon" />}
                  </div>
                  <p className="format-option-desc">Displays full comma-separated digits without abbreviations</p>
                  <div className="format-option-preview">
                    <span>e.g. {activeCurrency.symbol}10,00,00,000.00</span>
                  </div>
                </button>
              </div>

              {/* Currency Display Format: Symbol vs Code (Country Shortform) vs Both */}
              <div className="settings-crore-symbol-picker" style={{ marginTop: '1rem' }}>
                <div className="crore-picker-info">
                  <span className="crore-picker-title">Country Currency Shortform Display</span>
                  <span className="crore-picker-subtitle">Choose how currency is displayed: Symbol ({activeCurrency.symbol}), Code ({activeCurrency.code}), or Both</span>
                </div>
                <div className="crore-picker-toggles">
                  <button
                    type="button"
                    className={`crore-symbol-btn ${currencyDisplayMode === 'symbol' ? 'active' : ''}`}
                    onClick={() => onUpdateSettings({ currencyDisplay: 'symbol' })}
                    title={`Symbol Only (${activeCurrency.symbol})`}
                  >
                    <span className="symbol-pill-txt">Symbol</span>
                    <span className="symbol-pill-sub">{activeCurrency.symbol}100M</span>
                  </button>
                  <button
                    type="button"
                    className={`crore-symbol-btn ${currencyDisplayMode === 'code' ? 'active' : ''}`}
                    onClick={() => onUpdateSettings({ currencyDisplay: 'code' })}
                    title={`Code / Country Shortform (${activeCurrency.code})`}
                  >
                    <span className="symbol-pill-txt">Shortform</span>
                    <span className="symbol-pill-sub">100M {activeCurrency.code}</span>
                  </button>
                  <button
                    type="button"
                    className={`crore-symbol-btn ${currencyDisplayMode === 'both' ? 'active' : ''}`}
                    onClick={() => onUpdateSettings({ currencyDisplay: 'both' })}
                    title={`Both Symbol & Code (${activeCurrency.symbol} ${activeCurrency.code})`}
                  >
                    <span className="symbol-pill-txt">Both</span>
                    <span className="symbol-pill-sub">{activeCurrency.symbol}100M {activeCurrency.code}</span>
                  </button>
                </div>
              </div>

              {/* Indian Crore Symbol Preference Sub-row */}
              {(activeCurrency.code === 'INR' || activeCurrency.symbol === '₹' || currentFormat === 'indian') && (
                <div className="settings-crore-symbol-picker">
                  <div className="crore-picker-info">
                    <span className="crore-picker-title">Crore Shortform Symbol</span>
                    <span className="crore-picker-subtitle">Choose whether 1 Crore is represented with 'c' or 'Cr'</span>
                  </div>
                  <div className="crore-picker-toggles">
                    <button
                      type="button"
                      className={`crore-symbol-btn ${currentCroreSymbol === 'c' ? 'active' : ''}`}
                      onClick={() => onUpdateSettings({ croreSymbol: 'c' })}
                      title="Use symbol 'c' for Crore (e.g. 10c)"
                    >
                      <span className="symbol-pill-txt">'c'</span>
                      <span className="symbol-pill-sub">(e.g. 10c)</span>
                    </button>
                    <button
                      type="button"
                      className={`crore-symbol-btn ${currentCroreSymbol === 'Cr' ? 'active' : ''}`}
                      onClick={() => onUpdateSettings({ croreSymbol: 'Cr' })}
                      title="Use symbol 'Cr' for Crore (e.g. 10Cr)"
                    >
                      <span className="symbol-pill-txt">'Cr'</span>
                      <span className="symbol-pill-sub">(e.g. 10Cr)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Compact Toggle Row */}
              <div className="settings-compact-toggle-row">
                <div className="compact-toggle-info">
                  <span className="compact-toggle-title">Enable Shortform on Metric Cards</span>
                  <span className="compact-toggle-desc">Automatically format large amounts cleanly so cards never stretch or overflow</span>
                </div>
                <button
                  type="button"
                  className={`settings-switch-btn ${compactNumbers ? 'active' : ''}`}
                  onClick={() => onUpdateSettings({ compactNumbers: !compactNumbers })}
                  role="switch"
                  aria-checked={compactNumbers}
                >
                  <span className="switch-slider"></span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Currency Calculator & Converter */}
          <div className="settings-section settings-currency-calc-section">
            <div className="settings-section-header">
              <Calculator size={18} className="settings-section-icon" />
              <span className="settings-section-title">Currency Calculator & Converter</span>
            </div>
            
            <div className="settings-currency-calc-wrapper">
              <CurrencyCalculator 
                settings={settings}
                currentBalance={currentBalance}
                displayCash={currentBalance}
                displayRevenue={totalIncomeAll}
              />
            </div>
          </div>

          {/* Section 5: Java Backend Sync */}
          <div className="settings-section">
            <div className="settings-section-header">
              <RefreshCw size={18} className="settings-section-icon" />
              <span className="settings-section-title">Cloud & Backend Sync</span>
            </div>

            <div className="settings-sync-card">
              <div className="settings-sync-status-row">
                <div className="settings-sync-status-info">
                  <span className="settings-sync-label">Connection Status</span>
                  {isOnline ? (
                    <div className="sync-status-pill online">
                      <span className="status-dot-pulse"></span>
                      <Wifi size={14} />
                      <span>Online (Java Backend Connected)</span>
                    </div>
                  ) : (
                    <div className="sync-status-pill offline">
                      <span className="status-dot-static"></span>
                      <WifiOff size={14} />
                      <span>Offline Storage (Local Persistence Active)</span>
                    </div>
                  )}
                </div>

                <button 
                  type="button" 
                  className="btn btn-secondary settings-sync-now-btn"
                  onClick={onTriggerSync}
                  disabled={syncStatus === 'syncing'}
                >
                  <RefreshCw size={16} className={syncStatus === 'syncing' ? 'spin-icon' : ''} />
                  <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>

              <p className="settings-sync-note">
                Your entries are automatically secured in local storage. When the Java REST backend is reachable, transactions sync across sessions.
              </p>
            </div>

            {/* MongoDB Atlas Cloud Database Card */}
            <div className="settings-sync-card" style={{ marginTop: '0.85rem' }}>
              <div className="settings-sync-status-row">
                <div className="settings-sync-status-info">
                  <span className="settings-sync-label">MongoDB Atlas Database</span>
                  {mongoStatus?.connected ? (
                    <div className="sync-status-pill online">
                      <span className="status-dot-pulse"></span>
                      <Cloud size={14} />
                      <span>Connected to MongoDB Atlas</span>
                    </div>
                  ) : (
                    <div className="sync-status-pill offline">
                      <span className="status-dot-static"></span>
                      <Database size={14} />
                      <span>Password Required</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <span className="badge" style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)' }}>
                    cluster0.bkqubnl.mongodb.net
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '0.65rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span>Database: <strong>finance_tracker</strong> • Collections: <code>users</code>, <code>transactions</code>, <code>goals</code>, <code>settings</code></span>
              </div>

              {!mongoStatus?.connected && (
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="password"
                    className="form-input"
                    style={{ flex: 1, minWidth: '180px', padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                    placeholder="Enter MongoDB Atlas password..."
                    value={mongoPasswordInput}
                    onChange={(e) => setMongoPasswordInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                    disabled={isConnectingMongo || !mongoPasswordInput.trim()}
                    onClick={handleConnectMongo}
                  >
                    {isConnectingMongo ? 'Connecting...' : 'Connect Database'}
                  </button>
                </div>
              )}

              {mongoMessage && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.76rem', color: mongoMessage.type === 'success' ? '#10B981' : '#EF4444' }}>
                  {mongoMessage.text}
                </div>
              )}

              <p className="settings-sync-note" style={{ marginTop: '0.5rem' }}>
                Stores all user profile info, transaction amounts, and savings goals in your cloud MongoDB cluster via the Java 21 backend. You can also configure <code>mongodb.password</code> in <code>backend/config.properties</code>.
              </p>
            </div>
          </div>

          {/* Section 6: Data Management & Backups */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Database size={18} className="settings-section-icon" />
              <span className="settings-section-title">Data Management</span>
            </div>

            <div className="settings-data-actions">
              <button 
                type="button"
                className="btn btn-secondary settings-backup-btn"
                onClick={() => {
                  onClose();
                  if (onOpenBackupModal) onOpenBackupModal();
                }}
              >
                <Database size={16} />
                <span>Backup & Export (JSON / CSV)</span>
              </button>

              <button 
                type="button"
                className="btn btn-secondary btn-danger-outline settings-reset-btn"
                onClick={() => {
                  if (window.confirm('Are you sure you want to erase all local data? This will reset all transactions and goals.')) {
                    if (onResetData) onResetData();
                    onClose();
                  }
                }}
              >
                <ShieldAlert size={16} />
                <span>Reset All Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer settings-modal-footer">
          <span className="settings-version-tag">
            <Sparkles size={13} /> Finance Tracker v1.2.0 • Offline Ready
          </span>
          <button 
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
