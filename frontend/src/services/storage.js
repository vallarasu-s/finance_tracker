// Storage service providing offline-first local persistence with IndexedDB and localStorage mirror
import {
  CURRENCIES,
  POPULAR_CURRENCIES,
  MAX_TRANSACTION_AMOUNT,
  getCurrencyInfo,
  formatShortNumber,
  formatCurrency,
  formatCompactCurrency,
  parseShortAmount,
  formatTime12Hour,
  formatDate,
} from '../utils/formatCurrency';

export {
  CURRENCIES,
  POPULAR_CURRENCIES,
  MAX_TRANSACTION_AMOUNT,
  getCurrencyInfo,
  formatShortNumber,
  formatCurrency,
  formatCompactCurrency,
  parseShortAmount,
  formatTime12Hour,
  formatDate,
};

const STORAGE_KEYS = {
  TRANSACTIONS: 'zt_finance_transactions_v1',
  GOALS: 'zt_finance_goals_v1',
  INVESTMENTS: 'zt_finance_investments_v1',
  SETTINGS: 'zt_finance_settings_v1',
  PENDING_SYNC: 'zt_finance_pending_sync_v1',
  CURRENT_USER: 'ft_current_user_v1',
  USERS: 'ft_users_v1',
  TODOS: 'ft_daily_todos_v1',
  APP_UPDATES: 'ft_app_updates_v1',
};

export const DEFAULT_SETTINGS = {
  currency: 'USD',
  currencySymbol: '$',
  monthlyBudget: 3500,
  theme: 'dark',
  autoSync: true,
  // Shortform and number display preferences
  numberFormat: 'auto', // 'auto' (adapts to country currency) | 'indian' | 'international' | 'standard'
  compactNumbers: true, // Use shortforms (K, M, B, T or K, L, c) for large numbers on cards
  croreSymbol: 'c', // 'c' | 'Cr' (defaults to 'c' as requested)
  currencyDisplay: 'symbol', // 'symbol' ($) | 'code' (USD) | 'both' ($ USD)
};

export const CATEGORIES = {
  expense: [
    { id: 'food', name: 'Food', icon: '🍜', color: '#F97316' },
    { id: 'social', name: 'Social Life', icon: '🧑‍🤝‍🧑', color: '#EC4899' },
    { id: 'pets', name: 'Pets', icon: '🐶', color: '#B45309' },
    { id: 'transport', name: 'Transport', icon: '🚕', color: '#2563EB' },
    { id: 'culture', name: 'Culture', icon: '🖼️', color: '#6366F1' },
    { id: 'household', name: 'Household', icon: '🪑', color: '#0284C7' },
    { id: 'apparel', name: 'Apparel', icon: '🧥', color: '#DC2626' },
    { id: 'beauty', name: 'Beauty', icon: '💄', color: '#F43F5E' },
    { id: 'health', name: 'Health', icon: '🧘', color: '#0D9488' },
    { id: 'education', name: 'Education', icon: '📙', color: '#EAB308' },
    { id: 'gift', name: 'Gift', icon: '🎁', color: '#C026D3' },
    { id: 'other_exp', name: 'Other', icon: '📦', color: '#64748B' },
    // Retain legacy IDs for backward compatibility with existing transactions:
    { id: 'home_appliances', name: 'Home Appliances', icon: '🔌', color: '#0284C7' },
    { id: 'cooking_products', name: 'Cooking Products', icon: '🍳', color: '#DC2626' },
    { id: 'housing', name: 'Rent & Housing', icon: '🏠', color: '#1E3A8A' },
    { id: 'utilities', name: 'Bills & Utilities', icon: '⚡', color: '#D97706' },
    { id: 'shopping', name: 'Shopping & Gear', icon: '🛍️', color: '#BE185D' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#7C3AED' },
    { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#84CC16' },
  ],
  income: [
    { id: 'salary', name: 'Salary & Wages', icon: '💼', color: '#10B981' },
    { id: 'freelance', name: 'Freelance & Client', icon: '💻', color: '#06B6D4' },
    { id: 'investment', name: 'Investments & Dividends', icon: '📈', color: '#4338CA' },
    { id: 'bonus', name: 'Bonus & Incentives', icon: '🎁', color: '#FBBF24' },
    { id: 'rental', name: 'Rental Income', icon: '🏢', color: '#8B5CF6' },
    { id: 'other_inc', name: 'Other Income', icon: '💰', color: '#059669' },
  ]
};

export const MOBILE_KEYPAD_EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Food', icon: '🍜', color: '#F97316' },
  { id: 'social', name: 'Social Life', icon: '🧑‍🤝‍🧑', color: '#EC4899' },
  { id: 'pets', name: 'Pets', icon: '🐶', color: '#B45309' },
  { id: 'transport', name: 'Transport', icon: '🚕', color: '#2563EB' },
  { id: 'culture', name: 'Culture', icon: '🖼️', color: '#6366F1' },
  { id: 'household', name: 'Household', icon: '🪑', color: '#0284C7' },
  { id: 'apparel', name: 'Apparel', icon: '🧥', color: '#DC2626' },
  { id: 'beauty', name: 'Beauty', icon: '💄', color: '#F43F5E' },
  { id: 'health', name: 'Health', icon: '🧘', color: '#0D9488' },
  { id: 'education', name: 'Education', icon: '📙', color: '#EAB308' },
  { id: 'gift', name: 'Gift', icon: '🎁', color: '#C026D3' },
  { id: 'other_exp', name: 'Other', icon: '📦', color: '#64748B' },
];

export const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', icon: '💵', label: 'Cash' },
  { id: 'upi', name: 'UPI', icon: '⚡', label: 'UPI / QR' },
  { id: 'bank', name: 'Bank Transfer', icon: '🏦', label: 'Bank' },
  { id: 'card', name: 'Credit Card', icon: '💳', label: 'Card' },
];

