import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DailyTransactions from './components/DailyTransactions';
import FinancialGoals from './components/FinancialGoals';
import Analytics from './components/Analytics';
import TransactionModal from './components/TransactionModal';
import GoalModal from './components/GoalModal';
import GoalDepositModal from './components/GoalDepositModal';
import DataBackupModal from './components/DataBackupModal';
import ToastContainer from './components/ToastContainer';
import LoginForm from './components/LoginForm';
import NavDrawer from './components/NavDrawer';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import GoalDetailModal from './components/GoalDetailModal';

import { 
  getTransactions, 
  saveTransaction, 
  deleteTransaction, 
  getGoals, 
  saveGoal, 
  deleteGoal, 
  updateGoalAmount, 
  deleteGoalTransaction,
  getSettings, 
  saveSettings,
  resetAllData,
  getCurrentUser,
  logoutUser,
  getDailyTodos,
  saveDailyTodos,
  DEFAULT_DAILY_TODOS,
  getAppUpdates,
  saveAppUpdates,
  markAppUpdateRead,
  markAllAppUpdatesRead,
  deleteAppUpdate,
  clearAllAppUpdates,
  CURRENCIES
} from './services/storage';

import { checkBackendHealth, syncWithJavaBackend } from './services/api';
import { triggerConfetti } from './services/confetti';

import { Plus } from 'lucide-react';

