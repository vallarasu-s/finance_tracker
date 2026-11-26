import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Goals from './pages/Goals';
import Reports from './pages/Reports';
import Investing from './pages/Investing';
import Login from './pages/Login';
import Register from './pages/Register';
import TransactionModal from './components/TransactionModal';
import GoalModal from './components/GoalModal';
import GoalDepositModal from './components/GoalDepositModal';
import DataBackupModal from './components/DataBackupModal';
import ToastContainer from './components/ToastContainer';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import GoalDetailModal from './components/GoalDetailModal';
import ConfirmModal from './components/ConfirmModal';
import { useAuth } from './context/AuthContext';
import { useTabSwipe } from './hooks/useTabSwipe';
import { useTheme } from './hooks/useTheme';

import {
  getTransactions,
  saveTransaction,
  deleteTransaction,
  getGoals,
  saveGoal,
  deleteGoal,
  updateGoalAmount,
  deleteGoalTransaction,
  getInvestments,
  saveInvestment,
  deleteInvestment,
  saveInvestments,
  getSettings,
  saveSettings,
  resetAllData,
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

import {
  checkBackendHealth,
  syncWithJavaBackend,
  fetchAllCloudData,
  saveTransactionsToCloud,
  deleteTransactionFromCloud,
  saveGoalsToCloud,
  deleteGoalFromCloud,
  saveInvestmentsToCloud,
  deleteInvestmentFromCloud,
  saveUserInformation,
  saveSettingsToCloud
} from './services/api';
import { triggerConfetti } from './services/confetti';
import {
  initNavigation,
  pushTabNavigation,
  pushModalNavigation,
  popModalNavigation
} from './services/navigation';

import { Plus, LayoutDashboard, CreditCard, BarChart2, Target, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

export default function App() {
  // Navigation State - Default to 'dashboard' (FOGO Overview)
  const [activeTab, setActiveTab] = useState('dashboard');
  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // User Auth State (from AuthContext)
  const { currentUser, setCurrentUser, logout } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  // Toasts (declared early so they are accessible by navigation and login handlers)
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

  const handleLogin = (user) => {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name}!`, 'success');
    if (isOnline) {
      saveUserInformation(user);
    }
  };

  const handleLogout = () => {
    logout();
    setAuthMode('login');
    showToast('Logged out of Finance Tracker.', 'info');
  };

  // Data State
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [settings, setSettings] = useState(getSettings());

  // Backend Sync State
  const [isOnline, setIsOnline] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'

  // Modals
  const [txModalState, setTxModalState] = useState({ isOpen: false, type: 'expense', editing: null });
  const [goalModalState, setGoalModalState] = useState({ isOpen: false, editing: null });
  const [depositModalState, setDepositModalState] = useState({ isOpen: false, goal: null });
  const [goalDetailModalState, setGoalDetailModalState] = useState({ isOpen: false, goal: null });
  const [isInvestingAddOpen, setIsInvestingAddOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [helpInitialTab, setHelpInitialTab] = useState('getting-started');

  // Modal Navigation Handlers (Hooked into native browser & mobile back history)
  const openTxModal = useCallback((type = 'expense', editing = null) => {
    setTxModalState({ isOpen: true, type, editing });
    pushModalNavigation('transaction_modal', () => {
      setTxModalState({ isOpen: false, type: 'expense', editing: null });
    });
  }, []);

  const closeTxModal = useCallback(() => {
    setTxModalState({ isOpen: false, type: 'expense', editing: null });
    popModalNavigation('transaction_modal');
  }, []);

  const openGoalModal = useCallback((editing = null) => {
    setGoalModalState({ isOpen: true, editing });
    pushModalNavigation('goal_modal', () => {
      setGoalModalState({ isOpen: false, editing: null });
    });
  }, []);

  const closeGoalModal = useCallback(() => {
    setGoalModalState({ isOpen: false, editing: null });
    popModalNavigation('goal_modal');
  }, []);

  const openDepositModal = useCallback((goal) => {
    setDepositModalState({ isOpen: true, goal });
    pushModalNavigation('deposit_modal', () => {
      setDepositModalState({ isOpen: false, goal: null });
    });
  }, []);

  const closeDepositModal = useCallback(() => {
    setDepositModalState({ isOpen: false, goal: null });
    popModalNavigation('deposit_modal');
  }, []);

  const openGoalDetailModal = useCallback((goal) => {
    setGoalDetailModalState({ isOpen: true, goal });
    pushModalNavigation('goal_detail_modal', () => {
      setGoalDetailModalState({ isOpen: false, goal: null });
    });
  }, []);

  const closeGoalDetailModal = useCallback(() => {
    setGoalDetailModalState({ isOpen: false, goal: null });
    popModalNavigation('goal_detail_modal');
  }, []);

  const openBackupModal = useCallback(() => {
    setIsBackupModalOpen(true);
    pushModalNavigation('backup_modal', () => {
      setIsBackupModalOpen(false);
    });
  }, []);

  const closeBackupModal = useCallback(() => {
    setIsBackupModalOpen(false);
    popModalNavigation('backup_modal');
  }, []);

  const openHelpModal = useCallback((tab = 'getting-started') => {
    setHelpInitialTab(tab);
    setIsHelpModalOpen(true);
    pushModalNavigation('help_modal', () => {
      setIsHelpModalOpen(false);
    });
  }, []);

  const closeHelpModal = useCallback(() => {
    setIsHelpModalOpen(false);
    popModalNavigation('help_modal');
  }, []);

  // Custom Confirmation Modal state for smooth, unblocked deletions
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
    onConfirm: null,
  });

  const closeConfirmModal = useCallback(() => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    popModalNavigation('confirm_modal');
  }, []);

  const openSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(true);
    pushModalNavigation('settings_modal', () => {
      setIsSettingsModalOpen(false);
    });
  }, []);

  const closeSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(false);
    popModalNavigation('settings_modal');
  }, []);

  const openNavDrawer = useCallback(() => {
    setIsNavDrawerOpen(true);
    pushModalNavigation('nav_drawer', () => {
      setIsNavDrawerOpen(false);
    });
  }, []);

  const closeNavDrawer = useCallback(() => {
    setIsNavDrawerOpen(false);
    popModalNavigation('nav_drawer');
  }, []);

  const toggleNavDrawer = useCallback(() => {
    if (isNavDrawerOpen) {
      closeNavDrawer();
    } else {
      openNavDrawer();
    }
  }, [isNavDrawerOpen, closeNavDrawer, openNavDrawer]);

  // Primary Tabs Navigation Order
  const tabOrder = useMemo(() => ['dashboard', 'transactions', 'analytics', 'goals', 'investing'], []);
  const [slideDirection, setSlideDirection] = useState('forward'); // 'forward' | 'backward'
  const tabsNavRef = useRef(null);
  const contentAreaRef = useRef(null);
  const isProgrammaticScroll = useRef(false);

  // Switch tabs with direction awareness, history registration, and subtle mobile haptic feedback
  const handleTabSwitch = useCallback((newTabId, isFromHistory = false) => {
    if (newTabId === activeTab) return;
    const oldIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(newTabId);
    if (newIndex !== -1 && oldIndex !== -1) {
      setSlideDirection(newIndex >= oldIndex ? 'forward' : 'backward');
    }
    if (!isFromHistory) {
      pushTabNavigation(newTabId, activeTab);
    }
    setActiveTab(newTabId);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(10);
      } catch {
        // ignore
      }
    }
  }, [activeTab, tabOrder]);

  // Initialize navigation & back-history manager on mount
  useEffect(() => {
    initNavigation({
      onTabChange: (newTabId, direction) => {
        setSlideDirection(direction || 'backward');
        setActiveTab(newTabId);
      },
      showToast,
      getActiveTab: () => activeTabRef.current
    });
  }, [showToast]);

  const goToNextTab = useCallback(() => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex !== -1 && currentIndex < tabOrder.length - 1) {
      handleTabSwitch(tabOrder[currentIndex + 1]);
    }
  }, [activeTab, tabOrder, handleTabSwitch]);

  const goToPrevTab = useCallback(() => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      handleTabSwitch(tabOrder[currentIndex - 1]);
    }
  }, [activeTab, tabOrder, handleTabSwitch]);

  const handleTabsKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNextTab();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrevTab();
    }
  };

  // Auto-scroll active tab into view in the top tab bar whenever activeTab changes
  useEffect(() => {
    if (!tabsNavRef.current) return;
    const activeBtn = tabsNavRef.current.querySelector(`.fogo-main-nav-tab-btn[data-tab-id="${activeTab}"]`);
    if (activeBtn) {
      isProgrammaticScroll.current = true;
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
      const timer = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // When user manually scrolls/drags the tabs nav bar horizontally on mobile, sync active tab on scroll end
  useEffect(() => {
    const tabsNav = tabsNavRef.current;
    if (!tabsNav) return;

    let scrollTimeout = null;
    let isUserInteracting = false;

    const onNavTouchStart = () => {
      isUserInteracting = true;
    };

    const onNavTouchEnd = () => {
      setTimeout(() => {
        isUserInteracting = false;
      }, 350);
    };

    const onNavScroll = () => {
      if (isProgrammaticScroll.current || !isUserInteracting) return;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (!tabsNav || isProgrammaticScroll.current) return;

        const navRect = tabsNav.getBoundingClientRect();
        const navCenter = navRect.left + navRect.width / 2;

        const buttons = Array.from(tabsNav.querySelectorAll('.fogo-main-nav-tab-btn'));
        let closestTabId = null;
        let minDistance = Infinity;

        buttons.forEach((btn) => {
          const btnRect = btn.getBoundingClientRect();
          const btnCenter = btnRect.left + btnRect.width / 2;
          const dist = Math.abs(btnCenter - navCenter);
          if (dist < minDistance) {
            minDistance = dist;
            closestTabId = btn.getAttribute('data-tab-id');
          }
        });

        if (closestTabId && closestTabId !== activeTab) {
          handleTabSwitch(closestTabId);
        }
      }, 150);
    };

    tabsNav.addEventListener('touchstart', onNavTouchStart, { passive: true });
    tabsNav.addEventListener('touchend', onNavTouchEnd, { passive: true });
    tabsNav.addEventListener('scroll', onNavScroll, { passive: true });

    return () => {
      clearTimeout(scrollTimeout);
      tabsNav.removeEventListener('touchstart', onNavTouchStart);
      tabsNav.removeEventListener('touchend', onNavTouchEnd);
      tabsNav.removeEventListener('scroll', onNavScroll);
    };
  }, [activeTab, handleTabSwitch]);

  const isAnyModalOpen =
    txModalState.isOpen ||
    goalModalState.isOpen ||
    depositModalState.isOpen ||
    goalDetailModalState.isOpen ||
    isBackupModalOpen ||
    isHelpModalOpen ||
    isSettingsModalOpen ||
    isNavDrawerOpen;

  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  } = useTabSwipe({
    contentAreaRef,
    isModalOpen: isAnyModalOpen,
    onNextTab: goToNextTab,
    onPrevTab: goToPrevTab,
  });

  // Load initial local data scoped to current user
  const reloadData = useCallback(() => {
    const tx = getTransactions(currentUser?.id);
    const g = getGoals(currentUser?.id);
    const inv = getInvestments(currentUser?.id);
    const s = getSettings();
    const t = getDailyTodos(currentUser?.id);
    setTransactions(tx);
    setGoals(g);
    setInvestments(inv);
    setSettings(s);
    setTodos(t);
    document.documentElement.setAttribute('data-theme', s.theme || 'dark');
  }, [currentUser?.id]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Cloud Data Loader (Initial fetch when Java Backend & MongoDB Atlas are reachable)
  const hasLoadedCloudRef = useRef(false);
  const loadCloudData = useCallback(async () => {
    try {
      const data = await fetchAllCloudData();
      if (data && data.success) {
        hasLoadedCloudRef.current = true;
        if (Array.isArray(data.transactions) && data.transactions.length > 0) {
          setTransactions(data.transactions);
          try { localStorage.setItem('zt_finance_transactions_v1', JSON.stringify(data.transactions)); } catch { }
        }
        if (Array.isArray(data.goals) && data.goals.length > 0) {
          setGoals(data.goals);
          try { localStorage.setItem('zt_finance_goals_v1', JSON.stringify(data.goals)); } catch { }
        }
        if (Array.isArray(data.investments) && data.investments.length > 0) {
          setInvestments(data.investments);
          try { localStorage.setItem('zt_finance_investments_v1', JSON.stringify(data.investments)); } catch { }
        }
        if (data.settings && typeof data.settings === 'object' && Object.keys(data.settings).length > 0) {
          setSettings(prev => ({ ...prev, ...data.settings }));
          try { localStorage.setItem('zt_finance_settings_v1', JSON.stringify(data.settings)); } catch { }
        }
        if (data.user && typeof data.user === 'object' && (data.user.name || data.user.email)) {
          setCurrentUser(data.user);
          try { localStorage.setItem('ft_current_user_v1', JSON.stringify(data.user)); } catch { }
        }
        if (data.cloudSynced) {
          showToast('☁️ Synchronized latest data with MongoDB Atlas & Java Backend', 'success');
        }
      }
    } catch (err) {
      console.warn('Initial cloud data fetch:', err);
    }
  }, [showToast, setCurrentUser]);

  // Network & Java Backend Health Check
  const checkHealth = useCallback(async () => {
    const res = await checkBackendHealth();
    setIsOnline(res.online);
    if (res.online && !hasLoadedCloudRef.current) {
      loadCloudData();
    }
    return res.online;
  }, [loadCloudData]);

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

  // Sync Handler (Reads & Writes all entities to MongoDB Atlas & Java backend)
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
        investments: getInvestments(),
        user: currentUser,
        settings: getSettings(),
        lastSyncTimestamp: Date.now(),
      };

      const res = await syncWithJavaBackend(payload);
      if (res.success) {
        setSyncStatus('synced');
        // Update frontend state with authoritative records returned from cloud
        if (Array.isArray(res.transactions)) {
          setTransactions(res.transactions);
          try { localStorage.setItem('zt_finance_transactions_v1', JSON.stringify(res.transactions)); } catch { }
        }
        if (Array.isArray(res.goals)) {
          setGoals(res.goals);
          try { localStorage.setItem('zt_finance_goals_v1', JSON.stringify(res.goals)); } catch { }
        }
        if (Array.isArray(res.investments)) {
          setInvestments(res.investments);
          try { localStorage.setItem('zt_finance_investments_v1', JSON.stringify(res.investments)); } catch { }
        }
        if (res.settings && typeof res.settings === 'object' && Object.keys(res.settings).length > 0) {
          setSettings(prev => ({ ...prev, ...res.settings }));
          try { localStorage.setItem('zt_finance_settings_v1', JSON.stringify(res.settings)); } catch { }
        }
        if (res.user && typeof res.user === 'object' && Object.keys(res.user).length > 0) {
          setCurrentUser(res.user);
          try { localStorage.setItem('ft_current_user_v1', JSON.stringify(res.user)); } catch { }
        }

        if (res.cloudSynced) {
          showToast('☁️ Synced successfully with MongoDB Atlas & Java Backend!', 'success');
        } else {
          showToast('Synced successfully with Java Backend (Local storage)', 'success');
        }
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

  // Transaction CRUD handlers (Local Read/Write + MongoDB Atlas Cloud Write)
  const handleSaveTransaction = (transactionData) => {
    const updated = saveTransaction(transactionData);
    setTransactions(updated);
    closeTxModal();
    showToast(
      transactionData.id ? 'Transaction updated.' : `${transactionData.type === 'income' ? 'Income' : 'Expense'} recorded!`,
      'success'
    );
    // Background cloud write if online
    if (isOnline) {
      saveTransactionsToCloud(updated);
    }
  };

  const handleDeleteTransaction = (id) => {
    if (window.confirm('Delete this transaction?')) {
      const updated = deleteTransaction(id);
      setTransactions(updated);
      showToast('Transaction deleted.', 'info');
      if (isOnline) {
        deleteTransactionFromCloud(id);
        saveTransactionsToCloud(updated);
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
    if (isOnline) {
      saveTransactionsToCloud(updated);
    }
  };

  // Goal CRUD handlers (Local Read/Write + MongoDB Atlas Cloud Write)
  const handleSaveGoal = (goalData) => {
    const updated = saveGoal(goalData);
    setGoals(updated);
    closeGoalModal();
    showToast(goalData.id ? 'Goal updated.' : 'New financial goal set!', 'success');

    if (goalData.currentAmount >= goalData.targetAmount) {
      triggerConfetti();
    }

    if (isOnline) {
      saveGoalsToCloud(updated);
    }
  };

  const handleDeleteGoal = useCallback((goalOrId) => {
    const goalId = typeof goalOrId === 'object' && goalOrId !== null ? goalOrId.id : goalOrId;
    const targetGoal = goals.find(g => String(g.id) === String(goalId)) || (typeof goalOrId === 'object' ? goalOrId : null);
    const goalTitle = targetGoal?.title ? `"${targetGoal.title}"` : 'this financial goal';

    setConfirmModal({
      isOpen: true,
      title: 'Delete Financial Goal',
      message: `Are you sure you want to delete ${goalTitle}? All savings history and transaction logs for this goal will be permanently removed.`,
      confirmText: 'Delete Goal',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        const updated = deleteGoal(goalId, currentUser?.id);
        setGoals(updated);
        if (goalDetailModalState.goal && String(goalDetailModalState.goal.id) === String(goalId)) {
          closeGoalDetailModal();
        }
        showToast('Goal deleted successfully.', 'info');
        if (isOnline) {
          deleteGoalFromCloud(goalId);
          saveGoalsToCloud(updated);
        }
        closeConfirmModal();
      }
    });

    pushModalNavigation('confirm_modal', () => {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    });
  }, [goals, currentUser, goalDetailModalState, closeGoalDetailModal, closeConfirmModal, isOnline, showToast]);

  const handleApplyDeposit = (goalId, deltaAmount, meta = {}) => {
    const { updated, completedJustNow } = updateGoalAmount(goalId, deltaAmount, meta);
    setGoals(updated);
    closeDepositModal();

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
      saveGoalsToCloud(updated);
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
      saveGoalsToCloud(updated);
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

  // Investment CRUD handlers (Local Read/Write + MongoDB Atlas Cloud Write)
  const handleAddInvestment = useCallback((investmentData) => {
    const updated = saveInvestment(investmentData, currentUser?.id);
    setInvestments(updated);
    showToast(investmentData.id ? 'Investment asset updated!' : 'New investment asset added!', 'success');
    if (isOnline) {
      saveInvestmentsToCloud(updated);
    }
  }, [currentUser?.id, isOnline, showToast]);

  const handleUpdateInvestment = useCallback((investmentData) => {
    const updated = saveInvestment(investmentData, currentUser?.id);
    setInvestments(updated);
    showToast('Investment asset updated successfully!', 'success');
    if (isOnline) {
      saveInvestmentsToCloud(updated);
    }
  }, [currentUser?.id, isOnline, showToast]);

  const handleDeleteInvestment = useCallback((id) => {
    const updated = deleteInvestment(id, currentUser?.id);
    setInvestments(updated);
    showToast('Investment asset removed from portfolio.', 'info');
    if (isOnline) {
      deleteInvestmentFromCloud(id);
      saveInvestmentsToCloud(updated);
    }
  }, [currentUser?.id, isOnline, showToast]);

  // Dynamic Country Currency Switcher
  const handleUpdateCurrency = useCallback((code, symbol) => {
    const updated = saveSettings({ currency: code, currencySymbol: symbol });
    setSettings(updated);
    showToast(`Currency changed to ${code} (${symbol})`, 'success');
    if (isOnline) {
      saveSettingsToCloud(updated);
    }
  }, [showToast, isOnline]);

  // Synchronize theme, document title, and dynamic currency favicon
  useTheme(settings);

  // Update Settings
  const handleUpdateSettings = (newSettings) => {
    const updated = saveSettings(newSettings);
    setSettings(updated);
    if (updated.theme) {
      document.documentElement.setAttribute('data-theme', updated.theme);
    }
    showToast('Settings saved.', 'success');
    if (isOnline) {
      saveSettingsToCloud(updated);
    }
  };

  // Quick Theme Toggle (Sun/Moon in Header)
  const handleToggleTheme = () => {
    const nextTheme = settings?.theme === 'dark' ? 'light' : 'dark';
    const updated = saveSettings({ theme: nextTheme });
    setSettings(updated);
    document.documentElement.setAttribute('data-theme', nextTheme);
    showToast(`Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
    if (isOnline) {
      saveSettingsToCloud(updated);
    }
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
        if (activeTab === 'investing') {
          setIsInvestingAddOpen(true);
        } else {
          openTxModal('expense', null);
        }
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        openGoalModal(null);
      } else if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handleOpenHelp('getting-started');
      } else if (e.key === 'Escape') {
        closeTxModal();
        closeGoalModal();
        closeDepositModal();
        closeBackupModal();
        closeHelpModal();
        closeConfirmModal();
        setIsInvestingAddOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, openTxModal, openGoalModal, closeTxModal, closeGoalModal, closeDepositModal, closeBackupModal, closeHelpModal, closeConfirmModal]);

  // If user is not logged in, show Login or Register page
  if (!currentUser) {
    const AuthPage = authMode === 'register' ? Register : Login;
    return (
      <div className="app-container">
        <AuthPage
          onLogin={handleLogin}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onSwitchMode={setAuthMode}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // Top Primary Navigation Tabs (Matches user marked area)
  const mainNavTabs = [
    {
      id: 'dashboard',
      label: 'Financial Tracker',
      shortLabel: 'Tracker',
      icon: <LayoutDashboard size={16} />
    },
    {
      id: 'transactions',
      label: 'Transactions Tracker',
      shortLabel: 'Transactions',
      icon: <CreditCard size={16} />,
      badge: transactions.length > 0 ? transactions.length : null
    },
    {
      id: 'analytics',
      label: 'Analytics & Spending Trends',
      shortLabel: 'Analytics',
      icon: <BarChart2 size={16} />
    },
    {
      id: 'goals',
      label: 'Financial Goals & Services',
      shortLabel: 'Goals',
      icon: <Target size={16} />,
      badge: goals.length > 0 ? goals.length : null
    },
    {
      id: 'investing',
      label: 'Investing Tracker',
      shortLabel: 'Investing',
      icon: <TrendingUp size={16} />,
      badge: investments.length > 0 ? investments.length : null
    }
  ];

  return (
    <div className="fogo-app-shell">
      {/* 3-Line Hamburger Navigation Drawer (Opens in Front without shifting content) */}
      <Sidebar
        isOpen={isNavDrawerOpen}
        onClose={closeNavDrawer}
        activeTab={activeTab}
        onSelectTab={handleTabSwitch}
        onOpenSettings={openSettingsModal}
        onOpenHelp={() => openHelpModal('getting-started')}
        onOpenTransactionModal={(type = 'expense') => openTxModal(type, null)}
        isOnline={isOnline}
        transactionCount={transactions.length}
        goalCount={goals.length}
        investmentCount={investments.length}
      />

      {/* Grouped Settings Modal (Opens in Front centered with backdrop) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={closeSettingsModal}
        settings={settings}
        transactions={transactions}
        onUpdateSettings={handleUpdateSettings}
        isOnline={isOnline}
        syncStatus={syncStatus}
        onTriggerSync={triggerSync}
        onOpenBackupModal={openBackupModal}
        currentUser={currentUser}
        onLogout={handleLogout}
        onResetData={handleResetData}
      />

      {/* Main Workspace (Top Header + Dynamic Tab Content - takes full width) */}
      <div className="fogo-main-wrapper">
        <TopHeader
          activeTab={activeTab}
          onOpenNavDrawer={toggleNavDrawer}
          isNavDrawerOpen={isNavDrawerOpen}
          onOpenSettings={openSettingsModal}
          onOpenHelp={() => openHelpModal('getting-started')}
          onOpenTransactionModal={(type = 'expense') => openTxModal(type, null)}
          currentUser={currentUser}
          isOnline={isOnline}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          settings={settings}
          todos={todos}
          appUpdates={appUpdates}
          onToggleTodo={handleToggleTodo}
          onMarkUpdateRead={handleMarkUpdateRead}
          onMarkAllUpdatesRead={handleMarkAllUpdatesRead}
          onDeleteUpdate={handleDeleteUpdate}
          onClearAllUpdates={handleClearAllUpdates}
          onNavigateTab={handleTabSwitch}
          onToggleTheme={handleToggleTheme}
        />

        {/* Dynamic Tab Panels with Touch Swipe Support */}
        <main
          ref={contentAreaRef}
          className="fogo-content-area"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          {/* Primary Top Navigation Tabs Container (User Marked Header Bar) */}
          <div className="fogo-main-nav-container">
            <button
              type="button"
              className="fogo-nav-arrow-btn prev"
              onClick={goToPrevTab}
              disabled={tabOrder.indexOf(activeTab) <= 0}
              aria-label="Previous tab"
              title="Previous tab"
            >
              <ChevronLeft size={16} />
            </button>

            <nav
              ref={tabsNavRef}
              className="fogo-main-nav-tabs"
              aria-label="Primary Workspace Navigation"
              role="tablist"
              onKeyDown={handleTabsKeyDown}
            >
              {mainNavTabs.map((tab) => (
                <button
                  key={tab.id}
                  data-tab-id={tab.id}
                  type="button"
                  className={`fogo-main-nav-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabSwitch(tab.id)}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  title={`Switch to ${tab.label}`}
                >
                  <span className="main-nav-tab-icon">{tab.icon}</span>
                  <span className="main-nav-tab-label main-nav-tab-label-full">{tab.label}</span>
                  <span className="main-nav-tab-label-short">{tab.shortLabel || tab.label}</span>
                  {tab.badge !== null && tab.badge !== undefined && (
                    <span className={`main-nav-tab-badge ${activeTab === tab.id ? 'active' : ''}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <button
              type="button"
              className="fogo-nav-arrow-btn next"
              onClick={goToNextTab}
              disabled={tabOrder.indexOf(activeTab) >= tabOrder.length - 1}
              aria-label="Next tab"
              title="Next tab"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Mobile Swipe Pagination Indicator */}
          <div className="fogo-mobile-tab-indicator" aria-hidden="true">
            <div className="fogo-mobile-tab-dots">
              {mainNavTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`fogo-mobile-tab-dot ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabSwitch(tab.id)}
                  aria-label={`Go to ${tab.label}`}
                >
                  <span className="fogo-mobile-tab-dot-pill" />
                </button>
              ))}
            </div>
            <span className="fogo-mobile-swipe-text">
              ‹ Swipe to change view ›
            </span>
          </div>

          {/* Tab Content Panel with Directional Slide Transition */}
          <div
            key={activeTab}
            className={`fogo-tab-panel slide-${slideDirection}`}
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
          >
            {activeTab === 'dashboard' && (
              <Dashboard
                transactions={transactions}
                goals={goals}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onNavigateTab={handleTabSwitch}
                onOpenTransactionModal={(type = 'expense', tx = null) => openTxModal(type, tx)}
                onOpenDepositModal={(goal) => openDepositModal(goal)}
                currentUser={currentUser}
                todos={todos}
                onToggleTodo={handleToggleTodo}
                onAddTodo={handleAddTodo}
                onDeleteTodo={handleDeleteTodo}
                onResetTodos={handleResetTodos}
                onOpenHelp={(tab) => openHelpModal(tab || 'revenue-chart')}
                onDeleteTransaction={handleDeleteTransaction}
                onDuplicateTransaction={handleDuplicateTransaction}
              />
            )}

            {activeTab === 'transactions' && (
              <Transactions
                transactions={transactions}
                settings={settings}
                onOpenTransactionModal={(type = 'expense', tx = null) => openTxModal(type, tx)}
                onDeleteTransaction={handleDeleteTransaction}
                onDuplicateTransaction={handleDuplicateTransaction}
              />
            )}

            {activeTab === 'analytics' && (
              <Reports
                transactions={transactions}
                goals={goals}
                settings={settings}
                onOpenTransactionModal={(type = 'expense', tx = null) => openTxModal(type, tx)}
                onDeleteTransaction={handleDeleteTransaction}
                onDuplicateTransaction={handleDuplicateTransaction}
                onNavigateTab={handleTabSwitch}
              />
            )}

            {activeTab === 'goals' && (
              <Goals
                goals={goals}
                settings={settings}
                onOpenGoalDetail={(goal) => openGoalDetailModal(goal)}
                onOpenGoalModal={(goal = null) => openGoalModal(goal)}
                onOpenDepositModal={(goal) => openDepositModal(goal)}
                onDeleteGoal={handleDeleteGoal}
              />
            )}

            {activeTab === 'investing' && (
              <Investing
                investments={investments}
                settings={settings}
                onAddInvestment={handleAddInvestment}
                onUpdateInvestment={handleUpdateInvestment}
                onDeleteInvestment={handleDeleteInvestment}
                isExternalAddOpen={isInvestingAddOpen}
                onCloseExternalAdd={() => setIsInvestingAddOpen(false)}
              />
            )}
          </div>
        </main>
        <Footer isOnline={isOnline} onOpenHelp={() => openHelpModal('getting-started')} />
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={txModalState.isOpen}
        initialType={txModalState.type}
        editingTransaction={txModalState.editing}
        settings={settings}
        onClose={closeTxModal}
        onSave={handleSaveTransaction}
      />

      <GoalModal
        isOpen={goalModalState.isOpen}
        editingGoal={goalModalState.editing}
        settings={settings}
        onClose={closeGoalModal}
        onSave={handleSaveGoal}
      />

      <GoalDepositModal
        isOpen={depositModalState.isOpen}
        goal={depositModalState.goal}
        settings={settings}
        onClose={closeDepositModal}
        onApplyDeposit={handleApplyDeposit}
        onViewFullHistory={(goal) => {
          closeDepositModal();
          openGoalDetailModal(goal);
        }}
      />

      <GoalDetailModal
        isOpen={goalDetailModalState.isOpen}
        goal={goals.find(g => g.id === goalDetailModalState.goal?.id) || goalDetailModalState.goal}
        settings={settings}
        onClose={closeGoalDetailModal}
        onEditGoal={(goal) => openGoalModal(goal)}
        onDeleteGoal={handleDeleteGoal}
        onApplyDeposit={handleApplyDeposit}
        onDeleteGoalTransaction={handleDeleteGoalTransaction}
        showToast={showToast}
      />

      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={closeBackupModal}
        onReloadData={reloadData}
        onShowToast={showToast}
        onResetData={handleResetData}
        onLoadDemo={reloadData}
      />

      {/* Comprehensive Help & Knowledge Base Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        initialTab={helpInitialTab}
        onClose={closeHelpModal}
        isOnline={isOnline}
        onOpenTransactionModal={(type = 'expense') => openTxModal(type, null)}
        onOpenGoalModal={(goal = null) => openGoalModal(goal)}
        onOpenSettings={openSettingsModal}
        onOpenBackupModal={openBackupModal}
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
        onClick={() => {
          if (activeTab === 'investing') {
            setIsInvestingAddOpen(true);
          } else {
            openTxModal('expense', null);
          }
        }}
        title={activeTab === 'investing' ? "Add New Investment (Key: N)" : "Add New Daily Transaction (Key: N)"}
        aria-label={activeTab === 'investing' ? "Add New Investment" : "Add New Transaction"}
      >
        <Plus size={20} className="floating-btn-icon" />
        <span className="floating-btn-text">
          {activeTab === 'investing' ? 'Add Investment' : 'New Entry'}
        </span>
      </button>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onClose={closeConfirmModal}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
