import React from 'react';
import { 
  Wallet, 
  Menu,
  Settings,
  Plus,
  Wifi, 
  WifiOff
} from 'lucide-react';

import { CURRENCIES } from '../services/storage';
export { CURRENCIES };

export default function Navbar({
  onOpenNavDrawer,
  onOpenSettings,
  isOnline,
  currentUser,
  onOpenTransactionModal,
}) {
  return (
    <header className="app-header">
      {/* Left side: Hamburger 3-line button & Brand */}
      <div className="brand-section">
        <button 
          type="button"
          className="btn-hamburger"
          onClick={onOpenNavDrawer}
          aria-label="Open navigation menu (Dashboard, Daily Tracker, Financial Goals, Analytics)"
          title="Open Menu"
        >
          <Menu size={22} />
        </button>

        <div className="brand-logo" aria-hidden="true">
          <Wallet size={22} />
        </div>

        <div className="brand-info">
          <div className="brand-title-row">
            <span className="brand-title">Finance Manager</span>
          </div>

          <div className="brand-badge-row">
            {isOnline ? (
              <span className="online-status-badge online" title="Connected to Java Backend & Sync Ready">
                <span className="status-dot"></span>
                <Wifi size={10} /> Online
              </span>
            ) : (
              <span className="online-status-badge offline" title="Operating 100% Offline with Local Persistence">
                <span className="status-dot"></span>
                <WifiOff size={10} /> Offline
              </span>
            )}

            {currentUser?.name && (
              <span className="brand-user-name-compact" title={`Signed in as ${currentUser.name}`}>
                • {currentUser.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Consolidated Settings & Header Quick Add */}
      <div className="header-actions">
        {/* Header Add Entry (Desktop view) */}
        <button 
          type="button"
          className="btn btn-primary header-new-entry-btn"
          onClick={() => onOpenTransactionModal()}
          title="Add New Daily Transaction"
        >
          <Plus size={16} />
          <span>New Entry</span>
        </button>

        {/* Grouped Settings Button */}
        <button 
          type="button"
          className="btn btn-secondary settings-header-btn"
          onClick={onOpenSettings}
          title="Settings (Currency, Theme, Cloud Sync, Backups, Account)"
          aria-label="Open Settings and Account"
        >
          <Settings size={18} className="settings-gear-icon" />
          <div className="header-user-avatar" title={`User: ${currentUser?.name || 'Finance Tracker'}`}>
            {currentUser?.avatar || 'FT'}
          </div>
          <span className="settings-header-text">Settings</span>
        </button>
      </div>
    </header>
  );
}

