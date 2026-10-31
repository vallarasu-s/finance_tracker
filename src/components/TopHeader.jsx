import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  Settings as SettingsIcon, 
  HelpCircle,
  Sun,
  Moon,
  ChevronLeft
} from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import { pushModalNavigation, popModalNavigation, goBackOneStep } from '../services/navigation';

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
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const handleToggleNotif = () => {
    if (isNotifOpen) {
      popModalNavigation('notif_dropdown');
    } else {
      setIsNotifOpen(true);
      pushModalNavigation('notif_dropdown', () => setIsNotifOpen(false));
    }
  };

  const handleCloseNotif = () => {
    popModalNavigation('notif_dropdown');
  };

  // Unfinished todos & unread app updates count
  const unfinishedTodosCount = todos.filter(t => !t.completed).length;
  const unreadUpdatesCount = appUpdates.filter(u => !u.read).length;
  const totalNotifications = unfinishedTodosCount + unreadUpdatesCount;

  // Determine title based on active tab
  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Financial Tracker';
      case 'transactions':
        return 'Transactions Tracker';
      case 'analytics':
        return 'Analytics & Spending Trends';
      case 'goals':
        return 'Financial Goals & Services';
      case 'help':
        return 'Help Center & Documentation';
      default:
        return 'Financial Tracker';
    }
  };

  const userName = currentUser?.name || 'Dwayne Tatum';
  const userRole = currentUser?.email ? 'Personal Account' : 'CEO Assistant';
  const userAvatar = currentUser?.avatar || (currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'DT');

  return (
    <header className="fogo-top-header">
      {/* Left side: Hamburger 3-Line Menu + Optional Back Affordance + Page Title */}
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

        {activeTab !== 'dashboard' && (
          <button
            type="button"
            className="top-header-step-back-btn"
            onClick={goBackOneStep}
            title="Go back one step (or press browser Back / Esc)"
            aria-label="Go back one step"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              marginRight: '0.25rem',
              transition: 'all 0.15s ease'
            }}
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <h1 className="top-header-page-title">{getPageTitle()}</h1>
      </div>

      {/* Right side: Search, Notifications, User Profile, Quick Actions */}
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

        {/* Notification Bell with Dynamic Counter (App Updates & Unfinished Todos only) */}
        <div className="top-header-notif-wrapper">
          <button
            type="button"
            className={`top-header-icon-btn ${isNotifOpen ? 'active' : ''}`}
            title={`Notifications: ${unreadUpdatesCount} app updates, ${unfinishedTodosCount} unfinished todos`}
            aria-label="Open Notifications"
            onClick={handleToggleNotif}
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
            onClose={handleCloseNotif}
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
