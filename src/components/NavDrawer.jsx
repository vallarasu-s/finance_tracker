import React, { useEffect } from 'react';
import { 
  X, 
  Calendar, 
  LayoutDashboard, 
  Target, 
  BarChart2, 
  Wallet, 
  Settings as SettingsIcon,
  ChevronRight,
  ShieldCheck,
  Plus,
  HelpCircle
} from 'lucide-react';

export default function NavDrawer({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onOpenSettings,
  onOpenHelp,
  onOpenNewEntry,
  transactionCount = 0,
  goalCount = 0
}) {
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

  const navItems = [
    {
      id: 'dashboard',
      label: 'Overview',
      desc: 'Financial summary & quick stats',
      icon: <LayoutDashboard size={22} />,
      accentColor: 'var(--color-brand)'
    },
    {
      id: 'transactions',
      label: 'Daily Tracker',
      desc: 'Daily inflow, outflow & expenses',
      icon: <Calendar size={22} />,
      badge: transactionCount > 0 ? `${transactionCount}` : null,
      accentColor: 'var(--color-income)'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      desc: 'Charts, breakdown & spending trends',
      icon: <BarChart2 size={22} />,
      accentColor: 'var(--color-purple)'
    },
    {
      id: 'goals',
      label: 'Financial Goals',
      desc: 'Target savings & wealth goals',
      icon: <Target size={22} />,
      badge: goalCount > 0 ? `${goalCount}` : null,
      accentColor: 'var(--color-goal)'
    }
  ];

  return (
    <div 
      className="nav-drawer-backdrop" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
    >
      <div 
        className="nav-drawer-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="nav-drawer-header">
          <div className="nav-drawer-brand">
            <div className="nav-drawer-logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="6" width="4.5" height="12" rx="2.25" fill="white" />
                <rect x="9.75" y="4" width="4.5" height="16" rx="2.25" fill="white" />
                <rect x="16.5" y="8" width="4.5" height="10" rx="2.25" fill="white" />
              </svg>
            </div>
            <div className="nav-drawer-brand-text">
              <span className="nav-drawer-title">Finance Manager</span>
              <span className="nav-drawer-tagline">Financial Dashboard</span>
            </div>
          </div>

          <button 
            className="nav-drawer-close-btn"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items (The Four Things) */}
        <div className="nav-drawer-body">
          <div className="nav-drawer-section-label">Main Navigation</div>
          <nav className="nav-drawer-list" aria-label="Primary Navigation">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-drawer-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="nav-drawer-item-icon" style={{ color: item.accentColor }}>
                    {item.icon}
                  </div>

                  <div className="nav-drawer-item-content">
                    <div className="nav-drawer-item-title-row">
                      <span className="nav-drawer-item-title">{item.label}</span>
                      {item.badge && (
                        <span className="nav-drawer-item-badge">{item.badge}</span>
                      )}
                    </div>
                    <span className="nav-drawer-item-desc">{item.desc}</span>
                  </div>

                  <ChevronRight size={16} className="nav-drawer-item-arrow" />
                </button>
              );
            })}
          </nav>

          {/* Quick Action in Drawer */}
          <div className="nav-drawer-quick-action">
            <button
              type="button"
              className="btn btn-primary nav-drawer-add-btn"
              onClick={() => {
                onClose();
                if (onOpenNewEntry) onOpenNewEntry();
              }}
            >
              <Plus size={18} />
              <span>Add New Transaction</span>
            </button>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="nav-drawer-footer">
          <button 
            type="button"
            className="nav-drawer-settings-btn"
            onClick={() => {
              onClose();
              if (onOpenHelp) onOpenHelp();
            }}
          >
            <div className="nav-drawer-settings-icon">
              <HelpCircle size={18} />
            </div>
            <div className="nav-drawer-settings-info">
              <span className="nav-drawer-settings-text">Help & Guides</span>
              <span className="nav-drawer-settings-sub">User manual, FAQs, offline sync</span>
            </div>
            <ChevronRight size={16} />
          </button>

          <button 
            type="button"
            className="nav-drawer-settings-btn"
            onClick={() => {
              onClose();
              if (onOpenSettings) onOpenSettings();
            }}
          >
            <div className="nav-drawer-settings-icon">
              <SettingsIcon size={18} />
            </div>
            <div className="nav-drawer-settings-info">
              <span className="nav-drawer-settings-text">Settings & Account</span>
              <span className="nav-drawer-settings-sub">Currency, Theme, Cloud Sync</span>
            </div>
            <ChevronRight size={16} />
          </button>

          <div className="nav-drawer-security-note">
            <ShieldCheck size={13} />
            <span>Local Encrypted Persistence</span>
          </div>
        </div>
      </div>
    </div>
  );
}