export function getPaymentMethodInfo(methodId) {
  const normalized = (methodId || '').toLowerCase().trim();
  if (normalized === 'upi') return { id: 'upi', name: 'UPI', icon: '⚡', label: 'UPI / QR' };
  if (normalized === 'cash') return { id: 'cash', name: 'Cash', icon: '💵', label: 'Cash' };
  if (normalized === 'bank' || normalized === 'netbanking' || normalized === 'transfer' || normalized === 'bank transfer') {
    return { id: 'bank', name: 'Bank Transfer', icon: '🏦', label: 'Bank' };
  }
  if (normalized === 'card' || normalized === 'credit_card' || normalized === 'credit card' || normalized === 'debit_card') {
    return { id: 'card', name: 'Credit Card', icon: '💳', label: 'Card' };
  }
  if (normalized === 'wallet') return { id: 'wallet', name: 'Digital Wallet', icon: '📱', label: 'Wallet' };
  return { id: methodId || 'cash', name: methodId || 'Cash', icon: '💵', label: methodId || 'Cash' };
}

// Curated palette of diverse, vibrant hues ensuring unknown/custom categories never clash
const DIVERSE_CATEGORY_PALETTE = [
  '#8B5CF6', '#F97316', '#2563EB', '#10B981', '#EC4899',
  '#06B6D4', '#EAB308', '#84CC16', '#DC2626', '#0D9488',
  '#7C3AED', '#D97706', '#0284C7', '#BE185D', '#4338CA', '#059669'
];

// Fallback metadata for removed/legacy category IDs so historical records preserve icons and titles
export const LEGACY_FALLBACK_CATEGORIES = [
  { id: 'culture', name: 'Culture', icon: '🖼️', color: '#6366F1' },
  { id: 'household', name: 'Household', icon: '🪑', color: '#0284C7' },
  { id: 'apparel', name: 'Apparel', icon: '🧥', color: '#DC2626' },
  { id: 'home_appliances_cooking', name: 'Home Appliances & Cooking Products', icon: '🍳', color: '#0284C7' },
  { id: 'housing', name: 'Rent & Housing', icon: '🏠', color: '#1E3A8A' },
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#84CC16' },
];

export function getCategoryInfo(categoryId, type = null) {
  const allCats = [...(CATEGORIES.expense || []), ...(CATEGORIES.income || [])];
  const normalized = String(categoryId || '').toLowerCase().trim();
  
  // 1. Direct ID match
  let found = allCats.find(c => c.id === categoryId);
  if (found) return found;

  // 2. Case-insensitive or name match (e.g. "Rental Income", "transport", "salary")
  found = allCats.find(c => 
    c.id.toLowerCase() === normalized || 
    c.name.toLowerCase() === normalized ||
    c.id.replace(/[_-]/g, '') === normalized.replace(/[\s_-]/g, '')
  );
  if (found) return found;

  // 3. Fallback check for deprecated/legacy categories
  found = LEGACY_FALLBACK_CATEGORIES.find(c => 
    c.id === categoryId ||
    c.id.toLowerCase() === normalized ||
    c.name.toLowerCase() === normalized
  );
  if (found) return found;

  // 4. User custom categories in localStorage
  try {
    const custom = JSON.parse(localStorage.getItem('finance_user_custom_categories') || '[]');
    const customFound = custom.find(c => 
      c.id === categoryId || 
      c.id.toLowerCase() === normalized || 
      (c.name && c.name.toLowerCase() === normalized)
    );
    if (customFound) return customFound;
  } catch (e) {}

  // 5. Deterministic distinct color based on categoryId string hash
  // This guarantees that DIFFERENT categories ALWAYS receive DIFFERENT colors
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  const colorIndex = Math.abs(hash) % DIVERSE_CATEGORY_PALETTE.length;
  const distinctColor = DIVERSE_CATEGORY_PALETTE[colorIndex];

  return {
    id: categoryId || 'other',
    name: categoryId ? (categoryId.charAt(0).toUpperCase() + categoryId.slice(1).replace(/_/g, ' ')) : 'Other',
    icon: type === 'income' ? '💰' : '📦',
    color: distinctColor
  };
}

export const GOAL_ICONS = [
  { id: 'emergency', icon: '🛡️', label: 'Emergency Fund' },
  { id: 'car', icon: '🚗', label: 'Car / Vehicle' },
  { id: 'home', icon: '🏡', label: 'Home / Real Estate' },
  { id: 'travel', icon: '✈️', label: 'Vacation & Travel' },
  { id: 'tech', icon: '💻', label: 'Gadget / Tech' },
  { id: 'wedding', icon: '💍', label: 'Wedding' },
  { id: 'education', icon: '🎓', label: 'College / Degree' },
  { id: 'invest', icon: '💎', label: 'Retirement & Wealth' },
];

// Read from LocalStorage safely
export function getLocal(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultValue;
  }
}

// Write to LocalStorage safely
export function setLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

export const DEFAULT_USER_ID = 'ft_default_user';

