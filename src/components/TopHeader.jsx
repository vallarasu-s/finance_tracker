import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  Settings as SettingsIcon, 
  ChevronDown,
  Coins,
  Check,
  Globe,
  HelpCircle,
  Sun,
  Moon
} from 'lucide-react';
import { CURRENCIES } from '../services/storage';
import NotificationDropdown from './NotificationDropdown';

export default function TopHeader({
  activeTab,
  onOpenNavDrawer,
  isNavDrawerOpen = false,
  onOpenSettings,
  onOpenHelp,
  onOpenTransactionModal,
  currentUser,
  isOnline,
  searchQuery,
  onSearchChange,
  settings = {},
  onUpdateCurrency,
  todos = [],
  appUpdates = [],
  onToggleTodo,
  onMarkUpdateRead,
  onMarkAllUpdatesRead,
  onDeleteUpdate,
  onClearAllUpdates,
  onNavigateTab,
  onToggleTheme
}) {
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const currencyDropdownRef = useRef(null);

  // Active currency details
  const activeCurrencyCode = settings.currency || 'USD';
  const activeCurrency = CURRENCIES.find(c => c.code === activeCurrencyCode) || CURRENCIES[0];

  // Unfinished todos & unread app updates count
  const unfinishedTodosCount = todos.filter(t => !t.completed).length;
  const unreadUpdatesCount = appUpdates.filter(u => !u.read).length;
  const totalNotifications = unfinishedTodosCount + unreadUpdatesCount;

  // Filter currencies by search
  const filteredCurrencies = CURRENCIES.filter(c => {
    if (!currencySearch.trim()) return true;
    const q = currencySearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
    );
  });

  // Close currency dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(e.target)) {
        setIsCurrencyDropdownOpen(false);
      }
    }
    if (isCurrencyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCurrencyDropdownOpen]);

  // Determine title based on active tab
  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Financial Dashboard';
      case 'transactions':
        return 'Daily Transactions Tracker';
      case 'analytics':
        return 'Analytics & Spending Trends';
      case 'goals':
        return 'Financial Goals & Services';
      case 'help':
        return 'Help Center & Documentation';
      default:
        return 'Financial Dashboard';
    }
  };

  const userName = currentUser?.name || 'Dwayne Tatum';
  const userRole = currentUser?.email ? 'Personal Account' : 'CEO Assistant';
  const userAvatar = currentUser?.avatar || (currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'DT');

  return (
    <header className="fogo-top-header">
      {/* Left side: Hamburger 3-Line Menu + Page Title */}
      <div className="top-header-left">
        <button
          type="button"
          className={`top-header-menu-btn ${isNavDrawerOpen ? 'active' : ''}`}
          onClick={onOpenNavDrawer}
          aria-label="Toggle Navigation Menu"
          aria-expanded={isNavDrawerOpen}
          title="Open Navigation Menu (☰)"
        >
          <Menu size={22} />
        </button>

        <h1 className="top-header-page-title">{getPageTitle()}</h1>
      </div>

      {/* Right side: Search, Currency Switcher, Notifications, User Profile */}
      <div className="top-header-right">
        {/* Search Pill Input */}
        <div className="top-header-search">
          <Search size={16} className="top-header-search-icon" />
          <input
            type="text"
            className="top-header-search-input"
            placeholder="Search here"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>

        {/* Global Country Currency Switcher Pill */}
        <div className="top-header-currency-wrapper" ref={currencyDropdownRef}>
          <button
            type="button"
            className={`top-header-currency-pill ${isCurrencyDropdownOpen ? 'active' : ''}`}
            onClick={() => setIsCurrencyDropdownOpen(prev => !prev)}
            title={`Active Currency: ${activeCurrency.country} (${activeCurrency.code} ${activeCurrency.symbol}) - Click to Change`}
            aria-label="Select Country Currency"
            aria-expanded={isCurrencyDropdownOpen}
          >
            <span className="currency-flag">{activeCurrency.flag}</span>
            <span className="currency-code">{activeCurrency.code}</span>
            <span className="currency-symbol-badge">{activeCurrency.symbol}</span>
            <ChevronDown size={14} className={`currency-chevron ${isCurrencyDropdownOpen ? 'rotate' : ''}`} />
          </button>

          {/* Quick Currency Selector Dropdown */}
          {isCurrencyDropdownOpen && (
            <div className="fogo-currency-popover">
              <div className="popover-header">
                <div className="popover-header-row">
                  <Globe size={15} />
                  <span className="popover-title">Select Country Currency</span>
                </div>
                <div className="popover-search-box">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search country or currency..."
                    value={currencySearch}
                    onChange={(e) => setCurrencySearch(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="popover-currency-list">
                {filteredCurrencies.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    className={`popover-currency-item ${c.code === activeCurrencyCode ? 'selected' : ''}`}
                    onClick={() => {
                      if (onUpdateCurrency) {
                        onUpdateCurrency(c.code, c.symbol);
                      }
                      setIsCurrencyDropdownOpen(false);
                      setCurrencySearch('');
                    }}
                  >
                    <span className="item-flag">{c.flag}</span>
                    <div className="item-meta">
                      <span className="item-country">{c.country}</span>
                      <span className="item-name">{c.name}</span>
                    </div>
                    <span className="item-code-symbol">
                      <span className="item-code">{c.code}</span>
                      <span className="item-symbol">{c.symbol}</span>
                    </span>
                    {c.code === activeCurrencyCode && (
                      <Check size={16} className="item-check" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell with Dynamic Counter (App Updates & Unfinished Todos only) */}
        <div className="top-header-notif-wrapper">
          <button
            type="button"
            className={`top-header-icon-btn ${isNotifOpen ? 'active' : ''}`}
            title={`Notifications: ${unreadUpdatesCount} app updates, ${unfinishedTodosCount} unfinished todos`}
            aria-label="Open Notifications"
            onClick={() => setIsNotifOpen(prev => !prev)}
            aria-expanded={isNotifOpen}
          >
            <Bell size={18} />
            {totalNotifications > 0 ? (
              <span className="top-header-notification-badge" aria-label={`${totalNotifications} notifications`}>
                {totalNotifications > 9 ? '9+' : totalNotifications}
              </span>
            ) : null}
          </button>

          {/* Interactive Notification Dropdown */}
          <NotificationDropdown
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            appUpdates={appUpdates}
            todos={todos}
            onToggleTodo={onToggleTodo}
            onMarkUpdateRead={onMarkUpdateRead}
            onMarkAllUpdatesRead={onMarkAllUpdatesRead}
            onDeleteUpdate={onDeleteUpdate}
            onClearAllUpdates={onClearAllUpdates}
            onNavigateTab={onNavigateTab}
          />
        </div>

        {/* User Profile Pill */}
        <div 
          className="top-header-user-profile" 
          onClick={onOpenSettings}
          title="Open Account & Settings"
          role="button"
          tabIndex={0}
        >
          <div className="top-header-avatar">
            {currentUser?.avatar ? (
              <span>{currentUser.avatar}</span>
            ) : (
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                alt={userName}
                className="top-header-avatar-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.textContent = userAvatar;
                }}
              />
            )}
          </div>
          <div className="top-header-user-meta">
            <span className="top-header-user-name">{userName}</span>
            <span className="top-header-user-role">{userRole}</span>
          </div>
        </div>

        {/* Theme Toggle Button (Sun / Moon) matching Bsinx Admin Header */}
        <button
          type="button"
          className="top-header-icon-btn top-header-theme-btn"
          onClick={onToggleTheme}
          title={`Switch to ${settings?.theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle Theme"
        >
          {settings?.theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#64748b" />}
        </button>

        {/* Help & Support Button */}
        <button
          type="button"
          className="top-header-icon-btn top-header-help-btn"
          onClick={onOpenHelp}
          title="Help Center & User Guide (Press ?)"
          aria-label="Help Center and Guides"
        >
          <HelpCircle size={18} />
        </button>

        {/* Settings Button */}
        <button
          type="button"
          className="top-header-icon-btn top-header-settings-btn"
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Settings"
        >
          <SettingsIcon size={18} />
        </button>
      </div>
    </header>
  );
}
