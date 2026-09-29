// Storage service providing offline-first local persistence with IndexedDB and localStorage mirror

const STORAGE_KEYS = {
  TRANSACTIONS: 'zt_finance_transactions_v1',
  GOALS: 'zt_finance_goals_v1',
  SETTINGS: 'zt_finance_settings_v1',
  PENDING_SYNC: 'zt_finance_pending_sync_v1',
  CURRENT_USER: 'ft_current_user_v1',
  USERS: 'ft_users_v1',
  TODOS: 'ft_daily_todos_v1',
  APP_UPDATES: 'ft_app_updates_v1',
};

// Global Country Currencies List (45+ major world currencies)
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', country: 'United States', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', country: 'European Union', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', country: 'United Kingdom', flag: '🇬🇧' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', country: 'India', flag: '🇮🇳' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', country: 'Japan', flag: '🇯🇵' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', country: 'Canada', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', country: 'Australia', flag: '🇦🇺' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', country: 'Switzerland', flag: '🇨🇭' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', country: 'China', flag: '🇨🇳' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', country: 'Singapore', flag: '🇸🇬' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', country: 'New Zealand', flag: '🇳🇿' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', country: 'Brazil', flag: '🇧🇷' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', country: 'South Africa', flag: '🇿🇦' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso', country: 'Mexico', flag: '🇲🇽' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', country: 'South Korea', flag: '🇰🇷' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', country: 'Russia', flag: '🇷🇺' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', country: 'Turkey', flag: '🇹🇷' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', country: 'Sweden', flag: '🇸🇪' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', country: 'Norway', flag: '🇳🇴' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', country: 'Denmark', flag: '🇩🇰' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', country: 'Poland', flag: '🇵🇱' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', country: 'Indonesia', flag: '🇮🇩' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', country: 'Malaysia', flag: '🇲🇾' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', country: 'Thailand', flag: '🇹🇭' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', country: 'Philippines', flag: '🇵🇭' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', country: 'Vietnam', flag: '🇻🇳' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', country: 'Pakistan', flag: '🇵🇰' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', country: 'Bangladesh', flag: '🇧🇩' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', country: 'Nigeria', flag: '🇳🇬' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', country: 'Egypt', flag: '🇪🇬' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', country: 'Kenya', flag: '🇰🇪' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', country: 'Ghana', flag: '🇬🇭' },
  { code: 'ARS', symbol: '$', name: 'Argentine Peso', country: 'Argentina', flag: '🇦🇷' },
  { code: 'CLP', symbol: '$', name: 'Chilean Peso', country: 'Chile', flag: '🇨🇱' },
  { code: 'COP', symbol: '$', name: 'Colombian Peso', country: 'Colombia', flag: '🇨🇴' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', country: 'Israel', flag: '🇮🇱' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', country: 'Hong Kong', flag: '🇭🇰' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', country: 'Taiwan', flag: '🇹🇼' },
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar', country: 'Kuwait', flag: '🇰🇼' },
  { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal', country: 'Qatar', flag: '🇶🇦' },
  { code: 'OMR', symbol: 'RO', name: 'Omani Rial', country: 'Oman', flag: '🇴🇲' },
  { code: 'BHD', symbol: 'BD', name: 'Bahraini Dinar', country: 'Bahrain', flag: '🇧🇭' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee', country: 'Nepal', flag: '🇳🇵' },
];

export const DEFAULT_SETTINGS = {
  currency: 'USD',
  currencySymbol: '$',
  monthlyBudget: 3500,
  theme: 'dark',
  autoSync: true,
};

export const CATEGORIES = {
  expense: [
    { id: 'food', name: 'Food & Grocery', icon: '🛒', color: '#10B981' },
    { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#10B981' },
    { id: 'transport', name: 'Transport & Fuel', icon: '🚗', color: '#3B82F6' },
    { id: 'housing', name: 'Rent & Housing', icon: '🏠', color: '#6366F1' },
    { id: 'utilities', name: 'Bills & Utilities', icon: '⚡', color: '#EAB308' },
    { id: 'shopping', name: 'Shopping & Gear', icon: '🛍️', color: '#EC4899' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#8B5CF6' },
    { id: 'health', name: 'Health & Fitness', icon: '💊', color: '#EF4444' },
    { id: 'education', name: 'Education & Books', icon: '📚', color: '#06B6D4' },
    { id: 'other_exp', name: 'Other Expense', icon: '📦', color: '#64748B' },
  ],
  income: [
    { id: 'salary', name: 'Salary & Wages', icon: '💼', color: '#10B981' },
    { id: 'freelance', name: 'Freelance & Client', icon: '💻', color: '#06B6D4' },
    { id: 'investment', name: 'Investments & Dividends', icon: '📈', color: '#8B5CF6' },
    { id: 'bonus', name: 'Bonus & Incentives', icon: '🎁', color: '#F59E0B' },
    { id: 'rental', name: 'Rental Income', icon: '🏢', color: '#3B82F6' },
    { id: 'other_inc', name: 'Other Income', icon: '💰', color: '#14B8A6' },
  ]
};

export const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', icon: '💵' },
  { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
  { id: 'bank', name: 'Bank / UPI Transfer', icon: '🏦' },
  { id: 'wallet', name: 'Digital Wallet', icon: '📱' },
];

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

// Transactions API
export function getTransactions() {
  const txs = getLocal(STORAGE_KEYS.TRANSACTIONS, null);
  if (!txs) {
    const demo = generateDemoTransactions();
    setLocal(STORAGE_KEYS.TRANSACTIONS, demo);
    return demo;
  }
  return txs;
}

export function saveTransaction(transaction) {
  const list = getTransactions();
  const now = new Date().toISOString();
  let updated;

  if (transaction.id) {
    // Update existing
    updated = list.map(item => item.id === transaction.id ? { ...item, ...transaction, updatedAt: now } : item);
  } else {
    // Create new
    const newTx = {
      ...transaction,
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: now,
      updatedAt: now,
    };
    updated = [newTx, ...list];
  }

  setLocal(STORAGE_KEYS.TRANSACTIONS, updated);
  return updated;
}

export function deleteTransaction(id) {
  const list = getTransactions();
  const updated = list.filter(item => item.id !== id);
  setLocal(STORAGE_KEYS.TRANSACTIONS, updated);
  return updated;
}

// Financial Goals API
export function getGoals() {
  const goals = getLocal(STORAGE_KEYS.GOALS, null);
  if (!goals) {
    const demo = generateDemoGoals();
    setLocal(STORAGE_KEYS.GOALS, demo);
    return demo;
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
    setLocal(STORAGE_KEYS.GOALS, normalized);
  }
  return normalized;
}

export function saveGoal(goal) {
  const list = getGoals();
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

  setLocal(STORAGE_KEYS.GOALS, updated);
  return updated;
}

export function deleteGoal(id) {
  const list = getGoals();
  const updated = list.filter(item => item.id !== id);
  setLocal(STORAGE_KEYS.GOALS, updated);
  return updated;
}

export function updateGoalAmount(id, deltaAmount, meta = {}) {
  const list = getGoals();
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

  setLocal(STORAGE_KEYS.GOALS, updated);
  return { updated, completedJustNow };
}

export function deleteGoalTransaction(goalId, transactionId) {
  const list = getGoals();
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

  setLocal(STORAGE_KEYS.GOALS, updated);
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

// Settings API
export function getSettings() {
  return getLocal(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveSettings(settings) {
  const current = getSettings();
  const updated = { ...current, ...settings };
  setLocal(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}

// Format currency
export function formatCurrency(amount, symbol = '$') {
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (symbol && symbol.length > 1 && !symbol.endsWith('$')) {
    return `${symbol} ${formatted}`;
  }
  return `${symbol || ''}${formatted}`;
}

// Format 24h time string (HH:MM or HH:MM:SS) to 12h format with AM/PM
export function formatTime12Hour(timeStr) {
  if (!timeStr) return '';
  const str = String(timeStr).trim();
  // If it already contains AM or PM, return as is
  if (/(am|pm)/i.test(str)) {
    return str;
  }

  const parts = str.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1].substring(0, 2);
    if (!isNaN(hours)) {
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes} ${period}`;
    }
  }

  return str;
}

// Format date string (YYYY-MM-DD) to friendly format (e.g. Sep 17, 2026)
export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return String(dateStr);
  } catch {
    return String(dateStr);
  }
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

export function getDailyTodos() {
  const todos = getLocal(STORAGE_KEYS.TODOS, null);
  if (!todos || !Array.isArray(todos) || todos.length === 0) {
    setLocal(STORAGE_KEYS.TODOS, DEFAULT_DAILY_TODOS);
    return DEFAULT_DAILY_TODOS;
  }
  return todos;
}

export function saveDailyTodos(todos) {
  setLocal(STORAGE_KEYS.TODOS, todos);
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