export function getActiveUserId() {
  const current = getCurrentUser();
  return current?.id || DEFAULT_USER_ID;
}

export function getUserStorageKey(baseKey, userId) {
  const uid = userId || getActiveUserId();
  if (uid === DEFAULT_USER_ID) {
    return baseKey;
  }
  return `${baseKey}_${uid}`;
}

// Transactions API
export function getTransactions(userId) {
  const uid = userId || getActiveUserId();
  const key = getUserStorageKey(STORAGE_KEYS.TRANSACTIONS, uid);
  const txs = getLocal(key, null);

  let rawList = txs;
  // If this is the DEFAULT_USER (demo mode), seed demo transactions if null
  if (uid === DEFAULT_USER_ID) {
    if (!txs) {
      const demo = generateDemoTransactions();
      setLocal(key, demo);
      return demo;
    }
  } else {
    // For any registered or newly created user, initial amount is 0 (empty transactions list)
    if (!txs) {
      setLocal(key, []);
      return [];
    }
  }

  // Safety sanitization: check for overflowing numbers (e.g. 1e+235) or invalid amounts
  let hasSanitized = false;
  const sanitizedList = (rawList || []).map(item => {
    const num = Number(item.amount);
    if (!isFinite(num) || isNaN(num) || num > MAX_TRANSACTION_AMOUNT) {
      hasSanitized = true;
      // Clamp overflowed entries to 10 Crore (100,000,000)
      return { ...item, amount: 100000000 };
    }
    return item;
  });

  if (hasSanitized) {
    setLocal(key, sanitizedList);
  }
  return sanitizedList;
}

export function saveTransaction(transaction, userId) {
  const uid = userId || getActiveUserId();
  const key = getUserStorageKey(STORAGE_KEYS.TRANSACTIONS, uid);
  const list = getTransactions(uid);
  const now = new Date().toISOString();
  let updated;

  // Ensure amount is valid and within maximum boundary
  const parsedAmt = Number(transaction.amount) || 0;
  const safeAmt = Math.min(MAX_TRANSACTION_AMOUNT, Math.max(0, parsedAmt));
  const safeTransaction = { ...transaction, amount: safeAmt };

  if (transaction.id) {
    // Update existing
    updated = list.map(item => item.id === transaction.id ? { ...item, ...safeTransaction, updatedAt: now } : item);
  } else {
    // Create new
    const newTx = {
      ...safeTransaction,
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: now,
      updatedAt: now,
    };
    updated = [newTx, ...list];
  }

  setLocal(key, updated);
  return updated;
}

export function deleteTransaction(id, userId) {
  const uid = userId || getActiveUserId();
  const key = getUserStorageKey(STORAGE_KEYS.TRANSACTIONS, uid);
  const list = getTransactions(uid);
  const updated = list.filter(item => item.id !== id);
  setLocal(key, updated);
  return updated;
}

// Financial Goals API
export function getGoals(userId) {
  const uid = userId || getActiveUserId();
  const key = getUserStorageKey(STORAGE_KEYS.GOALS, uid);
  const goals = getLocal(key, null);

  if (uid === DEFAULT_USER_ID) {
    if (!goals) {
      const demo = generateDemoGoals();
      setLocal(key, demo);
      return demo;
    }
  } else {
    // For any registered or newly created user, start with empty goals list (initial amount is 0)
    if (!goals) {
      setLocal(key, []);
      return [];
    }
  }

  // Ensure goals have initialized history arrays and seed initial balance entry if currentAmount > 0 but history is empty
  let modified = false;
  const normalized = goals.map(g => {
    let history = Array.isArray(g.history) ? [...g.history] : [];
    const current = Number(g.currentAmount) || 0;
    if (history.length === 0 && current > 0) {
      history = [{
        id: 'init_' + g.id,
        amount: current,
        type: 'deposit',
        date: g.createdAt ? g.createdAt.split('T')[0] : '2026-01-01',
        time: '12:00',
        note: 'Initial savings / starting balance',
        createdAt: g.createdAt || new Date().toISOString(),
        isInitial: true,
      }];
      modified = true;
      return { ...g, history };
    }
    if (!Array.isArray(g.history)) {
      modified = true;
      return { ...g, history };
    }
    return g;
  });

  if (modified) {
    setLocal(key, normalized);
  }
  return normalized;
}

export function saveGoal(goal, userId) {
  const uid = userId || getActiveUserId();
  const key = getUserStorageKey(STORAGE_KEYS.GOALS, uid);
  const list = getGoals(uid);
  const now = new Date().toISOString();
  let updated;

  if (goal.id) {
    updated = list.map(item => {
      if (item.id === goal.id) {
        return {
          ...item,
          ...goal,
          history: item.history || [],
          updatedAt: now
        };
      }
      return item;
    });
  } else {
    const initAmt = Number(goal.currentAmount) || 0;
    const history = initAmt > 0 ? [{
      id: 'init_' + Date.now(),
      amount: initAmt,
      type: 'deposit',
      date: now.split('T')[0],
      time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
      note: 'Initial starting savings',
      createdAt: now,
      isInitial: true
    }] : [];

    const newGoal = {
      ...goal,
      id: 'goal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      currentAmount: initAmt,
      history,
      createdAt: now,
      updatedAt: now,
    };
    updated = [newGoal, ...list];
  }

  setLocal(key, updated);
  return updated;
}

