import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  ExternalLink, 
  Check, 
  ArrowRight, 
  X,
  Tag,
  ShieldCheck,
  Zap,
  ListTodo,
  Trash2
} from 'lucide-react';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function getAutoDeleteLabel(timestamp) {
  if (!timestamp) return '7d left';
  const age = Date.now() - Number(timestamp);
  const remaining = ONE_WEEK_MS - age;
  if (remaining <= 0) return 'Expiring';
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  if (days >= 1) return `${days}d left`;
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  if (hours >= 1) return `${hours}h left`;
  const minutes = Math.max(1, Math.floor(remaining / (1000 * 60)));
  return `${minutes}m left`;
}

export default function NotificationDropdown({
  isOpen,
  onClose,
  appUpdates = [],
  todos = [],
  onToggleTodo,
  onMarkUpdateRead,
  onMarkAllUpdatesRead,
  onDeleteUpdate,
  onClearAllUpdates,
  onNavigateTab
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'updates' | 'todos'
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // STRICT SPECIFICATION: ONLY SHOW APP UPDATES & UNFINISHED TODOS
  const unfinishedTodos = todos.filter(t => !t.completed);
  const unreadUpdates = appUpdates.filter(u => !u.read);
  const totalCount = unreadUpdates.length + unfinishedTodos.length;

  return (
    <div 
      className="fogo-notification-dropdown" 
      ref={dropdownRef}
      role="dialog"
      aria-label="Notifications - App Updates and Unfinished Todos"
    >
      {/* Header */}
      <div className="notif-header">
        <div className="notif-header-title-row">
          <div className="notif-title-group">
            <h4 className="notif-title">Notifications</h4>
            {totalCount > 0 && (
              <span className="notif-badge-pill">{totalCount} pending</span>
            )}
          </div>
          <div className="notif-header-actions">
            {unreadUpdates.length > 0 && (
              <button 
                type="button" 
                className="notif-mark-all-btn"
                onClick={onMarkAllUpdatesRead}
                title="Mark all updates as read"
              >
                <Check size={13} />
                <span>Mark all read</span>
              </button>
            )}
            <button 
              type="button" 
              className="notif-close-btn"
              onClick={onClose}
              aria-label="Close notifications"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="notif-filter-tabs">
          <button 
            type="button" 
            className={`notif-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({totalCount})
          </button>
          <button 
            type="button" 
            className={`notif-tab ${filter === 'updates' ? 'active' : ''}`}
            onClick={() => setFilter('updates')}
          >
            <Sparkles size={13} />
            App Updates ({appUpdates.length})
          </button>
          <button 
            type="button" 
            className={`notif-tab ${filter === 'todos' ? 'active' : ''}`}
            onClick={() => setFilter('todos')}
          >
            <ListTodo size={13} />
            Unfinished Todos ({unfinishedTodos.length})
          </button>
        </div>
      </div>

      {/* Body List */}
      <div className="notif-body">
        {/* Section 1: Unfinished Todos (Financial Tasks) */}
        {(filter === 'all' || filter === 'todos') && (
          <div className="notif-section">
            <div className="notif-section-header">
              <div className="notif-section-label">
                <ListTodo size={14} className="notif-sec-icon orange" />
                <span>Unfinished Financial Todos</span>
              </div>
              <span className="notif-sec-count">
                {unfinishedTodos.length} remaining
              </span>
            </div>

            {unfinishedTodos.length === 0 ? (
              <div className="notif-empty-card">
                <CheckCircle2 size={24} className="notif-empty-icon text-success" />
                <p className="notif-empty-text">All financial tasks are completed!</p>
                <span className="notif-empty-sub">Great discipline. Check back for tomorrow's checklist.</span>
              </div>
            ) : (
              <div className="notif-items-list">
                {unfinishedTodos.map(todo => (
                  <div key={todo.id} className="notif-todo-item">
                    <button
                      type="button"
                      className="notif-todo-check-btn"
                      onClick={() => onToggleTodo(todo.id)}
                      title="Click to mark completed"
                      aria-label={`Mark "${todo.text}" completed`}
                    >
                      <Circle size={18} className="todo-circle-icon" />
                    </button>
                    <div className="notif-todo-content">
                      <p className="notif-todo-text">{todo.text}</p>
                      <div className="notif-todo-meta">
                        <span className="notif-todo-category">{todo.category || 'General'}</span>
                        <span className="notif-todo-due">
                          <Clock size={11} /> {todo.due || 'Today'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="notif-todo-action-btn"
                      onClick={() => onToggleTodo(todo.id)}
                      title="Mark Done"
                    >
                      <Check size={13} />
                      <span>Done</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 2: App Updates */}
        {(filter === 'all' || filter === 'updates') && (
          <div className="notif-section">
            <div className="notif-section-header">
              <div className="notif-section-label">
                <Sparkles size={14} className="notif-sec-icon blue" />
                <span>App Updates & Releases</span>
              </div>
              <div className="notif-section-header-right">
                <span 
                  className="notif-autodelete-pill" 
                  title="Notifications auto-delete after 1 week (7 days) to keep your inbox clean"
                >
                  <Clock size={11} />
                  <span>Auto-delete: 1 week</span>
                </span>
                {unreadUpdates.length > 0 && (
                  <span className="notif-sec-badge">{unreadUpdates.length} new</span>
                )}
                {appUpdates.length > 0 && onClearAllUpdates && (
                  <button
                    type="button"
                    className="notif-clear-all-btn"
                    onClick={onClearAllUpdates}
                    title="Clear all app updates"
                  >
                    <Trash2 size={11} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {appUpdates.length === 0 ? (
              <div className="notif-empty-card">
                <Sparkles size={24} className="notif-empty-icon text-muted" />
                <p className="notif-empty-text">No updates right now</p>
                <span className="notif-empty-sub">
                  Updates older than 1 week are automatically removed.
                </span>
              </div>
            ) : (
              <div className="notif-items-list">
                {appUpdates.map(update => (
                  <div 
                    key={update.id} 
                    className={`notif-update-item ${!update.read ? 'unread' : ''}`}
                    onClick={() => !update.read && onMarkUpdateRead(update.id)}
                  >
                    <div className="notif-update-icon-pill">
                      <Zap size={16} />
                    </div>
                    <div className="notif-update-details">
                      <div className="notif-update-meta-row">
                        <span className="notif-update-version">{update.version}</span>
                        <span className="notif-update-tag">{update.tag}</span>
                        <span 
                          className="notif-update-expiry" 
                          title={`Auto-deletes 1 week after release (${getAutoDeleteLabel(update.timestamp)})`}
                        >
                          <Clock size={10} />
                          <span>{getAutoDeleteLabel(update.timestamp)}</span>
                        </span>
                        <span className="notif-update-date">{update.date}</span>
                      </div>
                      <h5 className="notif-update-title">{update.title}</h5>
                      <p className="notif-update-desc">{update.description}</p>
                    </div>
                    <div className="notif-update-actions">
                      {!update.read && (
                        <span 
                          className="notif-unread-dot" 
                          title="Unread update"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkUpdateRead(update.id);
                          }} 
                        />
                      )}
                      {onDeleteUpdate && (
                        <button
                          type="button"
                          className="notif-delete-btn"
                          title="Delete notification"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteUpdate(update.id);
                          }}
                          aria-label={`Delete notification ${update.version}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="notif-footer">
        <button
          type="button"
          className="notif-view-dashboard-btn"
          onClick={() => {
            onClose();
            if (onNavigateTab) onNavigateTab('dashboard');
          }}
        >
          <span>Open Financial Dashboard Todos</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
