import React, { useEffect } from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  BarChart2, 
  Target, 
  HelpCircle, 
  Settings as SettingsIcon, 
  ChevronDown, 
  Plus, 
  TrendingUp,
  Wifi,
  WifiOff,
  X
} from 'lucide-react';

export default function Sidebar({
  isOpen = false,
  onClose,
  activeTab,
  onSelectTab,
  onOpenSettings,
  onOpenHelp,
  onOpenTransactionModal,
  isOnline = false,
  transactionCount = 0,
  goalCount = 0,
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open on small viewports
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('nav-drawer-open');
    } else {
      document.body.classList.remove('nav-drawer-open');
    }
    return () => document.body.classList.remove('nav-drawer-open');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectTab = (tab) => {
    if (onSelectTab) onSelectTab(tab);
    if (onClose) onClose();
  };

  const handleOpenSettings = () => {
    if (onClose) onClose();
    if (onOpenSettings) onOpenSettings();
  };

  const handleOpenHelp = () => {
    if (onClose) onClose();
    if (onOpenHelp) onOpenHelp();
  };

  const handleOpenTransaction = (type = 'income') => {
    if (onClose) onClose();
    if (onOpenTransactionModal) onOpenTransactionModal(type);
  };

  return (
    <div 
      className="sidebar-overlay-backdrop" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu Drawer"
    >
      <aside 
        className="fogo-sidebar fogo-sidebar-drawer" 
        onClick={(e) => e.stopPropagation()}
        aria-label="Main Sidebar Navigation"
      >
        {/* Top Brand Logo & Close Button */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-left">
            <div className="sidebar-brand-logo" aria-hidden="true">
              {/* FOGO Iconic 3-Pill Logo Mark */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="6" width="4.5" height="12" rx="2.25" fill="white" />
                <rect x="9.75" y="4" width="4.5" height="16" rx="2.25" fill="white" />
                <rect x="16.5" y="8" width="4.5" height="10" rx="2.25" fill="white" />
              </svg>
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">Finance</span>
              <span className="sidebar-brand-sub">Manager</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            title="Close navigation"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="sidebar-nav-container">
          {/* Menu Section */}
          <div className="sidebar-section">
            <span className="sidebar-section-title">Menu</span>
            <nav className="sidebar-nav-list">
              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleSelectTab('dashboard')}
              >
                <LayoutDashboard size={18} className="sidebar-item-icon" />
                <span className="sidebar-item-label">Overview</span>
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
                onClick={() => handleSelectTab('transactions')}
              >
                <CreditCard size={18} className="sidebar-item-icon" />
                <span className="sidebar-item-label">Daily Tracker</span>
                <ChevronDown size={14} className="sidebar-item-chevron" />
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => handleSelectTab('analytics')}
              >
                <BarChart2 size={18} className="sidebar-item-icon" />
                <span className="sidebar-item-label">Analytics</span>
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'goals' ? 'active' : ''}`}
                onClick={() => handleSelectTab('goals')}
              >
                <Target size={18} className="sidebar-item-icon" />
                <span className="sidebar-item-label">Financial Goals</span>
                {goalCount > 0 && (
                  <span className="sidebar-badge-pill neutral">{goalCount}</span>
                )}
              </button>
            </nav>
          </div>

          {/* Support Section */}
          <div className="sidebar-section">
            <span className="sidebar-section-title">Support</span>
            <nav className="sidebar-nav-list">
              <button
                type="button"
                className={`sidebar-nav-item sidebar-help-btn ${activeTab === 'help' ? 'active' : ''}`}
                onClick={handleOpenHelp}
                title="Help Center, Guides & Offline Sync"
              >
                <HelpCircle size={18} className="sidebar-item-icon" />
                <span className="sidebar-item-label">Helps</span>
                <span className={`sidebar-status-tag ${isOnline ? 'online' : 'offline'}`}>
                  {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </button>

              <button
                type="button"
                className="sidebar-nav-item"
                onClick={handleOpenSettings}
              >
                <SettingsIcon size={18} className="sidebar-item-icon" />
                <span className="sidebar-item-label">Settings</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Promo / Fast Entry Card */}
        <div className="sidebar-promo-card">
          <div className="sidebar-promo-graphic" aria-hidden="true">
            <TrendingUp size={64} />
          </div>
          <div className="sidebar-promo-content">
            <span className="sidebar-promo-tag">FINANCE</span>
            <h4 className="sidebar-promo-title">Fast Payments for Sales</h4>
            <button
              type="button"
              className="sidebar-promo-btn"
              onClick={() => handleOpenTransaction('income')}
            >
              <Plus size={14} />
              <span>Join Now</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