export function deleteGoal(id, userId) {
  const uid = userId || getActiveUserId();
  const key = getUserStorageKey(STORAGE_KEYS.GOALS, uid);
  const list = getGoals(uid);
  const goalId = typeof id === 'object' && id !== null ? (id.id || id) : id;
  const updated = list.filter(item => String(item.id) !== String(goalId));
  setLocal(key, updated);
  return updated;
}

export function updateGoalAmount(id, deltaAmount, meta = {}, userId) {
  const uid = userId || getActiveUserId();
  const key = getUserStorageKey(STORAGE_KEYS.GOALS, uid);
  const list = getGoals(uid);
  const now = new Date().toISOString();
  let completedJustNow = false;

  const updated = list.map(g => {
    if (g.id === id) {
      const prevAmount = Number(g.currentAmount) || 0;
      const nextAmount = Math.max(0, prevAmount + deltaAmount);
      if (prevAmount < (Number(g.targetAmount) || 0) && nextAmount >= (Number(g.targetAmount) || 0)) {
        completedJustNow = true;
      }
      const historyEntry = {
        id: 'dep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        amount: Math.abs(deltaAmount),
        type: deltaAmount >= 0 ? 'deposit' : 'withdraw',
        date: meta.date || new Date().toISOString().split('T')[0],
        time: meta.time || `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
        note: meta.note || (deltaAmount >= 0 ? 'Deposit' : 'Withdrawal'),
        createdAt: now,
      };

      let existingHistory = Array.isArray(g.history) ? [...g.history] : [];
      // If history was empty but goal already had prevAmount, preserve initial balance entry
      if (existingHistory.length === 0 && prevAmount > 0) {
        existingHistory = [{
          id: 'init_' + g.id,
          amount: prevAmount,
          type: 'deposit',
          date: g.createdAt ? g.createdAt.split('T')[0] : '2026-01-01',
          time: '12:00',
          note: 'Initial savings / starting balance',
          createdAt: g.createdAt || now,
          isInitial: true,
        }];
      }

      return {
        ...g,
        currentAmount: nextAmount,
        lastActivityDate: meta.date || new Date().toISOString().split('T')[0],
        history: [historyEntry, ...existingHistory],
        updatedAt: now,
      };
    }
    return g;
  });

  setLocal(key, updated);
  return { updated, completedJustNow };
}

export function deleteGoalTransaction(goalId, transactionId, userId) {
  const uid = userId || getActiveUserId();
  const key = getUserStorageKey(STORAGE_KEYS.GOALS, uid);
  const list = getGoals(uid);
  const now = new Date().toISOString();
  let targetGoal = null;

  const updated = list.map(g => {
    if (g.id === goalId) {
      const history = Array.isArray(g.history) ? g.history : [];
      const txToDelete = history.find(t => t.id === transactionId);
      if (!txToDelete) return g;

      const remainingHistory = history.filter(t => t.id !== transactionId);
      let newAmount = Number(g.currentAmount) || 0;
      if (txToDelete.type === 'deposit') {
        newAmount = Math.max(0, newAmount - (Number(txToDelete.amount) || 0));
      } else if (txToDelete.type === 'withdraw') {
        newAmount = newAmount + (Number(txToDelete.amount) || 0);
      }

      targetGoal = {
        ...g,
        currentAmount: newAmount,
        history: remainingHistory,
        updatedAt: now,
      };
      return targetGoal;
    }
    return g;
  });

  setLocal(key, updated);
  return { updated, goal: targetGoal };
}

export function exportGoalHistoryAsCSV(goal, symbol = '$') {
  if (!goal || !Array.isArray(goal.history) || goal.history.length === 0) return false;
  const headers = ['Transaction ID', 'Type', `Amount (${symbol})`, 'Date', 'Time', 'Notes', 'Created At'];
  const rows = goal.history.map(t => [
    `"${t.id}"`,
    `"${t.type ? t.type.toUpperCase() : 'DEPOSIT'}"`,
    `"${t.amount}"`,
    `"${t.date}"`,
    `"${t.time || ''}"`,
    `"${(t.note || '').replace(/"/g, '""')}"`,
    `"${t.createdAt || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = (goal.title || 'goal').toLowerCase().replace(/[^a-z0-9]/g, '_');
  a.download = `${safeTitle}_transactions_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

// =============================================================================
// Investment & Portfolio Tracker API
// =============================================================================

export const INVESTMENT_CATEGORIES = [
  { id: 'mutual_funds', name: 'Mutual Funds (SIP)', icon: '🏦', color: '#10B981', desc: 'Direct & regular mutual funds with automatic SIP tracking' },
  { id: 'stocks', name: 'Stocks & ETFs', icon: '📈', color: '#3B82F6', desc: 'NSE/BSE equities, bluechip shares & index ETFs' },
  { id: 'fixed_deposits', name: 'Fixed Deposits (FD)', icon: '🏛️', color: '#06B6D4', desc: 'Bank, corporate & post office fixed/recurring deposits' },
  { id: 'govt_schemes', name: 'PPF & Govt Schemes', icon: '📜', color: '#8B5CF6', desc: 'Public Provident Fund, EPF, NPS & Sovereign small savings' },
  { id: 'gold', name: 'SGB & Gold Bullion', icon: '🥇', color: '#EAB308', desc: 'Sovereign Gold Bonds (2.5%), physical & digital gold' },
  { id: 'crypto', name: 'Crypto & Digital Assets', icon: '🪙', color: '#F59E0B', desc: 'Decentralized digital stores of value' },
  { id: 'real_estate', name: 'Real Estate & REITs', icon: '🏠', color: '#EC4899', desc: 'Commercial property trusts & REIT yields' },
];

export const DEFAULT_INVESTMENTS = [
  {
    id: 'inv_1',
    name: 'Parag Parikh Flexi Cap Fund - Direct Growth',
    symbol: 'PPFC-DIR',
    category: 'mutual_funds',
    units: 250,
    buyPrice: 62.40,
    currentPrice: 84.80,
    date: '2024-03-15',
    dividendYield: 0,
    investmentMode: 'Monthly SIP',
    notes: 'Long-term equity compounding via monthly SIP'
  },
  {
    id: 'inv_2',
    name: 'HDFC Bank Ltd',
    symbol: 'HDFCBANK.NS',
    category: 'stocks',
    units: 50,
    buyPrice: 1480.00,
    currentPrice: 1740.00,
    date: '2024-05-10',
    dividendYield: 1.15,
    investmentMode: 'Lumpsum',
    notes: 'Private banking sector leader holding'
  },
  {
    id: 'inv_3',
    name: 'SBI 1-Year Term Deposit (FD)',
    symbol: 'SBI-FD',
    category: 'fixed_deposits',
    units: 1,
    buyPrice: 100000.00,
    currentPrice: 107100.00,
    date: '2024-01-01',
    dividendYield: 7.10,
    interestRate: 7.10,
    investmentMode: 'Fixed Term',
    notes: 'Guaranteed 7.10% p.a. bank fixed deposit'
  },
  {
    id: 'inv_4',
    name: 'Public Provident Fund (PPF)',
    symbol: 'PPF-GOVT',
    category: 'govt_schemes',
    units: 1,
    buyPrice: 150000.00,
    currentPrice: 160650.00,
    date: '2024-04-01',
    dividendYield: 7.10,
    interestRate: 7.10,
    investmentMode: 'Govt Scheme',
    notes: '15-year tax-free sovereign compounding'
  },
  {
    id: 'inv_5',
    name: 'Sovereign Gold Bond 2023-24 Series III',
    symbol: 'SGB2023',
    category: 'gold',
    units: 15,
    buyPrice: 6199.00,
    currentPrice: 7850.00,
    date: '2023-12-18',
    dividendYield: 2.50,
    interestRate: 2.50,
    investmentMode: 'SGB',
    notes: '2.5% p.a. semi-annual payout + gold capital gains'
  },
  {
    id: 'inv_6',
    name: 'Tata Consultancy Services (TCS)',
    symbol: 'TCS.NS',
    category: 'stocks',
    units: 20,
    buyPrice: 3850.00,
    currentPrice: 4220.00,
    date: '2024-06-20',
    dividendYield: 1.35,
    investmentMode: 'Lumpsum',
    notes: 'IT export titan with high dividend yield'
  }
];

export function getInvestmentCategoryInfo(catId) {
  const normalized = String(catId || '').toLowerCase().trim();
  if (normalized === 'bonds') return INVESTMENT_CATEGORIES.find(c => c.id === 'fixed_deposits') || INVESTMENT_CATEGORIES[2];
  if (normalized === 'sgb' || normalized === 'sgb_gold') return INVESTMENT_CATEGORIES.find(c => c.id === 'gold') || INVESTMENT_CATEGORIES[4];
  if (normalized === 'ppf' || normalized === 'nps') return INVESTMENT_CATEGORIES.find(c => c.id === 'govt_schemes') || INVESTMENT_CATEGORIES[3];
  return INVESTMENT_CATEGORIES.find(c => c.id === catId) || INVESTMENT_CATEGORIES[0];
}

export function getInvestments(userId) {
  const uid = userId || getActiveUserId();
  const key = getUserStorageKey(STORAGE_KEYS.INVESTMENTS, uid);
  const items = getLocal(key, null);

  if (uid === DEFAULT_USER_ID) {
    if (!items) {
      setLocal(key, DEFAULT_INVESTMENTS);
      return DEFAULT_INVESTMENTS;
    }
  } else {
    if (!items) {
      setLocal(key, []);
      return [];
    }
  }

  return Array.isArray(items) ? items : [];
}

export function saveInvestment(investment, userId) {
  const uid = userId || getActiveUserId();
  const key = getUserStorageKey(STORAGE_KEYS.INVESTMENTS, uid);
  const list = getInvestments(uid);
  const now = new Date().toISOString();
  let updated;

  if (investment.id) {
    updated = list.map(item => {
      if (item.id === investment.id) {
        return {
          ...item,
          ...investment,
          updatedAt: now
        };
      }
      return item;
    });
  } else {
    const newInv = {
      ...investment,
      id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      createdAt: now,
      updatedAt: now
    };
    updated = [newInv, ...list];
  }

  setLocal(key, updated);
  return updated;
}

export function deleteInvestment(id, userId) {
  const uid = userId || getActiveUserId();
  const key = getUserStorageKey(STORAGE_KEYS.INVESTMENTS, uid);
  const list = getInvestments(uid);
  const updated = list.filter(item => item.id !== id);
  setLocal(key, updated);
  return updated;
}

export function saveInvestments(investments, userId) {
  const uid = userId || getActiveUserId();
  const key = getUserStorageKey(STORAGE_KEYS.INVESTMENTS, uid);
  const valid = Array.isArray(investments) ? investments : [];
  setLocal(key, valid);
  return valid;
}

// Settings API
export function getSettings() {
  const current = getLocal(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const merged = { ...DEFAULT_SETTINGS, ...current };
  // If settings had hardcoded 'indian' while currency is not South Asian (e.g. USD), auto-correct to 'auto'
  const isSouthAsian = ['INR', 'PKR', 'BDT', 'NPR', 'LKR'].includes(merged.currency) || merged.currencySymbol === '₹';
  if (merged.numberFormat === 'indian' && !isSouthAsian) {
    merged.numberFormat = 'auto';
  }
  return merged;
}

export function saveSettings(settings) {
  const current = getSettings();
  const updated = { ...current, ...settings };
  setLocal(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}

// Demo Data Generators
function generateDemoTransactions() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  // Yesterday
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // 2 days ago
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);
  const twoStr = `${twoDaysAgo.getFullYear()}-${String(twoDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(twoDaysAgo.getDate()).padStart(2, '0')}`;

  return [
    {
      id: 'tx_demo_1',
      type: 'income',
      amount: 4500.00,
      recipient: 'Employer Inc.',
      category: 'salary',
      date: todayStr,
      time: '09:00',
      note: 'Monthly Senior Tech Salary',
      paymentMethod: 'bank',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tx_demo_2',
      type: 'expense',
      amount: 42.50,
      recipient: 'Artisan Cafe',
      category: 'food',
      date: todayStr,
      time: '12:30',
      note: 'Artisan Cafe Lunch & Espresso',
      paymentMethod: 'card',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tx_demo_3',
      type: 'expense',
      amount: 120.00,
      recipient: 'Whole Foods Market',
      category: 'food',
      date: todayStr,
      time: '18:45',
      note: 'Whole Foods Market Weekly Stock',
      paymentMethod: 'card',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tx_demo_4',
      type: 'income',
      amount: 750.00,
      category: 'freelance',
      date: yStr,
      time: '15:20',
      note: 'Web Design UI/UX Project Milestone',
      paymentMethod: 'bank',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tx_demo_5',
      type: 'expense',
      amount: 65.00,
      category: 'transport',
      date: yStr,
      time: '17:10',
      note: 'Highway Fuel Refill',
      paymentMethod: 'card',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tx_demo_6',
      type: 'expense',
      amount: 14.99,
      category: 'entertainment',
      date: twoStr,
      time: '20:15',
      note: 'Streaming HD Subscription',
      paymentMethod: 'wallet',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tx_demo_7',
      type: 'expense',
      amount: 1100.00,
      category: 'housing',
      date: twoStr,
      time: '08:00',
      note: 'Modern Apartment Monthly Rent',
      paymentMethod: 'bank',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

function generateDemoGoals() {
  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setMonth(today.getMonth() + 8);
  const targetDateStr = nextYear.toISOString().split('T')[0];

  const d1 = new Date(today); d1.setDate(today.getDate() - 45);
  const d2 = new Date(today); d2.setDate(today.getDate() - 25);
  const d3 = new Date(today); d3.setDate(today.getDate() - 10);
  const d4 = new Date(today); d4.setDate(today.getDate() - 5);

  return [
    {
      id: 'goal_demo_1',
      title: 'Emergency Rainy Day Fund',
      targetAmount: 10000,
      currentAmount: 7250,
      targetDate: targetDateStr,
      category: 'emergency',
      icon: '🛡️',
      notes: '6 months of living expenses safety cushion',
      history: [
        {
          id: 'dep_demo_1_3',
          amount: 1750,
          type: 'deposit',
          date: d4.toISOString().split('T')[0],
          time: '14:20',
          note: 'Freelance project bonus deposit',
          createdAt: d4.toISOString()
        },
        {
          id: 'dep_demo_1_2',
          amount: 2500,
          type: 'deposit',
          date: d2.toISOString().split('T')[0],
          time: '10:15',
          note: 'Monthly emergency fund savings',
          createdAt: d2.toISOString()
        },
        {
          id: 'dep_demo_1_1',
          amount: 3000,
          type: 'deposit',
          date: d1.toISOString().split('T')[0],
          time: '11:00',
          note: 'Initial emergency reserve allocation',
          createdAt: d1.toISOString()
        }
      ],
      createdAt: d1.toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'goal_demo_2',
      title: 'M3 Pro Laptop Workstation',
      targetAmount: 2500,
      currentAmount: 2000,
      targetDate: targetDateStr,
      category: 'tech',
      icon: '💻',
      notes: 'New productivity high-spec machine',
      history: [
        {
          id: 'dep_demo_2_2',
          amount: 800,
          type: 'deposit',
          date: d3.toISOString().split('T')[0],
          time: '16:45',
          note: 'Client milestone payout transfer',
          createdAt: d3.toISOString()
        },
        {
          id: 'dep_demo_2_1',
          amount: 1200,
          type: 'deposit',
          date: d1.toISOString().split('T')[0],
          time: '09:30',
          note: 'Kickoff deposit from savings',
          createdAt: d1.toISOString()
        }
      ],
      createdAt: d1.toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'goal_demo_3',
      title: 'Tokyo & Kyoto Vacation',
      targetAmount: 3800,
      currentAmount: 1450,
      targetDate: targetDateStr,
      category: 'travel',
      icon: '✈️',
      notes: 'Flights, Ryokan, and culinary exploration',
      history: [
        {
          id: 'dep_demo_3_3',
          amount: 200,
          type: 'withdraw',
          date: d4.toISOString().split('T')[0],
          time: '15:10',
          note: 'Passport renewal fee withdrawal',
          createdAt: d4.toISOString()
        },
        {
          id: 'dep_demo_3_2',
          amount: 650,
          type: 'deposit',
          date: d2.toISOString().split('T')[0],
          time: '18:00',
          note: 'Weekend consulting earnings',
          createdAt: d2.toISOString()
        },
        {
          id: 'dep_demo_3_1',
          amount: 1000,
          type: 'deposit',
          date: d1.toISOString().split('T')[0],
          time: '12:00',
          note: 'Initial Japan trip savings deposit',
          createdAt: d1.toISOString()
        }
      ],
      createdAt: d1.toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

// Export / Import Utilities
export function exportDataAsJSON() {
  const payload = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    transactions: getTransactions(),
    goals: getGoals(),
    settings: getSettings(),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finance_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTransactionsAsCSV() {
  const transactions = getTransactions();
  if (transactions.length === 0) return false;

  const headers = ['ID', 'Type', 'Amount', 'Recipient / Source', 'Category', 'Date', 'Time', 'Payment Method', 'Note'];
  const rows = transactions.map(t => [
    t.id,
    t.type,
    t.amount,
    `"${(t.recipient || '').replace(/"/g, '""')}"`,
    t.category,
    t.date,
    t.time || '',
    t.paymentMethod || '',
    `"${(t.note || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

export function importDataFromJSON(jsonText) {
  try {
    const data = JSON.parse(jsonText);
    if (!data || (!data.transactions && !data.goals)) {
      throw new Error('Invalid finance backup file structure');
    }

    if (Array.isArray(data.transactions)) {
      setLocal(STORAGE_KEYS.TRANSACTIONS, data.transactions);
    }
    if (Array.isArray(data.goals)) {
      setLocal(STORAGE_KEYS.GOALS, data.goals);
    }
    if (data.settings && typeof data.settings === 'object') {
      setLocal(STORAGE_KEYS.SETTINGS, { ...DEFAULT_SETTINGS, ...data.settings });
    }
    return { success: true, countTx: data.transactions?.length || 0, countGoals: data.goals?.length || 0 };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function resetAllData() {
  const current = getCurrentUser();
  if (current?.id && current.id !== DEFAULT_USER_ID) {
    localStorage.removeItem(getUserStorageKey(STORAGE_KEYS.TRANSACTIONS, current.id));
    localStorage.removeItem(getUserStorageKey(STORAGE_KEYS.GOALS, current.id));
    localStorage.removeItem(getUserStorageKey(STORAGE_KEYS.TODOS, current.id));
  }
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.GOALS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

// User Authentication API
export const DEFAULT_USER = {
  id: 'ft_default_user',
  name: 'Finance Tracker',
  username: 'financetracker',
  email: 'financetracker@example.com',
  role: 'Primary Account',
  avatar: 'FT',
  joinedDate: '2026-01-01',
};

export function getCurrentUser() {
  return getLocal(STORAGE_KEYS.CURRENT_USER, null);
}

export function setCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    return null;
  }
  setLocal(STORAGE_KEYS.CURRENT_USER, user);
  return user;
}

export function getSavedUsers() {
  const users = getLocal(STORAGE_KEYS.USERS, null);
  if (!users) {
    const initialUsers = [DEFAULT_USER];
    setLocal(STORAGE_KEYS.USERS, initialUsers);
    return initialUsers;
  }
  return users;
}

export function loginUser({ identifier, password, rememberMe = true }) {
  const trimmed = (identifier || '').trim();
  if (!trimmed) {
    throw new Error('Please enter your username, email, or full name.');
  }

  const users = getSavedUsers();
  // Check if existing user matches identifier (by username, email, or name)
  let found = users.find(u => 
    (u.username && u.username.toLowerCase() === trimmed.toLowerCase()) ||
    (u.email && u.email.toLowerCase() === trimmed.toLowerCase()) ||
    (u.name && u.name.toLowerCase() === trimmed.toLowerCase())
  );

  if (!found) {
    // If not found in demo/saved users, auto-create a friendly profile for seamless experience
    const initials = trimmed
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'FT';

    found = {
      id: 'usr_' + Date.now(),
      name: trimmed,
      username: trimmed.toLowerCase().replace(/\s+/g, ''),
      email: trimmed.includes('@') ? trimmed : `${trimmed.toLowerCase().replace(/\s+/g, '')}@financetracker.local`,
      role: 'Personal Account',
      avatar: initials,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    const updatedUsers = [...users, found];
    setLocal(STORAGE_KEYS.USERS, updatedUsers);
    // Explicitly initialize clean 0 data for auto-created new user
    setLocal(getUserStorageKey(STORAGE_KEYS.TRANSACTIONS, found.id), []);
    setLocal(getUserStorageKey(STORAGE_KEYS.GOALS, found.id), []);
    setLocal(getUserStorageKey(STORAGE_KEYS.TODOS, found.id), []);
  }

  setCurrentUser(found);
  return found;
}

export function registerUser({ name, username, email }) {
  const trimmedName = (name || '').trim();
  if (!trimmedName) {
    throw new Error('Please enter a display name.');
  }

  const users = getSavedUsers();
  const initials = trimmedName
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'FT';

  const newUser = {
    id: 'usr_' + Date.now(),
    name: trimmedName,
    username: (username || trimmedName).toLowerCase().replace(/\s+/g, ''),
    email: email || `${trimmedName.toLowerCase().replace(/\s+/g, '')}@financetracker.local`,
    role: 'Personal Account',
    avatar: initials,
    joinedDate: new Date().toISOString().split('T')[0],
  };

  const updatedUsers = [...users, newUser];
  setLocal(STORAGE_KEYS.USERS, updatedUsers);
  // Ensure new user starts with 0 initial amount and empty transactions & goals
  setLocal(getUserStorageKey(STORAGE_KEYS.TRANSACTIONS, newUser.id), []);
  setLocal(getUserStorageKey(STORAGE_KEYS.GOALS, newUser.id), []);
  setLocal(getUserStorageKey(STORAGE_KEYS.TODOS, newUser.id), []);
  setCurrentUser(newUser);
  return newUser;
}

export function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  return null;
}

// Daily Financial Todos
export const DEFAULT_DAILY_TODOS = [
  { id: 'todo-1', text: 'Pay monthly electricity & WiFi bills', category: 'Bills', completed: false, due: 'Today' },
  { id: 'todo-2', text: 'Review weekly grocery & dining budget', category: 'Budget', completed: true, due: 'Daily' },
  { id: 'todo-3', text: 'Deposit into Emergency Savings goal', category: 'Savings', completed: false, due: 'By 6 PM' },
  { id: 'todo-4', text: 'Verify credit card charges and invoices', category: 'Review', completed: true, due: 'Today' },
  { id: 'todo-5', text: "Log today's cash & UPI payment receipts", category: 'Expense', completed: false, due: 'Tonight' },
  { id: 'todo-6', text: 'Check recurring subscription renewals', category: 'Recurring', completed: false, due: 'Today' },
];

export function getDailyTodos(userId) {
  const uid = userId || getActiveUserId();
  const key = getUserStorageKey(STORAGE_KEYS.TODOS, uid);
  const todos = getLocal(key, null);
  if (uid === DEFAULT_USER_ID) {
    if (!todos || !Array.isArray(todos) || todos.length === 0) {
      setLocal(key, DEFAULT_DAILY_TODOS);
      return DEFAULT_DAILY_TODOS;
    }
    return todos;
  }
  if (!todos || !Array.isArray(todos)) {
    setLocal(key, []);
    return [];
  }
  return todos;
}

export function saveDailyTodos(todos, userId) {
  const uid = userId || getActiveUserId();
  const key = getUserStorageKey(STORAGE_KEYS.TODOS, uid);
  setLocal(key, todos);
  return todos;
}

// App Updates Management (Notifications)
export const DEFAULT_APP_UPDATES = [
  {
    id: 'update-v2.5',
    version: 'v2.5.0',
    title: 'Global Country Currencies & Income / Payment Transactions',
    description: 'Added support for 45+ international country currencies with live switching. Client Transactions Table now tracks Income & Payment types with smart filters.',
    date: 'Just now',
    tag: 'Feature Release',
    read: false,
    timestamp: Date.now() - 1000 * 60 * 15,
  },
  {
    id: 'update-v2.4',
    version: 'v2.4.2',
    title: 'Offline Database & Java Backend Sync Engine',
    description: 'IndexedDB mirror enabled for instant offline persistence and automatic background reconnection to Java REST server.',
    date: 'Yesterday',
    tag: 'System Update',
    read: false,
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'update-v2.3',
    version: 'v2.3.0',
    title: 'Profit & Loss Dynamic Chart & Financial Reminders',
    description: 'Added interactive Profit & Loss bar chart with monthly/daily views, plus live daily financial task reminders.',
    date: 'Sep 21, 2026',
    tag: 'Improvement',
    read: true,
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
  },
];

export const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export function getAppUpdates() {
  const updates = getLocal(STORAGE_KEYS.APP_UPDATES, null);
  const now = Date.now();

  let sourceList = updates;
  if (!sourceList || !Array.isArray(sourceList) || sourceList.length === 0) {
    sourceList = DEFAULT_APP_UPDATES;
  }

  // Auto-delete / purge notifications older than one week (7 days)
  const validUpdates = sourceList.filter(u => {
    const ts = Number(u.timestamp) || (now - 1000 * 60 * 60 * 24);
    return (now - ts) <= ONE_WEEK_MS;
  });

  // Persist cleaned list if any expired items were pruned
  if (!updates || validUpdates.length !== sourceList.length) {
    setLocal(STORAGE_KEYS.APP_UPDATES, validUpdates);
  }

  return validUpdates;
}

export function saveAppUpdates(updates) {
  setLocal(STORAGE_KEYS.APP_UPDATES, updates);
  return updates;
}

export function deleteAppUpdate(updateId) {
  const updates = getAppUpdates();
  const updated = updates.filter(u => u.id !== updateId);
  saveAppUpdates(updated);
  return updated;
}

export function clearAllAppUpdates() {
  saveAppUpdates([]);
  return [];
}

export function markAppUpdateRead(updateId) {
  const updates = getAppUpdates();
  const updated = updates.map(u => u.id === updateId ? { ...u, read: true } : u);
  saveAppUpdates(updated);
  return updated;
}

export function markAllAppUpdatesRead() {
  const updates = getAppUpdates();
  const updated = updates.map(u => ({ ...u, read: true }));
  saveAppUpdates(updated);
  return updated;
}



