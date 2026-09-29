import React, { useState, useEffect } from 'react';
import { 
  X, 
  HelpCircle, 
  Search, 
  Rocket, 
  CreditCard, 
  Target, 
  BarChart2, 
  TrendingUp,
  Wifi, 
  WifiOff, 
  Keyboard, 
  Download, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight, 
  ShieldCheck, 
  Lightbulb, 
  LifeBuoy, 
  Send,
  Plus,
  Settings as SettingsIcon,
  Check
} from 'lucide-react';
import { checkBackendHealth } from '../services/api';

export default function HelpModal({
  isOpen,
  initialTab = 'getting-started',
  onClose,
  isOnline = false,
  onOpenTransactionModal,
  onOpenGoalModal,
  onOpenSettings,
  onOpenBackupModal,
  onShowToast,
  settings = {},
  stats = { transactionCount: 0, goalCount: 0, todoCount: 0 }
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [isPingingBackend, setIsPingingBackend] = useState(false);
  const [pingResult, setPingResult] = useState(null);
  
  // Feedback simulator form state
  const [feedbackCategory, setFeedbackCategory] = useState('question');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

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

  // Reset feedback state & sync active tab on open
  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      setFeedbackSubmitted(false);
      setPingResult(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Handle Backend Ping Test
  const handleTestBackend = async () => {
    setIsPingingBackend(true);
    setPingResult(null);
    const start = performance.now();
    try {
      const res = await checkBackendHealth();
      const duration = Math.round(performance.now() - start);
      if (res.online) {
        setPingResult({
          status: 'online',
          message: `Java Backend is reachable on port 8080 (${duration}ms). Synchronized with local data!`,
        });
        if (onShowToast) onShowToast('Java backend reached successfully!', 'success');
      } else {
        setPingResult({
          status: 'offline',
          message: `Backend server unreachable (${duration}ms). Operating in 100% Offline Mode with local persistence.`,
        });
        if (onShowToast) onShowToast('Operating in 100% Offline Mode.', 'info');
      }
    } catch (err) {
      setPingResult({
        status: 'offline',
        message: `Offline mode active: ${err.message}. Local storage is safeguarding your data.`,
      });
    } finally {
      setIsPingingBackend(false);
    }
  };

  // Submit Feedback Simulator
  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSubmitted(true);
    if (onShowToast) {
      onShowToast('Thank you! Your feedback has been recorded locally.', 'success');
    }
    setTimeout(() => {
      setFeedbackText('');
      setFeedbackSubmitted(false);
    }, 3000);
  };

  const navCategories = [
    { id: 'getting-started', label: 'Getting Started', icon: <Rocket size={17} /> },
    { id: 'revenue-chart', label: 'Revenue & Expenses Chart', icon: <TrendingUp size={17} /> },
    { id: 'transactions', label: 'Daily Tracker', icon: <CreditCard size={17} /> },
    { id: 'goals', label: 'Financial Goals', icon: <Target size={17} /> },
    { id: 'analytics', label: 'Analytics & Trends', icon: <BarChart2 size={17} /> },
    { id: 'offline-sync', label: 'Offline & Sync', icon: isOnline ? <Wifi size={17} /> : <WifiOff size={17} /> },
    { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={17} /> },
    { id: 'faqs', label: 'FAQs & Questions', icon: <HelpCircle size={17} /> },
    { id: 'support', label: 'Support & Feedback', icon: <LifeBuoy size={17} /> },
  ];

  // FAQ items data
  const faqs = [
    {
      q: 'What is the purpose of the "Revenue and Expenses Over Time" chart, and what should I do with it?',
      a: 'The "Revenue and Expenses Over Time" chart visually tracks incoming revenue against outgoing expenses. Purpose: To monitor whether you are cash-flow positive and detect spending surges across weeks, months, or years. What to do: 1) Switch timeframes (This week, This month, This year) to identify patterns; 2) Ensure the green revenue wave stays higher than the blue/amber expense curve; 3) Hover over points to view exact amounts; 4) Transfer surplus earnings directly into your Financial Goals.',
      category: 'revenue-chart'
    },
    {
      q: 'Why does the sidebar display "Helps [Offline]"?',
      a: 'FOGO Finance is architected offline-first. The badge reflects your companion Java backend status. In Offline mode, 100% of features (recording income/expenses, setting savings goals, analytics, checklist) function seamlessly using browser local persistence. If you start the Java server (`npm run backend`), it automatically switches to Online.',
      category: 'offline-sync'
    },
    {
      q: 'Is my financial data secure and private?',
      a: 'Yes, absolutely. All transactions, goals, and daily tasks are stored privately on your local machine using encrypted browser storage. No financial data is ever shared with third-party tracking services or external advertisers.',
      category: 'getting-started'
    },
    {
      q: 'How do I change the currency (e.g., INR ₹, USD $, EUR €)?',
      a: 'Use the global Country Currency Switcher located in the top navigation header, or open Settings. We support over 15 world currencies with live symbol formatting throughout the app.',
      category: 'getting-started'
    },
    {
      q: 'Can I export my data to Microsoft Excel or Google Sheets?',
      a: 'Yes! Open Settings -> Data Backup & Export (or click "Data Backup" in the shortcuts below) and click "Export CSV". You can also export a full JSON backup to transfer data between computers.',
      category: 'transactions'
    },
    {
      q: 'How do I duplicate a recurring transaction?',
      a: 'Navigate to "Daily Tracker". On any transaction row, click the Duplicate icon. A copy will be pre-filled with today\'s date and saved instantly.',
      category: 'transactions'
    },
    {
      q: 'How does the milestone celebration work for Financial Goals?',
      a: 'When you deposit funds into a goal and reach 100% of your target amount, FOGO triggers a milestone confetti blast to celebrate your financial achievement!',
      category: 'goals'
    },
    {
      q: 'What are the quickest keyboard shortcuts?',
      a: 'Press "N" anywhere on the dashboard to log a new transaction. Press "G" to create a new financial goal. Press "Esc" to dismiss any dialog or menu.',
      category: 'shortcuts'
    },
    {
      q: 'Can I reset or clear demo transactions?',
      a: 'Yes. In Settings, scroll to the "Danger Zone" and click "Reset All Data". You can also reload clean demo data anytime from the Data Backup modal.',
      category: 'support'
    }
  ];

  // Filter FAQs based on search
  const filteredFaqs = faqs.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
  });

  return (
    <div 
      className="modal-overlay modal-backdrop help-modal-backdrop" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="help-modal-title"
    >
      <div 
        className="modal-dialog modal-content help-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header help-modal-header">
          <div className="help-header-title-group">
            <div className="help-header-icon-wrap">
              <HelpCircle size={22} className="help-header-icon" />
            </div>
            <div>
              <div className="help-header-title-row">
                <h2 id="help-modal-title" className="modal-title">FOGO Help & Knowledge Base</h2>
                <span className={`help-status-badge ${isOnline ? 'online' : 'offline'}`}>
                  {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {isOnline ? 'Online (Synced)' : 'Offline (Local Safe)'}
                </span>
              </div>
              <p className="modal-subtitle">Guides, features manual, offline sync information, and FAQs</p>
            </div>
          </div>

          <button 
            type="button"
            className="btn-close-modal btn btn-ghost btn-icon-only" 
            onClick={onClose}
            aria-label="Close Help Center"
            title="Close Help Center (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar Row */}
        <div className="help-search-row">
          <div className="help-search-box">
            <Search size={16} className="help-search-icon" />
            <input 
              type="text"
              className="help-search-input"
              placeholder="Search help topics, offline mode, shortcuts, exports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus={false}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="help-search-clear" 
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Action Pills */}
          <div className="help-quick-pills">
            <button 
              type="button" 
              className="help-pill-btn"
              onClick={() => {
                onClose();
                if (onOpenTransactionModal) onOpenTransactionModal('expense');
              }}
              title="Add Transaction"
            >
              <Plus size={13} />
              <span>Add Entry</span>
            </button>
            <button 
              type="button" 
              className="help-pill-btn"
              onClick={() => {
                onClose();
                if (onOpenGoalModal) onOpenGoalModal();
              }}
              title="Set Goal"
            >
              <Target size={13} />
              <span>Set Goal</span>
            </button>
            <button 
              type="button" 
              className="help-pill-btn"
              onClick={() => {
                onClose();
                if (onOpenBackupModal) onOpenBackupModal();
              }}
              title="Data Backup"
            >
              <Download size={13} />
              <span>Backup</span>
            </button>
          </div>
        </div>

        {/* Modal Main Body: Sidebar Tabs + Content Area */}
        <div className="help-modal-body">
          {/* Navigation Sidebar inside Modal */}
          <aside className="help-categories-sidebar" aria-label="Help Categories">
            <span className="help-sidebar-caption">Topics</span>
            <nav className="help-nav-list">
              {navCategories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`help-nav-btn ${activeTab === cat.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(cat.id);
                    if (searchQuery) setSearchQuery('');
                  }}
                >
                  <span className="help-nav-btn-icon">{cat.icon}</span>
                  <span className="help-nav-btn-label">{cat.label}</span>
                  <ChevronRight size={14} className="help-nav-btn-arrow" />
                </button>
              ))}
            </nav>

            <div className="help-sidebar-footer">
              <div className="help-system-badge">
                <ShieldCheck size={14} />
                <span>v2.4.0 • Zero Cloud Lock-in</span>
              </div>
            </div>
          </aside>

          {/* Content Pane */}
          <div className="help-content-pane">
            {/* If searching, show search results view */}
            {searchQuery.trim() ? (
              <div className="help-search-results">
                <h3 className="help-section-heading">
                  Search Results for "{searchQuery}"
                </h3>
                {filteredFaqs.length === 0 ? (
                  <div className="help-empty-search">
                    <HelpCircle size={32} />
                    <p>No help articles matched your search. Try searching for "offline", "goal", "currency", or "export".</p>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear Search
                    </button>
                  </div>
                ) : (
                  <div className="help-faq-list">
                    {filteredFaqs.map((faq, idx) => (
                      <div key={idx} className="help-faq-card">
                        <h4 className="help-faq-q">{faq.q}</h4>
                        <p className="help-faq-a">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* 1. Getting Started */}
                {activeTab === 'getting-started' && (
                  <div className="help-tab-panel">
                    <div className="help-banner">
                      <div className="help-banner-content">
                        <span className="help-banner-tag">Welcome to FOGO Finance</span>
                        <h3 className="help-banner-title">Take Full Control of Your Financial Freedom</h3>
                        <p className="help-banner-text">
                          FOGO Finance is a smart, offline-first personal financial manager built to track income, control expenses, achieve savings goals, and visualize spending trends without compromising your privacy.
                        </p>
                      </div>
                    </div>

                    <h4 className="help-subsection-title">4 Core Power Modules</h4>
                    <div className="help-grid-cards">
                      <div className="help-feature-card">
                        <div className="help-card-icon-wrap brand">
                          <Rocket size={20} />
                        </div>
                        <h5 className="help-card-title">1. Overview Dashboard</h5>
                        <p className="help-card-desc">
                          Live balance summary, cash velocity, quick metrics, daily task checklist, and instant currency calculator.
                        </p>
                      </div>

                      <div className="help-feature-card">
                        <div className="help-card-icon-wrap income">
                          <CreditCard size={20} />
                        </div>
                        <h5 className="help-card-title">2. Daily Tracker</h5>
                        <p className="help-card-desc">
                          Record daily income and expenses by category, filter by date, duplicate recurring bills, and export CSVs.
                        </p>
                      </div>

                      <div className="help-feature-card">
                        <div className="help-card-icon-wrap goal">
                          <Target size={20} />
                        </div>
                        <h5 className="help-card-title">3. Financial Goals</h5>
                        <p className="help-card-desc">
                          Set savings targets for vacations, emergency funds, or tech gear with visual progress rings & confetti milestones.
                        </p>
                      </div>

                      <div className="help-feature-card">
                        <div className="help-card-icon-wrap purple">
                          <BarChart2 size={20} />
                        </div>
                        <h5 className="help-card-title">4. Analytics & Trends</h5>
                        <p className="help-card-desc">
                          Interactive breakdown charts, category distribution, savings rate calculations, and monthly spending comparisons.
                        </p>
                      </div>
                    </div>

                    <h4 className="help-subsection-title">Quick 3-Step Setup</h4>
                    <ol className="help-step-list">
                      <li className="help-step-item">
                        <span className="help-step-num">1</span>
                        <div>
                          <strong>Set your country currency:</strong> Click the currency switcher in the top bar (e.g., ₹ INR, $ USD, € EUR) to automatically format all numbers.
                        </div>
                      </li>
                      <li className="help-step-item">
                        <span className="help-step-num">2</span>
                        <div>
                          <strong>Record your first entry:</strong> Press key <kbd className="help-kbd">N</kbd> or click the floating "New Entry" button at the bottom-left to log income or expenses.
                        </div>
                      </li>
                      <li className="help-step-item">
                        <span className="help-step-num">3</span>
                        <div>
                          <strong>Set a target savings goal:</strong> Head to Financial Goals and create a goal like "Emergency Fund" to track required daily savings.
                        </div>
                      </li>
                    </ol>
                  </div>
                )}

                {/* 2. Daily Transactions */}
                {activeTab === 'transactions' && (
                  <div className="help-tab-panel">
                    <h3 className="help-section-heading">Daily Transactions Tracker Guide</h3>
                    <p className="help-section-intro">
                      Manage every dollar, rupee, or euro entering and exiting your pocket with complete category categorization.
                    </p>

                    <div className="help-guide-box">
                      <h4 className="help-guide-title">How to Record Transactions</h4>
                      <ul className="help-bullet-list">
                        <li><strong>Type:</strong> Select either <em>Expense</em> (red) or <em>Income</em> (green).</li>
                        <li><strong>Amount & Category:</strong> Enter the numerical amount and pick a category (e.g., Salary, Food, Shopping, Transport, Housing, Health).</li>
                        <li><strong>Date & Time:</strong> Defaults to the current moment, or pick any past date for retroactive expense logging.</li>
                        <li><strong>Notes:</strong> Add optional details like merchant name or project reference.</li>
                      </ul>
                    </div>

                    <div className="help-tips-card">
                      <div className="help-tips-icon">
                        <Lightbulb size={20} />
                      </div>
                      <div className="help-tips-content">
                        <strong>Pro Tip: Duplicate Recurring Bills</strong>
                        <p>Have monthly rent, subscriptions, or weekly grocery costs? Click the <em>Duplicate</em> button on any transaction to instantly clone it with today's date.</p>
                      </div>
                    </div>

                    <div className="help-action-row">
                      <button 
                        type="button" 
                        className="btn btn-primary"
                        onClick={() => {
                          onClose();
                          if (onOpenTransactionModal) onOpenTransactionModal('expense');
                        }}
                      >
                        <Plus size={16} />
                        <span>Log a Transaction Now</span>
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => {
                          onClose();
                          if (onOpenBackupModal) onOpenBackupModal();
                        }}
                      >
                        <Download size={16} />
                        <span>Export CSV to Excel</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Financial Goals */}
                {activeTab === 'goals' && (
                  <div className="help-tab-panel">
                    <h3 className="help-section-heading">Financial Goals & Savings Guide</h3>
                    <p className="help-section-intro">
                      Turn your financial dreams into attainable milestones by setting targets and tracking incremental savings progress.
                    </p>

                    <div className="help-grid-cards">
                      <div className="help-feature-card">
                        <h5 className="help-card-title">Target Date Countdown</h5>
                        <p className="help-card-desc">
                          Each goal calculates remaining days and informs you exactly how much money you need to deposit daily or monthly to stay on schedule.
                        </p>
                      </div>

                      <div className="help-feature-card">
                        <h5 className="help-card-title">Quick Deposit & Withdraw</h5>
                        <p className="help-card-desc">
                          Click "+ Deposit" on any goal card to add funds. If you need to reallocate, you can withdraw funds anytime.
                        </p>
                      </div>

                      <div className="help-feature-card">
                        <h5 className="help-card-title">Confetti Celebration 🎉</h5>
                        <p className="help-card-desc">
                          When your deposited amount reaches or exceeds 100% of the target, the app celebrates your achievement with animated confetti!
                        </p>
                      </div>
                    </div>

                    <div className="help-action-row">
                      <button 
                        type="button" 
                        className="btn btn-primary"
                        onClick={() => {
                          onClose();
                          if (onOpenGoalModal) onOpenGoalModal();
                        }}
                      >
                        <Target size={16} />
                        <span>Create New Savings Goal (G)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. Analytics & Trends */}
                {activeTab === 'analytics' && (
                  <div className="help-tab-panel">
                    <h3 className="help-section-heading">Analytics & Spending Insights</h3>
                    <p className="help-section-intro">
                      Gain clear visibility into where your money goes with visual breakdown charts and financial health metrics.
                    </p>

                    <div className="help-guide-box">
                      <h4 className="help-guide-title">Key Metrics Explained</h4>
                      <ul className="help-bullet-list">
                        <li><strong>Cash Flow Velocity:</strong> The net difference between your total income and total expenses over the active period.</li>
                        <li><strong>Savings Rate:</strong> The percentage of your earnings that you retain after expenses. A healthy target is typically 20% or higher.</li>
                        <li><strong>Category Distribution:</strong> Highlights your highest expense categories (e.g., Food vs. Housing) so you know where to optimize.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* 5. Revenue & Expenses Chart Guide */}
                {activeTab === 'revenue-chart' && (
                  <div className="help-tab-panel">
                    <div className="help-banner">
                      <div className="help-banner-content">
                        <span className="help-banner-tag">Overview Dashboard Core Visualizer</span>
                        <h3 className="help-banner-title">Revenue & Expenses Over Time Chart</h3>
                        <p className="help-banner-text">
                          Master the primary wave chart on your overview dashboard: what purpose it serves, how to interpret its signals, and the exact steps to take based on the data.
                        </p>
                      </div>
                    </div>

                    {/* Section 1: Chart Purpose */}
                    <h4 className="help-subsection-title">1. What is the Purpose of this Chart? (How it Helps)</h4>
                    <div className="help-grid-cards">
                      <div className="help-feature-card">
                        <div className="help-card-icon-wrap income">
                          <TrendingUp size={20} />
                        </div>
                        <h5 className="help-card-title">Live Cash Flow Margin</h5>
                        <p className="help-card-desc">
                          Visually verifies if you are earning more than you spend. When the <strong>green wave (Revenue)</strong> stays above the <strong>blue/amber wave (Expenses)</strong>, your net worth is expanding.
                        </p>
                      </div>

                      <div className="help-feature-card">
                        <div className="help-card-icon-wrap brand">
                          <BarChart2 size={20} />
                        </div>
                        <h5 className="help-card-title">Spike & Outlier Detection</h5>
                        <p className="help-card-desc">
                          Quickly highlights sudden expense surges, irregular utility bills, or pauses in income flow across days, weeks, and months before savings are depleted.
                        </p>
                      </div>

                      <div className="help-feature-card">
                        <div className="help-card-icon-wrap goal">
                          <Target size={20} />
                        </div>
                        <h5 className="help-card-title">Savings Capacity Finder</h5>
                        <p className="help-card-desc">
                          The visual gap between the two curves represents your disposable surplus. This is the exact capital you can safely deposit into your Savings Goals.
                        </p>
                      </div>
                    </div>

                    {/* Section 2: What to Do With This Chart */}
                    <h4 className="help-subsection-title" style={{ marginTop: '1.25rem' }}>2. What to Do with this Chart (Step-by-Step Action Guide)</h4>
                    <div className="help-guide-box">
                      <h5 className="help-guide-title">Actionable Steps & Best Practices</h5>
                      <ol className="help-numbered-steps">
                        <li>
                          <strong>Switch Timeframes:</strong> Use the dropdown in the chart header to toggle between <em>"This week"</em> (daily monitoring), <em>"This month"</em> (mid-term velocity), and <em>"This year"</em> (seasonal macro trends).
                        </li>
                        <li>
                          <strong>Inspect Peaks & Hover Data:</strong> Move your mouse or tap across the wave to inspect exact revenue and expense numbers for specific dates.
                        </li>
                        <li>
                          <strong>Take Corrective Action on Inversions:</strong> If the expense curve crosses above the revenue curve, immediately open the <em>Daily Tracker</em> to pause non-essential purchases.
                        </li>
                        <li>
                          <strong>Harvest Surpluses into Goals:</strong> When the green line spikes significantly above expenses, click <em>"+ Deposit"</em> on your Financial Goals to lock in your surplus savings.
                        </li>
                      </ol>
                    </div>

                    {/* Visual Legend Guide */}
                    <div className="help-guide-box" style={{ marginTop: '1rem' }}>
                      <h5 className="help-guide-title">How to Read the Curves</h5>
                      <ul className="help-bullet-list">
                        <li>
                          <strong style={{ color: 'var(--color-income, #10b981)' }}>● Green Upper Wave (Revenue):</strong> Represents all incoming salary, freelance earnings, client payments, and cash deposits.
                        </li>
                        <li>
                          <strong style={{ color: 'var(--color-goal, #f59e0b)' }}>● Blue / Amber Lower Wave (Expenses):</strong> Represents all outgoing bills, shopping, food expenses, housing, and operational costs.
                        </li>
                        <li>
                          <strong>The Floating Tooltip:</strong> Displays today's real-time incoming cash velocity to help you track current daily earnings against your average.
                        </li>
                      </ul>
                    </div>

                    {/* Pro-Tip Card */}
                    <div className="help-tips-card" style={{ marginTop: '1rem' }}>
                      <div className="help-tips-icon">
                        <Lightbulb size={20} />
                      </div>
                      <div className="help-tips-content">
                        <strong>Rule of Thumb for Financial Health:</strong>
                        <p>
                          Aim to maintain a consistent 20% to 30% gap between the green and blue curves. Pair this visual with your Daily Todos checklist on the right to clear mandatory bills on time without unexpected curve drops.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Offline & Cloud Sync */}
                {activeTab === 'offline-sync' && (
                  <div className="help-tab-panel">
                    <div className={`help-sync-status-box ${isOnline ? 'online' : 'offline'}`}>
                      <div className="help-sync-status-icon">
                        {isOnline ? <Wifi size={24} /> : <WifiOff size={24} />}
                      </div>
                      <div className="help-sync-status-info">
                        <h4 className="help-sync-title">
                          Current Status: {isOnline ? 'Online (Connected to Backend)' : 'Offline (Local-First Storage Active)'}
                        </h4>
                        <p className="help-sync-desc">
                          {isOnline 
                            ? 'Your app is actively communicating with the Java 21 REST backend. Data is mirrored both locally and on the server.'
                            : 'FOGO is operating in 100% resilient Offline Mode. All your transactions and goals are saved safely in your browser.'}
                        </p>
                      </div>
                    </div>

                    <h4 className="help-subsection-title">Why does the sidebar say "Helps [Offline]"?</h4>
                    <p className="help-text-block">
                      FOGO Finance was intentionally engineered as an <strong>offline-first</strong> application. 
                      You do not need an internet connection or a running server to use the tracker.
                      The offline badge simply informs you that the optional Java backend server is not currently running.
                    </p>

                    <div className="help-guide-box">
                      <h4 className="help-guide-title">How to Enable Java Backend Sync (Optional)</h4>
                      <ol className="help-numbered-steps">
                        <li>Open a terminal in your project directory.</li>
                        <li>Run the command: <code className="help-code">npm run backend</code></li>
                        <li>The Java REST server will launch on port 8080 and your status badge will switch to <strong>Online</strong>.</li>
                      </ol>
                    </div>

                    <div className="help-ping-section">
                      <h4 className="help-subsection-title">Test Server Connection</h4>
                      <div className="help-ping-row">
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={handleTestBackend}
                          disabled={isPingingBackend}
                        >
                          <RefreshCw size={15} className={isPingingBackend ? 'spin' : ''} />
                          <span>{isPingingBackend ? 'Checking...' : 'Ping Java Backend Now'}</span>
                        </button>

                        {pingResult && (
                          <span className={`help-ping-result ${pingResult.status}`}>
                            {pingResult.status === 'online' ? <Check size={14} /> : <WifiOff size={14} />}
                            {pingResult.message}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="help-action-row">
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => {
                          onClose();
                          if (onOpenBackupModal) onOpenBackupModal();
                        }}
                      >
                        <Download size={16} />
                        <span>Manage JSON & CSV Backups</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. Keyboard Shortcuts */}
                {activeTab === 'shortcuts' && (
                  <div className="help-tab-panel">
                    <h3 className="help-section-heading">Keyboard Shortcuts</h3>
                    <p className="help-section-intro">
                      Navigate and record financial transactions at lightning speed using native keyboard hotkeys.
                    </p>

                    <div className="help-shortcuts-grid">
                      <div className="help-shortcut-card">
                        <div className="help-shortcut-key-group">
                          <kbd className="help-key">N</kbd>
                        </div>
                        <div className="help-shortcut-meta">
                          <strong className="help-shortcut-action">New Daily Transaction</strong>
                          <span className="help-shortcut-detail">Opens modal to log expense or income from anywhere</span>
                        </div>
                      </div>

                      <div className="help-shortcut-card">
                        <div className="help-shortcut-key-group">
                          <kbd className="help-key">G</kbd>
                        </div>
                        <div className="help-shortcut-meta">
                          <strong className="help-shortcut-action">Set Financial Goal</strong>
                          <span className="help-shortcut-detail">Opens target goal creation dialog</span>
                        </div>
                      </div>

                      <div className="help-shortcut-card">
                        <div className="help-shortcut-key-group">
                          <kbd className="help-key">Esc</kbd>
                        </div>
                        <div className="help-shortcut-meta">
                          <strong className="help-shortcut-action">Dismiss Any Dialog</strong>
                          <span className="help-shortcut-detail">Closes the active modal, drawer, or dropdown</span>
                        </div>
                      </div>

                      <div className="help-shortcut-card">
                        <div className="help-shortcut-key-group">
                          <kbd className="help-key">?</kbd>
                          <span className="help-key-or">or</span>
                          <kbd className="help-key">H</kbd>
                        </div>
                        <div className="help-shortcut-meta">
                          <strong className="help-shortcut-action">Open Help Center</strong>
                          <span className="help-shortcut-detail">Quickly display this help guide and documentation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. FAQs */}
                {activeTab === 'faqs' && (
                  <div className="help-tab-panel">
                    <h3 className="help-section-heading">Frequently Asked Questions</h3>
                    <p className="help-section-intro">
                      Instant answers to commonly asked questions about FOGO Finance.
                    </p>

                    <div className="help-accordion-list">
                      {faqs.map((faq, index) => {
                        const isExpanded = expandedFaq === index;
                        return (
                          <div 
                            key={index} 
                            className={`help-accordion-item ${isExpanded ? 'open' : ''}`}
                          >
                            <button
                              type="button"
                              className="help-accordion-header"
                              onClick={() => setExpandedFaq(isExpanded ? null : index)}
                              aria-expanded={isExpanded}
                            >
                              <span className="help-accordion-q">{faq.q}</span>
                              <ChevronDown size={16} className={`help-accordion-chevron ${isExpanded ? 'rotate' : ''}`} />
                            </button>
                            {isExpanded && (
                              <div className="help-accordion-body">
                                <p>{faq.a}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 8. Support & Diagnostics */}
                {activeTab === 'support' && (
                  <div className="help-tab-panel">
                    <h3 className="help-section-heading">Support & Feedback</h3>
                    <p className="help-section-intro">
                      Need help or want to suggest a new feature? We are here to support your financial journey.
                    </p>

                    {/* Diagnostics summary */}
                    <div className="help-diag-card">
                      <h4 className="help-diag-title">System Diagnostics</h4>
                      <div className="help-diag-grid">
                        <div className="help-diag-item">
                          <span className="help-diag-label">App Version:</span>
                          <span className="help-diag-val">v2.4.0 (FOGO FinTech Edition)</span>
                        </div>
                        <div className="help-diag-item">
                          <span className="help-diag-label">Active Currency:</span>
                          <span className="help-diag-val">{settings.currency || 'USD'} ({settings.currencySymbol || '$'})</span>
                        </div>
                        <div className="help-diag-item">
                          <span className="help-diag-label">Storage Engine:</span>
                          <span className="help-diag-val">Encrypted LocalStorage (Active)</span>
                        </div>
                        <div className="help-diag-item">
                          <span className="help-diag-label">Cloud Sync State:</span>
                          <span className={`help-diag-val ${isOnline ? 'online' : 'offline'}`}>
                            {isOnline ? 'Online (Ready)' : 'Offline (Local Safe)'}
                          </span>
                        </div>
                        <div className="help-diag-item">
                          <span className="help-diag-label">Local Records:</span>
                          <span className="help-diag-val">
                            {stats.transactionCount || 0} Transactions, {stats.goalCount || 0} Goals
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Feedback Simulator Form */}
                    <div className="help-feedback-card">
                      <h4 className="help-feedback-title">Send Feedback or Feature Request</h4>
                      <form onSubmit={handleSubmitFeedback}>
                        <div className="help-form-group">
                          <label className="help-form-label">Category</label>
                          <div className="help-radio-pills">
                            <button
                              type="button"
                              className={`help-radio-pill ${feedbackCategory === 'question' ? 'active' : ''}`}
                              onClick={() => setFeedbackCategory('question')}
                            >
                              Question
                            </button>
                            <button
                              type="button"
                              className={`help-radio-pill ${feedbackCategory === 'feature' ? 'active' : ''}`}
                              onClick={() => setFeedbackCategory('feature')}
                            >
                              Feature Request
                            </button>
                            <button
                              type="button"
                              className={`help-radio-pill ${feedbackCategory === 'bug' ? 'active' : ''}`}
                              onClick={() => setFeedbackCategory('bug')}
                            >
                              Report Issue
                            </button>
                          </div>
                        </div>

                        <div className="help-form-group">
                          <label className="help-form-label">Your Message</label>
                          <textarea 
                            className="help-textarea"
                            rows={3}
                            placeholder="Describe how we can help or what you would like to see added..."
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            required
                          />
                        </div>

                        <div className="help-form-actions">
                          <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={!feedbackText.trim() || feedbackSubmitted}
                          >
                            {feedbackSubmitted ? (
                              <>
                                <Check size={16} />
                                <span>Sent! Thank you</span>
                              </>
                            ) : (
                              <>
                                <Send size={15} />
                                <span>Submit Feedback</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Modal Footer with Quick Links */}
        <div className="modal-footer help-modal-footer">
          <div className="help-footer-hint">
            <Keyboard size={14} />
            <span>Tip: Press <kbd className="help-kbd">Esc</kbd> to close anytime</span>
          </div>

          <div className="help-footer-actions">
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                onClose();
                if (onOpenSettings) onOpenSettings();
              }}
            >
              <SettingsIcon size={14} />
              <span>Settings</span>
            </button>
            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={onClose}
            >
              Got it, Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