export default function App() {
  // Navigation State - Default to 'dashboard' (FOGO Overview)
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // User Auth State
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  const handleLogin = (user) => {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name}!`, 'success');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    showToast('Logged out of Finance Tracker.', 'info');
  };

  // Data State
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [settings, setSettings] = useState(getSettings());

  // Backend Sync State
  const [isOnline, setIsOnline] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'

  // Modals
  const [txModalState, setTxModalState] = useState({ isOpen: false, type: 'expense', editing: null });
  const [goalModalState, setGoalModalState] = useState({ isOpen: false, editing: null });
  const [depositModalState, setDepositModalState] = useState({ isOpen: false, goal: null });
  const [goalDetailModalState, setGoalDetailModalState] = useState({ isOpen: false, goal: null });
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [helpInitialTab, setHelpInitialTab] = useState('getting-started');

  const handleOpenHelp = (tab = 'getting-started') => {
    setHelpInitialTab(tab);
    setIsHelpModalOpen(true);
  };

  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Load initial local data
  const reloadData = useCallback(() => {
    const tx = getTransactions();
    const g = getGoals();
    const s = getSettings();
    setTransactions(tx);
    setGoals(g);
    setSettings(s);
    document.documentElement.setAttribute('data-theme', s.theme || 'dark');
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Network & Java Backend Health Check
  const checkHealth = useCallback(async () => {
    const res = await checkBackendHealth();
    setIsOnline(res.online);
    return res.online;
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 8000);

    const onOnline = () => {
      checkHealth();
      showToast('Network restored. Checking Java backend...', 'info');
    };
    const onOffline = () => {
      setIsOnline(false);
      showToast('Operating in 100% Offline Mode.', 'info');
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [checkHealth, showToast]);

  // Sync Handler
  const triggerSync = async () => {
    setSyncStatus('syncing');
    const online = await checkHealth();

    if (!online) {
      setSyncStatus('idle');
      showToast('Java Backend is offline. Changes are saved locally on this computer.', 'info');
      return;
    }

    try {
      const payload = {
        transactions: getTransactions(),
        goals: getGoals(),
        lastSyncTimestamp: Date.now(),
      };

      const res = await syncWithJavaBackend(payload);
      if (res.success) {
        setSyncStatus('synced');
        showToast('Successfully synchronized with Java Backend!', 'success');
        setTimeout(() => setSyncStatus('idle'), 2500);
      } else {
        setSyncStatus('error');
        showToast('Sync completed with warning: ' + res.error, 'error');
      }
    } catch (err) {
      setSyncStatus('error');
      showToast('Sync failed: ' + err.message, 'error');
    }
  };

  // Transaction CRUD handlers
  const handleSaveTransaction = (transactionData) => {
    const updated = saveTransaction(transactionData);
    setTransactions(updated);
    setTxModalState({ isOpen: false, type: 'expense', editing: null });
    showToast(
      transactionData.id ? 'Transaction updated.' : `${transactionData.type === 'income' ? 'Income' : 'Expense'} recorded!`,
      'success'
    );
    // Background sync if online
    if (isOnline) {
      syncWithJavaBackend({ transactions: updated, goals: getGoals() });
    }
  };

  const handleDeleteTransaction = (id) => {
    if (window.confirm('Delete this transaction?')) {
      const updated = deleteTransaction(id);
      setTransactions(updated);
      showToast('Transaction deleted.', 'info');
      if (isOnline) {
        syncWithJavaBackend({ transactions: updated, goals: getGoals() });
      }
    }
  };

  const handleDuplicateTransaction = (tx) => {
    const copy = {
      ...tx,
      id: undefined,
      note: (tx.note || 'Transaction') + ' (Copy)',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().substring(0, 5),
    };
    const updated = saveTransaction(copy);
    setTransactions(updated);
    showToast('Transaction duplicated.', 'success');
  };

  // Goal CRUD handlers
  const handleSaveGoal = (goalData) => {
    const updated = saveGoal(goalData);
    setGoals(updated);
    setGoalModalState({ isOpen: false, editing: null });
    showToast(goalData.id ? 'Goal updated.' : 'New financial goal set!', 'success');

    if (goalData.currentAmount >= goalData.targetAmount) {
      triggerConfetti();
    }

    if (isOnline) {
      syncWithJavaBackend({ transactions: getTransactions(), goals: updated });
    }
  };

  const handleDeleteGoal = (id) => {
    if (window.confirm('Delete this financial goal?')) {
      const updated = deleteGoal(id);
      setGoals(updated);
      if (goalDetailModalState.goal?.id === id) {
        setGoalDetailModalState({ isOpen: false, goal: null });
      }
      showToast('Goal deleted.', 'info');
      if (isOnline) {
        syncWithJavaBackend({ transactions: getTransactions(), goals: updated });
      }
    }
  };

  const handleApplyDeposit = (goalId, deltaAmount, meta = {}) => {
    const { updated, completedJustNow } = updateGoalAmount(goalId, deltaAmount, meta);
    setGoals(updated);
    setDepositModalState({ isOpen: false, goal: null });

    const updatedGoal = updated.find(g => g.id === goalId);
    if (updatedGoal) {
      setGoalDetailModalState(prev => prev.isOpen && prev.goal?.id === goalId ? { isOpen: true, goal: updatedGoal } : prev);
    }

    if (completedJustNow) {
      triggerConfetti();
      showToast('🎉 Congratulations! You achieved your financial goal!', 'success');
    } else {
      showToast(deltaAmount > 0 ? 'Deposit added to goal!' : 'Funds withdrawn from goal.', 'success');
    }

    if (isOnline) {
      syncWithJavaBackend({ transactions: getTransactions(), goals: updated });
    }
  };

  const handleDeleteGoalTransaction = (goalId, txId) => {
    const { updated, goal: updatedGoal } = deleteGoalTransaction(goalId, txId);
    setGoals(updated);
    if (updatedGoal) {
      setGoalDetailModalState(prev => prev.isOpen && prev.goal?.id === goalId ? { isOpen: true, goal: updatedGoal } : prev);
    }
    showToast('Transaction removed from goal.', 'info');
    if (isOnline) {
      syncWithJavaBackend({ transactions: getTransactions(), goals: updated });
    }
  };

  // Shared Todos State across App, TopHeader NotificationDropdown, and Dashboard
  const [todos, setTodos] = useState(() => getDailyTodos());

  const handleToggleTodo = useCallback((id) => {
    setTodos(prev => {
      let isDone = false;
      const updated = prev.map(t => {
        if (t.id === id) {
          isDone = !t.completed;
          return { ...t, completed: !t.completed };
        }
        return t;
      });
      saveDailyTodos(updated);
      showToast(isDone ? 'Task marked as completed! 🎉' : 'Task marked as pending.', 'info');
      return updated;
    });
  }, [showToast]);

  const handleAddTodo = useCallback((text, category) => {
    const newTodo = {
      id: 'todo-' + Date.now(),
      text: text.trim(),
      category: category || 'General',
      completed: false,
      due: 'Today'
    };
    setTodos(prev => {
      const updated = [newTodo, ...prev];
      saveDailyTodos(updated);
      return updated;
    });
    showToast('New daily task added.', 'success');
  }, [showToast]);

  const handleDeleteTodo = useCallback((id) => {
    setTodos(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveDailyTodos(updated);
      return updated;
    });
    showToast('Task removed.', 'info');
  }, [showToast]);

  const handleResetTodos = useCallback(() => {
    setTodos(DEFAULT_DAILY_TODOS);
    saveDailyTodos(DEFAULT_DAILY_TODOS);
    showToast('Default financial checklist restored.', 'info');
  }, [showToast]);

  // App Updates State (Notifications: Only App Updates & Unfinished Todos)
  const [appUpdates, setAppUpdates] = useState(() => getAppUpdates());

  const handleMarkUpdateRead = useCallback((updateId) => {
    const updated = markAppUpdateRead(updateId);
    setAppUpdates(updated);
  }, []);

  const handleMarkAllUpdatesRead = useCallback(() => {
    const updated = markAllAppUpdatesRead();
    setAppUpdates(updated);
    showToast('All app updates marked as read.', 'success');
  }, [showToast]);

  const handleDeleteUpdate = useCallback((updateId) => {
    const updated = deleteAppUpdate(updateId);
    setAppUpdates(updated);
    showToast('Notification removed.', 'info');
  }, [showToast]);

  const handleClearAllUpdates = useCallback(() => {
    const updated = clearAllAppUpdates();
    setAppUpdates(updated);
    showToast('All notifications cleared.', 'info');
  }, [showToast]);

  // Dynamic Country Currency Switcher
  const handleUpdateCurrency = useCallback((code, symbol) => {
    const updated = saveSettings({ currency: code, currencySymbol: symbol });
    setSettings(updated);
    showToast(`Currency changed to ${code} (${symbol})`, 'success');
  }, [showToast]);

  // Dynamically update document title and favicon when currency symbol changes
  useEffect(() => {
    const sym = settings.currencySymbol || '₹';
    document.title = `${sym} Finance Manager`;

    // Dynamically update browser favicon with active currency symbol
    const faviconEl = document.getElementById('app-favicon') || document.querySelector("link[rel*='icon']");
    if (faviconEl) {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>
        <rect width='32' height='32' rx='8' fill='#10b981'/>
        <text x='50%' y='68%' font-size='18' font-weight='bold' font-family='system-ui, sans-serif' fill='white' text-anchor='middle'>${sym}</text>
      </svg>`;
      faviconEl.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    }
  }, [settings.currencySymbol]);

  // Update Settings
  const handleUpdateSettings = (newSettings) => {
    const updated = saveSettings(newSettings);
    setSettings(updated);
    if (updated.theme) {
      document.documentElement.setAttribute('data-theme', updated.theme);
    }
    showToast('Settings saved.', 'success');
  };

  // Quick Theme Toggle (Sun/Moon in Header)
  const handleToggleTheme = () => {
    const nextTheme = settings?.theme === 'dark' ? 'light' : 'dark';
    const updated = saveSettings({ theme: nextTheme });
    setSettings(updated);
    document.documentElement.setAttribute('data-theme', nextTheme);
    showToast(`Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
  };

  // Reset Data
  const handleResetData = () => {
    resetAllData();
    reloadData();
    showToast('All local data cleared.', 'info');
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is actively typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        if (e.key === 'Escape') {
          setTxModalState({ isOpen: false, type: 'expense', editing: null });
          setGoalModalState({ isOpen: false, editing: null });
          setDepositModalState({ isOpen: false, goal: null });
          setIsBackupModalOpen(false);
          setIsHelpModalOpen(false);
        }
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setTxModalState({ isOpen: true, type: 'expense', editing: null });
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setGoalModalState({ isOpen: true, editing: null });
      } else if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handleOpenHelp('getting-started');
      } else if (e.key === 'Escape') {
        setTxModalState({ isOpen: false, type: 'expense', editing: null });
        setGoalModalState({ isOpen: false, editing: null });
        setDepositModalState({ isOpen: false, goal: null });
        setIsBackupModalOpen(false);
        setIsHelpModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // If user is not logged in, show the Login Form
  if (!currentUser) {
    return (
      <div className="app-container">
        <LoginForm 
          onLogin={handleLogin} 
          settings={settings} 
          onUpdateSettings={handleUpdateSettings} 
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <div className="fogo-app-shell">
      {/* 3-Line Hamburger Navigation Drawer (Opens in Front without shifting content) */}
      <Sidebar
        isOpen={isNavDrawerOpen}
        onClose={() => setIsNavDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenHelp={() => handleOpenHelp('getting-started')}
        onOpenTransactionModal={(type = 'expense') => setTxModalState({ isOpen: true, type, editing: null })}
        isOnline={isOnline}
        transactionCount={transactions.length}
        goalCount={goals.length}
      />

      {/* Grouped Settings Modal (Opens in Front centered with backdrop) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        isOnline={isOnline}
        syncStatus={syncStatus}
        onTriggerSync={triggerSync}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onResetData={handleResetData}
      />

      {/* Main Workspace (Top Header + Dynamic Tab Content - takes full width) */}
      <div className="fogo-main-wrapper">
        <TopHeader
          activeTab={activeTab}
          onOpenNavDrawer={() => setIsNavDrawerOpen(prev => !prev)}
          isNavDrawerOpen={isNavDrawerOpen}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenHelp={() => handleOpenHelp('getting-started')}
          onOpenTransactionModal={(type = 'expense') => setTxModalState({ isOpen: true, type, editing: null })}
          currentUser={currentUser}
          isOnline={isOnline}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          settings={settings}
          onUpdateCurrency={handleUpdateCurrency}
          todos={todos}
          appUpdates={appUpdates}
          onToggleTodo={handleToggleTodo}
          onMarkUpdateRead={handleMarkUpdateRead}
          onMarkAllUpdatesRead={handleMarkAllUpdatesRead}
          onDeleteUpdate={handleDeleteUpdate}
          onClearAllUpdates={handleClearAllUpdates}
          onNavigateTab={setActiveTab}
          onToggleTheme={handleToggleTheme}
        />

        {/* Dynamic Tab Panels */}
        <main className="fogo-content-area">
          {activeTab === 'dashboard' && (
            <Dashboard
              transactions={transactions}
              goals={goals}
              settings={settings}
              onNavigateTab={setActiveTab}
              onOpenTransactionModal={(type = 'expense') => setTxModalState({ isOpen: true, type, editing: null })}
              onOpenDepositModal={(goal) => setDepositModalState({ isOpen: true, goal })}
              currentUser={currentUser}
              todos={todos}
              onToggleTodo={handleToggleTodo}
              onAddTodo={handleAddTodo}
              onDeleteTodo={handleDeleteTodo}
              onResetTodos={handleResetTodos}
              onOpenHelp={(tab) => handleOpenHelp(tab || 'revenue-chart')}
            />
          )}

          {activeTab === 'transactions' && (
            <DailyTransactions
              transactions={transactions}
              settings={settings}
              onOpenTransactionModal={(type = 'expense', tx = null) => setTxModalState({ isOpen: true, type, editing: tx })}
              onDeleteTransaction={handleDeleteTransaction}
              onDuplicateTransaction={handleDuplicateTransaction}
            />
          )}

          {activeTab === 'goals' && (
            <FinancialGoals
              goals={goals}
              settings={settings}
              onOpenGoalDetail={(goal) => setGoalDetailModalState({ isOpen: true, goal })}
              onOpenGoalModal={(goal = null) => setGoalModalState({ isOpen: true, editing: goal })}
              onOpenDepositModal={(goal) => setDepositModalState({ isOpen: true, goal })}
              onDeleteGoal={handleDeleteGoal}
            />
          )}

          {activeTab === 'analytics' && (
            <Analytics
              transactions={transactions}
              goals={goals}
              settings={settings}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={txModalState.isOpen}
        initialType={txModalState.type}
        editingTransaction={txModalState.editing}
        settings={settings}
        onClose={() => setTxModalState({ isOpen: false, type: 'expense', editing: null })}
        onSave={handleSaveTransaction}
      />

      <GoalModal
        isOpen={goalModalState.isOpen}
        editingGoal={goalModalState.editing}
        settings={settings}
        onClose={() => setGoalModalState({ isOpen: false, editing: null })}
        onSave={handleSaveGoal}
      />

      <GoalDepositModal
        isOpen={depositModalState.isOpen}
        goal={depositModalState.goal}
        settings={settings}
        onClose={() => setDepositModalState({ isOpen: false, goal: null })}
        onApplyDeposit={handleApplyDeposit}
        onViewFullHistory={(goal) => {
          setDepositModalState({ isOpen: false, goal: null });
          setGoalDetailModalState({ isOpen: true, goal });
        }}
      />

      <GoalDetailModal
        isOpen={goalDetailModalState.isOpen}
        goal={goals.find(g => g.id === goalDetailModalState.goal?.id) || goalDetailModalState.goal}
        settings={settings}
        onClose={() => setGoalDetailModalState({ isOpen: false, goal: null })}
        onEditGoal={(goal) => setGoalModalState({ isOpen: true, editing: goal })}
        onDeleteGoal={handleDeleteGoal}
        onApplyDeposit={handleApplyDeposit}
        onDeleteGoalTransaction={handleDeleteGoalTransaction}
        showToast={showToast}
      />

      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onReloadData={reloadData}
        onShowToast={showToast}
        onResetData={handleResetData}
        onLoadDemo={reloadData}
      />

      {/* Comprehensive Help & Knowledge Base Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        initialTab={helpInitialTab}
        onClose={() => setIsHelpModalOpen(false)}
        isOnline={isOnline}
        onOpenTransactionModal={(type = 'expense') => setTxModalState({ isOpen: true, type, editing: null })}
        onOpenGoalModal={(goal = null) => setGoalModalState({ isOpen: true, editing: goal })}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onShowToast={showToast}
        settings={settings}
        stats={{
          transactionCount: transactions.length,
          goalCount: goals.length,
          todoCount: todos.length
        }}
      />

      {/* Floating Action Button at Left Side Bottom ("new entry button are lift side bottom") */}
      <button 
        type="button"
        className="floating-new-entry-btn left-bottom"
        onClick={() => setTxModalState({ isOpen: true, type: 'expense', editing: null })}
        title="Add New Daily Transaction (Key: N)"
        aria-label="Add New Transaction"
      >
        <Plus size={20} className="floating-btn-icon" />
        <span className="floating-btn-text">New Entry</span>
      </button>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
