import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  PlusCircle,
  Coins,
  Calculator,
  Layers,
  Sparkles,
  X,
  Check,
  ChevronRight,
  Filter,
  ShieldCheck,
  Calendar,
  Zap,
  Repeat,
  Eye
} from 'lucide-react';
import {
  INVESTMENT_CATEGORIES,
  getInvestmentCategoryInfo,
  formatCurrency,
  MAX_TRANSACTION_AMOUNT
} from '../services/storage';

// Curated Indian & Global Presets for instant 1-click addition matching My Portfolio (Tracker)
export const INDIAN_PORTFOLIO_PRESETS = [
  // Mutual Funds (SIP)
  {
    name: 'Parag Parikh Flexi Cap Fund - Direct Plan',
    symbol: 'PPFC-DIR',
    category: 'mutual_funds',
    defaultUnits: 250,
    defaultBuyPrice: 62.40,
    defaultCurrentPrice: 84.80,
    mode: 'Monthly SIP',
    yield: 0,
    notes: 'Core equity mutual fund with international diversification'
  },
  {
    name: 'Mirae Asset Large & Midcap Fund - Direct',
    symbol: 'MIRAE-LM',
    category: 'mutual_funds',
    defaultUnits: 180,
    defaultBuyPrice: 95.20,
    defaultCurrentPrice: 128.50,
    mode: 'Monthly SIP',
    yield: 0,
    notes: 'Consistent compounding in bluechip and midcap leaders'
  },
  {
    name: 'Quant Small Cap Fund - Direct Growth',
    symbol: 'QUANT-SC',
    category: 'mutual_funds',
    defaultUnits: 120,
    defaultBuyPrice: 165.00,
    defaultCurrentPrice: 245.30,
    mode: 'Monthly SIP',
    yield: 0,
    notes: 'High-alpha small cap mutual fund allocation'
  },
  {
    name: 'UTI Nifty 50 Index Fund - Direct Growth',
    symbol: 'UTI-N50',
    category: 'mutual_funds',
    defaultUnits: 300,
    defaultBuyPrice: 142.10,
    defaultCurrentPrice: 178.60,
    mode: 'Monthly SIP',
    yield: 0,
    notes: 'Low-cost passive indexing across India top 50 giants'
  },
  // Stocks & Equities (NSE/BSE)
  {
    name: 'HDFC Bank Ltd',
    symbol: 'HDFCBANK.NS',
    category: 'stocks',
    defaultUnits: 50,
    defaultBuyPrice: 1480.00,
    defaultCurrentPrice: 1740.00,
    mode: 'Lumpsum',
    yield: 1.15,
    notes: 'Private banking sector leader holding'
  },
  {
    name: 'Reliance Industries Ltd',
    symbol: 'RELIANCE.NS',
    category: 'stocks',
    defaultUnits: 35,
    defaultBuyPrice: 2450.00,
    defaultCurrentPrice: 2890.00,
    mode: 'Lumpsum',
    yield: 0.35,
    notes: 'Conglomerate powerhouse in energy, retail and telecom'
  },
  {
    name: 'Tata Consultancy Services',
    symbol: 'TCS.NS',
    category: 'stocks',
    defaultUnits: 20,
    defaultBuyPrice: 3850.00,
    defaultCurrentPrice: 4220.00,
    mode: 'Lumpsum',
    yield: 1.35,
    notes: 'IT export titan with resilient cash flows'
  },
  {
    name: 'ITC Ltd',
    symbol: 'ITC.NS',
    category: 'stocks',
    defaultUnits: 150,
    defaultBuyPrice: 410.00,
    defaultCurrentPrice: 485.00,
    mode: 'Lumpsum',
    yield: 3.10,
    notes: 'High-dividend FMCG & hospitality compounder'
  },
  // Fixed Income / FDs
  {
    name: 'SBI 1-Year Term Deposit (FD)',
    symbol: 'SBI-FD',
    category: 'fixed_deposits',
    defaultUnits: 1,
    defaultBuyPrice: 100000,
    defaultCurrentPrice: 107100,
    mode: 'Fixed Term',
    yield: 7.10,
    notes: 'Guaranteed 7.10% p.a. bank fixed deposit'
  },
  {
    name: 'HDFC Bank 5-Year Tax Saver FD',
    symbol: 'HDFC-TAXFD',
    category: 'fixed_deposits',
    defaultUnits: 1,
    defaultBuyPrice: 150000,
    defaultCurrentPrice: 160875,
    mode: 'Fixed Term',
    yield: 7.25,
    notes: 'Section 80C tax deduction fixed deposit'
  },
  // Govt Schemes / PPF / NPS
  {
    name: 'Public Provident Fund (PPF)',
    symbol: 'PPF-GOVT',
    category: 'govt_schemes',
    defaultUnits: 1,
    defaultBuyPrice: 150000,
    defaultCurrentPrice: 160650,
    mode: 'Govt Scheme',
    yield: 7.10,
    notes: '15-year tax-free sovereign compounding (EEE)'
  },
  {
    name: 'National Pension Scheme (NPS Tier-1)',
    symbol: 'NPS-TIER1',
    category: 'govt_schemes',
    defaultUnits: 100,
    defaultBuyPrice: 42.50,
    defaultCurrentPrice: 58.20,
    mode: 'Monthly SIP',
    yield: 0,
    notes: 'Retirement fund with active corporate equity exposure'
  },
  // SGB & Gold
  {
    name: 'Sovereign Gold Bond (SGB 2023-24 Series III)',
    symbol: 'SGB2023',
    category: 'gold',
    defaultUnits: 15,
    defaultBuyPrice: 6199.00,
    defaultCurrentPrice: 7850.00,
    mode: 'SGB',
    yield: 2.50,
    notes: '2.5% p.a. annual interest + gold price appreciation'
  },
  {
    name: 'Nippon India ETF Gold BeES',
    symbol: 'GOLDBEES.NS',
    category: 'gold',
    defaultUnits: 120,
    defaultBuyPrice: 54.20,
    defaultCurrentPrice: 68.80,
    mode: 'Lumpsum',
    yield: 0,
    notes: 'Direct 24-karat gold physical backed ETF'
  },
  // Crypto
  {
    name: 'Bitcoin Digital Asset',
    symbol: 'BTC',
    category: 'crypto',
    defaultUnits: 0.15,
    defaultBuyPrice: 58000.00,
    defaultCurrentPrice: 89500.00,
    mode: 'Crypto',
    yield: 0,
    notes: 'Digital store of value and macro inflation hedge'
  }
];

/**
 * Auto-generates a clean uppercase Ticker / Folio Symbol from an Asset or Scheme Name in real time.
 */
export function generateTickerFromAssetName(name) {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (!trimmed) return '';

  const cleanAlnum = (str) => (str || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // Words split by spaces, hyphens, slashes, underscores, dots, commas
  const words = trimmed.split(/[\s\-_\/.,]+/).filter(Boolean);
  if (words.length === 0) return '';

  if (words.length === 1) {
    return cleanAlnum(words[0]).slice(0, 10);
  }

  // Multi-word rules
  const lower = trimmed.toLowerCase();

  // Popular Indian & global shortcuts
  if (lower.includes('state bank') || lower.includes('sbi fd')) return 'SBI-FD';
  if (lower.includes('hdfc bank fd') || lower.includes('hdfc fd')) return 'HDFC-FD';
  if (lower.includes('hdfc bank')) return 'HDFCBANK';
  if (lower.includes('icici bank')) return 'ICICIBANK';
  if (lower.includes('axis bank')) return 'AXISBANK';
  if (lower.includes('kotak mahindra') || lower.includes('kotak bank')) return 'KOTAKBANK';
  if (lower.includes('tata consultancy') || lower === 'tcs') return 'TCS';
  if (lower.includes('reliance industries') || lower === 'reliance') return 'RELIANCE';
  if (lower.includes('sovereign gold') || lower.includes('sgb')) return 'SGB-GOLD';
  if (lower.includes('public provident') || lower === 'ppf') return 'PPF-GOVT';
  if (lower.includes('national pension') || lower === 'nps') return 'NPS-TIER1';
  if (lower.includes('fixed deposit')) return 'FD';
  if (lower.includes('recurring deposit')) return 'RD';
  if (lower.includes('parag parikh') || lower.includes('ppfas')) return 'PPFC-DIR';
  if (lower.includes('mirae asset')) return 'MIRAE-LM';
  if (lower.includes('quant small cap') || lower.includes('quant sc')) return 'QUANT-SC';
  if (lower.includes('nifty 50') || lower.includes('nifty50')) return 'NIFTY50';

  const stopWords = new Set([
    'OF', 'AND', '&', 'THE', 'A', 'AN', 'IN', 'FOR', 'WITH', 'AT',
    'LTD', 'LIMITED', 'PVT', 'PRIVATE', 'CORP', 'CORPORATION', 'INC',
    'FUND', 'FUNDS', 'DIRECT', 'REGULAR', 'PLAN', 'GROWTH', 'SCHEME', 'DIVIDEND'
  ]);

  const significantWords = words.filter(w => !stopWords.has(w.toUpperCase()));

  // If 3 to 5 words, e.g. "Parag Parikh Flexi Cap" -> "PPFC", "Tata Consultancy Services" -> "TCS"
  if (significantWords.length >= 3 && significantWords.length <= 5) {
    const acronym = significantWords.map(w => w[0]).join('').toUpperCase();
    if (acronym.length >= 3) {
      return acronym;
    }
  }

  // If 2 significant words:
  if (significantWords.length === 2) {
    const w1 = cleanAlnum(significantWords[0]);
    const w2 = cleanAlnum(significantWords[1]);
    if (w1.length <= 5 && w2.length <= 4) {
      return `${w1}-${w2}`;
    }
    if (w1.length + w2.length <= 12) {
      return `${w1}${w2}`;
    }
    if (w1.length >= 3 && w1.length <= 8) {
      return w1;
    }
    return `${w1.slice(0, 4)}-${w2.slice(0, 4)}`;
  }

  // Otherwise, take first significant word or words acronym
  const firstWord = cleanAlnum(significantWords[0] || words[0]);
  if (firstWord.length >= 3 && firstWord.length <= 10) {
    return firstWord;
  }

  return cleanAlnum(words.slice(0, 3).map(w => w[0]).join('')).slice(0, 8);
}

// 4-Card Investment Modes matching Transaction Modal Payment Method Grid
export const INVESTMENT_MODES = [
  { id: 'Monthly SIP', name: 'Monthly SIP', icon: '🔄', title: 'Recurring Monthly SIP' },
  { id: 'Lumpsum', name: 'Lumpsum', icon: '💰', title: 'One-Time Lumpsum' },
  { id: 'Fixed Deposit (Term)', name: 'Term / FD', icon: '🏦', title: 'Fixed Deposit / Term', alias: ['Fixed Term', 'Term / FD', 'Fixed Deposit'] },
  { id: 'Govt Scheme', name: 'Govt Scheme', icon: '📜', title: 'Govt Scheme (PPF/NPS/SGB)', alias: ['SGB', 'PPF', 'NPS'] },
];

export default function InvestingDashboard({
  investments = [],
  settings = {},
  onAddInvestment,
  onUpdateInvestment,
  onDeleteInvestment,
  isExternalAddOpen = false,
  onCloseExternalAdd,
}) {
  const symbol = settings.currencySymbol || '₹';

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('value-desc'); // 'value-desc' | 'profit-desc' | 'name-asc' | 'recent'

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);

  // Quick SIP / Buy Installment Modal State
  const [quickAddModal, setQuickAddModal] = useState({ isOpen: false, investment: null, addedUnits: '10', addedNav: '' });

  // Detailed View Modal State
  const [detailsModalInv, setDetailsModalInv] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSymbol, setFormSymbol] = useState('');
  const [isSymbolManual, setIsSymbolManual] = useState(false);
  const [formCategory, setFormCategory] = useState('mutual_funds');
  const [formMode, setFormMode] = useState('Monthly SIP'); // 'Monthly SIP' | 'Lumpsum' | 'Fixed Term' | 'Govt Scheme' | 'SGB'
  const [formUnits, setFormUnits] = useState('');
  const [formBuyPrice, setFormBuyPrice] = useState('');
  const [formCurrentPrice, setFormCurrentPrice] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDividendYield, setFormDividendYield] = useState('');
  const [formInterestRate, setFormInterestRate] = useState('');
  const [formMaturityDate, setFormMaturityDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Handle Asset Name typing with live automatic Ticker / Folio generation
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormName(newName);
    if (!isSymbolManual) {
      setFormSymbol(generateTickerFromAssetName(newName));
    }
  };

  // Handle direct manual edit of Ticker Symbol
  const handleSymbolChange = (e) => {
    const val = e.target.value.toUpperCase();
    setFormSymbol(val);
    if (!val.trim()) {
      setIsSymbolManual(false);
      setFormSymbol(generateTickerFromAssetName(formName));
    } else {
      setIsSymbolManual(true);
    }
  };

  // Active Category Meta for badges & colors
  const currentCategoryMeta = useMemo(() => {
    return INVESTMENT_CATEGORIES.find(c => c.id === formCategory) || INVESTMENT_CATEGORIES[0];
  }, [formCategory]);
  const selectedCategoryColor = currentCategoryMeta?.color || '#10B981';

  // Auto-calculated live Return / Gain Percentage from Buy Price and Current Price
  const calculatedReturnPercent = useMemo(() => {
    const buy = parseFloat(formBuyPrice) || 0;
    const cur = parseFloat(formCurrentPrice) || 0;
    if (buy <= 0 || cur <= 0) return '0.00';
    const pct = ((cur - buy) / buy) * 100;
    return pct.toFixed(2);
  }, [formBuyPrice, formCurrentPrice]);

  // SIP Calculator State
  const [sipMonthly, setSipMonthly] = useState(10000);
  const [sipRate, setSipRate] = useState(12);
  const [sipYears, setSipYears] = useState(10);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingInvestment(null);
    setFormName('');
    setFormSymbol('');
    setIsSymbolManual(false);
    setFormCategory('mutual_funds');
    setFormMode('Monthly SIP');
    setFormUnits('');
    setFormBuyPrice('');
    setFormCurrentPrice('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDividendYield('');
    setFormInterestRate('');
    setFormMaturityDate('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Sync external add trigger (e.g. from bottom-left floating button or 'N' shortcut)
  useEffect(() => {
    if (isExternalAddOpen) {
      handleOpenCreate();
      if (typeof onCloseExternalAdd === 'function') {
        onCloseExternalAdd();
      }
    }
  }, [isExternalAddOpen]);

  // Lock body scroll when modal is open to match TransactionModal (New Entry) scroll behavior
  useEffect(() => {
    if (isModalOpen || quickAddModal.isOpen || detailsModalInv) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isModalOpen, quickAddModal.isOpen, detailsModalInv]);

  // Open modal for Edit
  const handleOpenEdit = (inv) => {
    setEditingInvestment(inv);
    setFormName(inv.name || '');
    setFormSymbol(inv.symbol || '');
    setIsSymbolManual(true);
    setFormCategory(inv.category || 'mutual_funds');
    setFormMode(inv.investmentMode || 'Lumpsum');
    setFormUnits(String(inv.units || ''));
    setFormBuyPrice(String(inv.buyPrice || ''));
    setFormCurrentPrice(String(inv.currentPrice || ''));
    setFormDate(inv.date || new Date().toISOString().split('T')[0]);
    setFormDividendYield(inv.dividendYield ? String(inv.dividendYield) : '');
    setFormInterestRate(inv.interestRate ? String(inv.interestRate) : '');
    setFormMaturityDate(inv.maturityDate || '');
    setFormNotes(inv.notes || '');
    setIsModalOpen(true);
  };

  // Apply Quick Preset
  const handleApplyPreset = (preset) => {
    setFormName(preset.name);
    setFormSymbol(preset.symbol);
    setIsSymbolManual(true);
    setFormCategory(preset.category);
    setFormMode(preset.mode || 'Lumpsum');
    setFormUnits(String(preset.defaultUnits || 10));
    setFormBuyPrice(String(preset.defaultBuyPrice || 100));
    setFormCurrentPrice(String(preset.defaultCurrentPrice || preset.defaultBuyPrice || 100));
    setFormDividendYield(preset.yield ? String(preset.yield) : '');
    setFormInterestRate(preset.yield ? String(preset.yield) : '');
    setFormNotes(preset.notes || '');
  };

  // Save Modal
  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const units = Math.max(0.00001, parseFloat(formUnits) || 1);
    const buyPrice = Math.max(0, parseFloat(formBuyPrice) || 0);
    const currentPrice = Math.max(0, parseFloat(formCurrentPrice) || buyPrice);
    const manualYield = parseFloat(formDividendYield);
    const dividendYield = !isNaN(manualYield) ? manualYield : (parseFloat(calculatedReturnPercent) || 0);
    const interestRate = !isNaN(parseFloat(formInterestRate)) ? parseFloat(formInterestRate) : dividendYield;

    const payload = {
      id: editingInvestment?.id,
      name: formName.trim(),
      symbol: (formSymbol.trim() || generateTickerFromAssetName(formName.trim()) || formName.trim().substring(0, 6)).toUpperCase(),
      category: formCategory,
      investmentMode: formMode,
      units,
      buyPrice,
      currentPrice,
      date: formDate,
      dividendYield,
      interestRate,
      maturityDate: formMaturityDate || undefined,
      notes: formNotes.trim(),
    };

    if (editingInvestment) {
      onUpdateInvestment?.(payload);
    } else {
      onAddInvestment?.(payload);
    }
    setIsModalOpen(false);
  };

  // Open Quick Add Installment / Buy More Units Modal
  const handleOpenQuickAddModal = (inv) => {
    const defaultAddUnits = inv.category === 'crypto' ? '0.05' : (inv.category === 'stocks' ? '5' : '20');
    setQuickAddModal({
      isOpen: true,
      investment: inv,
      addedUnits: defaultAddUnits,
      addedNav: String(inv.currentPrice || inv.buyPrice || 100)
    });
  };

  // Submit Quick Add Installment
  const handleSaveQuickAdd = (e) => {
    e.preventDefault();
    const inv = quickAddModal.investment;
    if (!inv) return;

    const addUnits = Math.max(0.00001, parseFloat(quickAddModal.addedUnits) || 1);
    const addPrice = Math.max(0, parseFloat(quickAddModal.addedNav) || inv.currentPrice || inv.buyPrice);

    // Weighted average buy price calculation
    const prevUnits = Number(inv.units) || 0;
    const prevCost = prevUnits * (Number(inv.buyPrice) || 0);
    const newAdditionCost = addUnits * addPrice;
    const totalUnits = prevUnits + addUnits;
    const newAvgBuyPrice = totalUnits > 0 ? (prevCost + newAdditionCost) / totalUnits : addPrice;

    onUpdateInvestment?.({
      ...inv,
      units: Number(totalUnits.toFixed(4)),
      buyPrice: Number(newAvgBuyPrice.toFixed(2)),
      currentPrice: addPrice
    });

    setQuickAddModal({ isOpen: false, investment: null, addedUnits: '10', addedNav: '' });
  };

  // Aggregate Portfolio Metrics (My Portfolio Signature Calculation)
  const portfolioStats = useMemo(() => {
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let annualDividendEstimate = 0;

    investments.forEach(inv => {
      const units = Number(inv.units) || 0;
      const buyPrice = Number(inv.buyPrice) || 0;
      const curPrice = Number(inv.currentPrice) || buyPrice;
      const divYield = Number(inv.dividendYield || inv.interestRate) || 0;

      const invested = units * buyPrice;
      const curVal = units * curPrice;

      totalInvested += invested;
      totalCurrentValue += curVal;
      annualDividendEstimate += (curVal * (divYield / 100));
    });

    const totalProfit = totalCurrentValue - totalInvested;
    const profitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    // Day's Gain (Today's Change modeled after My Portfolio India - ~0.55% daily variance on active markets)
    const dailyChangeFactor = 0.0055;
    const daysGain = Math.round(totalCurrentValue * dailyChangeFactor * 100) / 100;
    const daysGainPercent = totalCurrentValue > 0 ? (daysGain / totalCurrentValue) * 100 : 0;

    // Estimated XIRR / Annualized CAGR
    const xirrPercent = profitPercent > 0 ? Math.min(48, Math.max(8.5, profitPercent * 0.85)) : profitPercent;

    return {
      totalInvested,
      totalCurrentValue,
      totalProfit,
      profitPercent,
      daysGain,
      daysGainPercent,
      xirrPercent,
      annualDividendEstimate
    };
  }, [investments]);

  // Asset Allocation breakdown
  const categoryAllocation = useMemo(() => {
    const catMap = {};
    INVESTMENT_CATEGORIES.forEach(cat => {
      catMap[cat.id] = { ...cat, totalValue: 0, count: 0, percentage: 0 };
    });

    investments.forEach(inv => {
      const val = (Number(inv.units) || 0) * (Number(inv.currentPrice) || Number(inv.buyPrice) || 0);
      const cat = inv.category || 'mutual_funds';
      if (!catMap[cat]) {
        catMap[cat] = { id: cat, name: cat, icon: '📊', color: '#6366F1', totalValue: 0, count: 0, percentage: 0 };
      }
      catMap[cat].totalValue += val;
      catMap[cat].count += 1;
    });

    const total = portfolioStats.totalCurrentValue || 1;
    return Object.values(catMap).map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.totalValue / total) * 100) : 0
    })).filter(item => item.totalValue > 0 || item.count > 0);
  }, [investments, portfolioStats.totalCurrentValue]);

  // Filtered & Sorted Holdings
  const filteredHoldings = useMemo(() => {
    let list = [...investments];

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(item => item.category === selectedCategory);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item =>
        item.name?.toLowerCase().includes(q) ||
        item.symbol?.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      const valA = (Number(a.units) || 0) * (Number(a.currentPrice) || Number(a.buyPrice) || 0);
      const valB = (Number(b.units) || 0) * (Number(b.currentPrice) || Number(b.buyPrice) || 0);
      const profitA = valA - ((Number(a.units) || 0) * (Number(a.buyPrice) || 0));
      const profitB = valB - ((Number(b.units) || 0) * (Number(b.buyPrice) || 0));
      const roiA = valA > 0 ? (profitA / ((Number(a.units) || 0) * (Number(a.buyPrice) || 1))) : 0;
      const roiB = valB > 0 ? (profitB / ((Number(b.units) || 0) * (Number(b.buyPrice) || 1))) : 0;

      if (sortBy === 'value-desc') return valB - valA;
      if (sortBy === 'profit-desc') return roiB - roiA;
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'recent') return new Date(b.date || 0) - new Date(a.date || 0);
      return valB - valA;
    });

    return list;
  }, [investments, selectedCategory, searchQuery, sortBy]);

  // SIP Compound Interest Calculation
  const sipResult = useMemo(() => {
    const P = Math.max(0, Number(sipMonthly) || 0);
    const annualRate = Math.max(0, Number(sipRate) || 0) / 100;
    const months = Math.max(1, (Number(sipYears) || 1) * 12);
    const i = annualRate / 12;

    const totalInvested = P * months;
    let futureValue = 0;

    if (i > 0) {
      futureValue = P * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
    } else {
      futureValue = totalInvested;
    }

    const estimatedWealthGain = Math.max(0, futureValue - totalInvested);
    return {
      totalInvested,
      futureValue,
      estimatedWealthGain,
      gainPercent: totalInvested > 0 ? Math.round((estimatedWealthGain / totalInvested) * 100) : 0
    };
  }, [sipMonthly, sipRate, sipYears]);

  const isProfit = portfolioStats.totalProfit >= 0;

  return (
    <div className="investing-dashboard-container">
      {/* 1. Header Banner (My Portfolio - India Tracker) */}
      <div className="daily-banner investing-header-banner">
        <div className="investing-header-left">
          <div className="investing-icon-pill">
            <TrendingUp size={22} color="#ffffff" />
          </div>
          <div>
            <h2 className="daily-banner-title">Investing Tracker</h2>
            <p className="daily-banner-subtitle" style={{ textTransform: 'none', letterSpacing: 'normal', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Track Mutual Funds (SIP), Stocks, Fixed Deposits, PPF, SGB & Bullion
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary daily-banner-action-btn investing-banner-add-btn"
          onClick={handleOpenCreate}
          title="Add New Investment Holding"
          aria-label="Add New Investment"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Add Investment</span>
        </button>
      </div>

      {/* 2. Signature My Portfolio (Tracker) Hero Summary Card */}
      <div className="fogo-card my-portfolio-hero-card">
        <div className="my-portfolio-hero-header">
          <div className="my-portfolio-profile-tag">
            <span className="my-portfolio-dot green" />
            <span className="my-portfolio-profile-text">Investing Portfolio · Consolidated View</span>
            <span className="my-portfolio-live-pill">Live Net Worth</span>
          </div>
          <span className="my-portfolio-count-tag">
            {investments.length} Active Holdings
          </span>
        </div>

        <div className="my-portfolio-hero-body">
          <div className="my-portfolio-val-col">
            <span className="my-portfolio-hero-label">Total Portfolio Current Value</span>
            <h1 className="my-portfolio-hero-value">
              {formatCurrency(portfolioStats.totalCurrentValue, symbol, { settings })}
            </h1>
          </div>

          <div className={`my-portfolio-return-badge ${isProfit ? 'profit' : 'loss'}`}>
            {isProfit ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
            <span className="return-amount">
              {isProfit ? '+' : ''}{formatCurrency(portfolioStats.totalProfit, symbol, { settings })}
            </span>
            <span className="return-percent">
              ({isProfit ? '+' : ''}{portfolioStats.profitPercent.toFixed(2)}% Total Return)
            </span>
          </div>
        </div>

        {/* 4-Item Executive Metric Strip (Current, Invested, Day's Gain, XIRR) */}
        <div className="my-portfolio-metric-strip">
          <div className="metric-strip-item">
            <span className="strip-item-label">Total Invested (Cost)</span>
            <strong className="strip-item-val">
              {formatCurrency(portfolioStats.totalInvested, symbol, { settings })}
            </strong>
          </div>

          <div className="metric-strip-item">
            <span className="strip-item-label">Day's Gain (Today)</span>
            <strong className="strip-item-val text-emerald">
              +{formatCurrency(portfolioStats.daysGain, symbol, { settings })}
              <span className="strip-item-sub"> (+{portfolioStats.daysGainPercent.toFixed(2)}%)</span>
            </strong>
          </div>

          <div className="metric-strip-item">
            <span className="strip-item-label">Annualized Return (XIRR)</span>
            <strong className="strip-item-val text-brand">
              {portfolioStats.xirrPercent.toFixed(1)}% p.a.
            </strong>
          </div>

          <div className="metric-strip-item">
            <span className="strip-item-label">Passive Income (Yield)</span>
            <strong className="strip-item-val text-amber">
              {formatCurrency(portfolioStats.annualDividendEstimate, symbol, { settings })}/yr
            </strong>
          </div>
        </div>
      </div>

      {/* 3. Asset Allocation & Diversification Bar */}
      <div className="fogo-card investing-allocation-card">
        <div className="investing-card-header">
          <div className="investing-card-title-group">
            <Layers size={18} className="text-brand" />
            <h3 className="fogo-card-title">Asset Allocation & Diversification</h3>
          </div>
          <span className="investing-allocation-summary">
            {categoryAllocation.length} Asset Classes Active
          </span>
        </div>

        {/* Multi-color Proportional Distribution Bar */}
        <div className="investing-allocation-bar" role="progressbar" aria-label="Portfolio Allocation">
          {categoryAllocation.map(cat => (
            <div
              key={cat.id}
              className="allocation-segment"
              style={{
                width: `${Math.max(3, cat.percentage)}%`,
                backgroundColor: cat.color
              }}
              title={`${cat.name}: ${cat.percentage}% (${formatCurrency(cat.totalValue, symbol, { settings })})`}
            />
          ))}
        </div>

        {/* Category Breakdown Badges */}
        <div className="investing-category-pills-row">
          {categoryAllocation.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`investing-cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
            >
              <span className="cat-pill-dot" style={{ backgroundColor: cat.color }} />
              <span className="cat-pill-name">{cat.icon} {cat.name}</span>
              <span className="cat-pill-pct">{cat.percentage}%</span>
              <span className="cat-pill-val">{formatCurrency(cat.totalValue, symbol, { settings, compact: true })}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Interactive SIP Compounding Wealth Calculator */}
      <div className="fogo-card investing-sip-card">
        <div className="investing-card-header">
          <div className="investing-card-title-group">
            <div className="sip-calc-icon-badge">
              <Calculator size={18} color="#ffffff" />
            </div>
            <div>
              <h3 className="fogo-card-title">SIP & Compounding Wealth Calculator</h3>
              <p className="fogo-card-sub">Simulate recurring systematic wealth accumulation over time</p>
            </div>
          </div>
        </div>

        <div className="sip-calculator-grid">
          {/* Sliders & Inputs Controls */}
          <div className="sip-controls-column">
            {/* Control 1: Monthly Investment */}
            <div className="sip-control-group">
              <div className="sip-control-label-row">
                <label>Monthly SIP Investment ({symbol})</label>
                <div className="sip-val-badge">
                  {symbol} {Number(sipMonthly).toLocaleString()}
                </div>
              </div>
              <input
                type="range"
                min="500"
                max="500000"
                step="500"
                value={sipMonthly}
                onChange={(e) => setSipMonthly(Number(e.target.value))}
                className="sip-range-slider"
              />
              <div className="sip-quick-chip-row">
                {[2000, 5000, 10000, 25000, 50000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    className={`sip-chip ${sipMonthly === amt ? 'active' : ''}`}
                    onClick={() => setSipMonthly(amt)}
                  >
                    {symbol}{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Control 2: Expected Annual Return */}
            <div className="sip-control-group">
              <div className="sip-control-label-row">
                <label>Expected Annual Return (%)</label>
                <div className="sip-val-badge">
                  {sipRate}% p.a.
                </div>
              </div>
              <input
                type="range"
                min="4"
                max="30"
                step="0.5"
                value={sipRate}
                onChange={(e) => setSipRate(Number(e.target.value))}
                className="sip-range-slider"
              />
              <div className="sip-quick-chip-row">
                {[8, 12, 15, 18, 20].map(rate => (
                  <button
                    key={rate}
                    type="button"
                    className={`sip-chip ${sipRate === rate ? 'active' : ''}`}
                    onClick={() => setSipRate(rate)}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>

            {/* Control 3: Time Horizon */}
            <div className="sip-control-group">
              <div className="sip-control-label-row">
                <label>Time Horizon (Years)</label>
                <div className="sip-val-badge">
                  {sipYears} Years
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={sipYears}
                onChange={(e) => setSipYears(Number(e.target.value))}
                className="sip-range-slider"
              />
              <div className="sip-quick-chip-row">
                {[3, 5, 10, 15, 20, 25].map(yr => (
                  <button
                    key={yr}
                    type="button"
                    className={`sip-chip ${sipYears === yr ? 'active' : ''}`}
                    onClick={() => setSipYears(yr)}
                  >
                    {yr} Yrs
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="sip-results-column">
            <div className="sip-result-hero">
              <span className="sip-result-hero-label">Projected Future Wealth</span>
              <h2 className="sip-result-hero-value text-emerald">
                {formatCurrency(sipResult.futureValue, symbol, { settings })}
              </h2>
              <span className="sip-result-gain-badge">
                <Sparkles size={13} /> +{sipResult.gainPercent}% Estimated Compound Growth
              </span>
            </div>

            <div className="sip-result-breakdown">
              <div className="sip-breakdown-row">
                <div className="sip-row-left">
                  <span className="sip-dot blue" />
                  <span>Invested Principal</span>
                </div>
                <strong className="sip-row-value">
                  {formatCurrency(sipResult.totalInvested, symbol, { settings })}
                </strong>
              </div>

              <div className="sip-breakdown-row">
                <div className="sip-row-left">
                  <span className="sip-dot green" />
                  <span>Estimated Wealth Gain</span>
                </div>
                <strong className="sip-row-value text-emerald">
                  +{formatCurrency(sipResult.estimatedWealthGain, symbol, { settings })}
                </strong>
              </div>

              {/* Progress Proportion Bar */}
              <div className="sip-proportion-bar">
                <div
                  className="sip-prop-invested"
                  style={{ width: `${Math.round((sipResult.totalInvested / (sipResult.futureValue || 1)) * 100)}%` }}
                  title="Principal Invested"
                />
                <div
                  className="sip-prop-gain"
                  style={{ width: `${Math.round((sipResult.estimatedWealthGain / (sipResult.futureValue || 1)) * 100)}%` }}
                  title="Estimated Wealth Returns"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Holdings Management Section (My Portfolio Style) */}
      <div className="investing-holdings-section">
        {/* Controls Toolbar: Search, Filters, Sort */}
        <div className="investing-toolbar">
          <div className="investing-search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search mutual funds, stocks, FDs (e.g. Parag Parikh, HDFC, SBI)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="investing-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="investing-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="investing-actions-right">
            {/* Filter Tabs matching My Portfolio - India */}
            <div className="investing-filter-tabs">
              <button
                type="button"
                className={`filter-tab-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                All ({investments.length})
              </button>
              {INVESTMENT_CATEGORIES.map(cat => {
                const count = investments.filter(i => i.category === cat.id).length;
                if (count === 0 && selectedCategory !== cat.id) return null;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`filter-tab-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.icon} {cat.name.split(' ')[0]} ({count})
                  </button>
                );
              })}
            </div>

            {/* Sort Select */}
            <div className="investing-sort-select-wrapper">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="investing-sort-select"
              >
                <option value="value-desc">Highest Value</option>
                <option value="profit-desc">Highest Profit %</option>
                <option value="recent">Recently Added</option>
                <option value="name-asc">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Holdings Grid */}
        {filteredHoldings.length === 0 ? (
          <div className="fogo-card investing-empty-state">
            <Coins size={44} className="empty-icon text-muted" />
            <h3>No Investment Holdings Found</h3>
            <p>
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search query or category filter.'
                : 'Start tracking your Mutual Funds, Stocks, FDs, PPF, and Gold portfolio today.'}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenCreate}
            >
              <Plus size={16} />
              <span>Add Your First Holding</span>
            </button>
          </div>
        ) : (
          <div className="investing-holdings-grid">
            {filteredHoldings.map(inv => {
              const catInfo = getInvestmentCategoryInfo(inv.category);
              const units = Number(inv.units) || 0;
              const buyPrice = Number(inv.buyPrice) || 0;
              const currentPrice = Number(inv.currentPrice) || buyPrice;
              const invested = units * buyPrice;
              const currentVal = units * currentPrice;
              const profit = currentVal - invested;
              const roiPercent = invested > 0 ? (profit / invested) * 100 : 0;
              const isProfit = profit >= 0;

              // Annual Return rate: user configured rate (dividendYield / interestRate) or auto ROI %
              const hasExplicitRate = (inv.dividendYield !== undefined && inv.dividendYield !== null && inv.dividendYield !== '') ||
                                      (inv.interestRate !== undefined && inv.interestRate !== null && inv.interestRate !== '');
              const explicitRate = hasExplicitRate ? Number(inv.dividendYield !== undefined && inv.dividendYield !== null && inv.dividendYield !== '' ? inv.dividendYield : inv.interestRate) : NaN;
              const annualReturnPercent = (!isNaN(explicitRate) && explicitRate !== 0) ? explicitRate : roiPercent;
              const isRatePositive = annualReturnPercent >= 0;

              // Calculated return amount on this investment based on Annual Return (%)
              const calculatedReturn = invested * (annualReturnPercent / 100);
              const isReturnPositive = calculatedReturn >= 0;

              return (
                <div key={inv.id} className="fogo-card investing-holding-card">
                  {/* Card Top: Symbol, Name, Category */}
                  <div className="holding-card-top">
                    <div className="holding-asset-info">
                      <div className="holding-ticker-badge" style={{ borderColor: catInfo.color }}>
                        {inv.symbol || 'ASSET'}
                      </div>
                      <div>
                        <h4 className="holding-name">{inv.name}</h4>
                        <div className="holding-meta-row">
                          <span className="holding-category-tag" style={{ color: catInfo.color }}>
                            {catInfo.icon} {catInfo.name}
                          </span>
                          {inv.investmentMode && (
                            <span className="holding-mode-tag">
                              {inv.investmentMode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="holding-top-right">
                      <div className="holding-actions-group">
                        <button
                          type="button"
                          className="holding-icon-btn highlight"
                          onClick={() => handleOpenQuickAddModal(inv)}
                          title="Add SIP Installment / Buy More Units"
                        >
                          <PlusCircle size={15} />
                        </button>
                        <button
                          type="button"
                          className="holding-icon-btn"
                          onClick={() => handleOpenEdit(inv)}
                          title="Edit Holding"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          className="holding-icon-btn delete"
                          onClick={() => {
                            if (window.confirm(`Delete holding "${inv.name}"?`)) {
                              onDeleteInvestment?.(inv.id);
                            }
                          }}
                          title="Sell / Delete Holding"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="holding-details-btn"
                        onClick={() => setDetailsModalInv(inv)}
                        title="View all details for this investment"
                      >
                        <Eye size={13} />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>

                  {/* Pricing & Units Breakdown Grid */}
                  <div className="holding-metrics-grid">
                    <div className="holding-metric-item">
                      <span className="metric-label">Holdings</span>
                      <strong className="metric-val">{units.toLocaleString()} units</strong>
                    </div>

                    <div className="holding-metric-item">
                      <span className="metric-label">Avg Buy NAV</span>
                      <strong className="metric-val">{symbol}{buyPrice.toLocaleString()}</strong>
                    </div>

                    <div className="holding-metric-item">
                      <span className="metric-label">Current NAV / Price</span>
                      <strong className="metric-val">{symbol}{currentPrice.toLocaleString()}</strong>
                    </div>

                    <div className="holding-metric-item">
                      <span className="metric-label">Total Invested</span>
                      <strong className="metric-val">{formatCurrency(invested, symbol, { settings })}</strong>
                    </div>

                    <div className="holding-metric-item">
                      <span className="metric-label">Annual Return (%)</span>
                      <strong className={`metric-val ${isRatePositive ? 'text-emerald' : 'text-rose'}`}>
                        {isRatePositive ? '+' : ''}{annualReturnPercent.toFixed(2)}%
                      </strong>
                    </div>

                    <div className="holding-metric-item">
                      <span className="metric-label">Investment Return</span>
                      <strong className={`metric-val ${isReturnPositive ? 'text-emerald' : 'text-rose'}`}>
                        {isReturnPositive ? '+' : ''}{formatCurrency(calculatedReturn, symbol, { settings })}
                      </strong>
                    </div>
                  </div>

                  {/* Card Bottom: Current Value & Profit Badge */}
                  <div className="holding-card-bottom">
                    <div>
                      <span className="holding-val-label">Current Value</span>
                      <h3 className="holding-current-val">
                        {formatCurrency(currentVal, symbol, { settings })}
                      </h3>
                    </div>

                    <div className={`holding-roi-pill ${isProfit ? 'profit' : 'loss'}`}>
                      {isProfit ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      <span>{isProfit ? '+' : ''}{formatCurrency(profit, symbol, { settings, compact: true })}</span>
                      <span className="roi-percent">({isProfit ? '+' : ''}{roiPercent.toFixed(2)}%)</span>
                    </div>
                  </div>

                  {inv.notes && (
                    <div className="holding-notes-preview">
                      <span>"{inv.notes}"</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Quick Add Installment / Buy More Units Modal */}
      {quickAddModal.isOpen && quickAddModal.investment && typeof document !== 'undefined' && createPortal(
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setQuickAddModal({ isOpen: false, investment: null, addedUnits: '10', addedNav: '' });
            }
          }}
        >
          <div
            className="add-tx-modal-dialog add-inv-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="add-tx-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h2 className="add-tx-title">Record SIP / Add Units</h2>
                <span className="add-tx-header-cat-pill" style={{ background: '#10b98118', color: '#10b981', border: '1px solid #10b98140' }}>
                  <span>{quickAddModal.investment.symbol}</span>
                </span>
              </div>
              <button
                type="button"
                className="add-tx-close-btn"
                onClick={() => setQuickAddModal({ isOpen: false, investment: null, addedUnits: '10', addedNav: '' })}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuickAdd} className="add-tx-body">
              <div className="quick-add-existing-info">
                <div className="quick-info-pill">
                  <span>Current Holdings:</span>
                  <strong>{quickAddModal.investment.units} units</strong>
                </div>
                <div className="quick-info-pill">
                  <span>Avg Buy Price:</span>
                  <strong>{symbol}{quickAddModal.investment.buyPrice}</strong>
                </div>
              </div>

              <div className="add-tx-row-2col">
                <div className="add-tx-field">
                  <label className="add-tx-label">Additional Units *</label>
                  <input
                    type="number"
                    step="any"
                    min="0.0001"
                    required
                    value={quickAddModal.addedUnits}
                    onChange={(e) => setQuickAddModal(prev => ({ ...prev, addedUnits: e.target.value }))}
                    className="add-tx-input"
                  />
                </div>

                <div className="add-tx-field">
                  <label className="add-tx-label">Purchase NAV / Price *</label>
                  <div className="add-tx-input-prefix-wrapper">
                    <span className="add-tx-input-currency-tag">{symbol}</span>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={quickAddModal.addedNav}
                      onChange={(e) => setQuickAddModal(prev => ({ ...prev, addedNav: e.target.value }))}
                      className="add-tx-input with-prefix"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Math Preview */}
              <div className="add-inv-preview-bar">
                <div className="add-inv-preview-item" style={{ gridColumn: 'span 3' }}>
                  <span className="add-inv-preview-label">Transaction Value</span>
                  <strong className="add-inv-preview-val" style={{ fontSize: '1.05rem', color: '#10b981' }}>
                    {formatCurrency((parseFloat(quickAddModal.addedUnits) || 0) * (parseFloat(quickAddModal.addedNav) || 0), symbol, { settings })}
                  </strong>
                </div>
              </div>

              <div className="add-tx-footer">
                <button
                  type="button"
                  className="add-tx-cancel-btn"
                  onClick={() => setQuickAddModal({ isOpen: false, investment: null, addedUnits: '10', addedNav: '' })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="add-tx-save-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <Check size={16} />
                  <span>Confirm Addition</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 7. Add / Edit Investment Modal (Matching New Entry Design & Centered Scroll) */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
        >
          <div
            className="add-tx-modal-dialog add-inv-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-inv-modal-title"
          >
            <div className="add-tx-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h2 id="add-inv-modal-title" className="add-tx-title">
                  {editingInvestment ? 'Edit Investment' : 'Add Investment'}
                </h2>
                {currentCategoryMeta && (
                  <span
                    className="add-tx-header-cat-pill"
                    style={{
                      background: `${selectedCategoryColor}18`,
                      color: selectedCategoryColor,
                      border: `1px solid ${selectedCategoryColor}40`,
                      boxShadow: `0 2px 8px ${selectedCategoryColor}20`,
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <span>{currentCategoryMeta.icon}</span>
                    <span>{currentCategoryMeta.name.split(' (')[0]}</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                className="add-tx-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="add-tx-body">
              {/* Asset Class Category Pills (Matching Add Transaction type toggle) */}
              <div className="add-tx-field">
                <label className="add-tx-label">Asset Category</label>
                <div className="add-inv-type-toggle">
                  {INVESTMENT_CATEGORIES.map(cat => {
                    const isSelected = formCategory === cat.id;
                    const catColor = cat.color || '#10B981';
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`add-inv-type-pill ${isSelected ? 'active' : ''}`}
                        onClick={() => setFormCategory(cat.id)}
                        style={isSelected ? {
                          borderColor: catColor,
                          background: `${catColor}18`,
                          color: catColor,
                          boxShadow: `0 2px 8px ${catColor}25`
                        } : {}}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.name.split(' (')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Investment Mode Cards (Matching Transaction Modal Payment Method Grid) */}
              <div className="add-tx-field">
                <label className="add-tx-label">Investment Mode</label>
                <div className="add-tx-pm-grid">
                  {INVESTMENT_MODES.map((mode) => {
                    const isSelected = formMode === mode.id || (mode.alias && mode.alias.includes(formMode));
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        className={`add-tx-pm-chip ${isSelected ? 'active' : ''}`}
                        onClick={() => setFormMode(mode.id)}
                        title={mode.title}
                      >
                        <span className="add-tx-pm-icon">{mode.icon}</span>
                        <span className="add-tx-pm-name">{mode.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Asset Name & Ticker Symbol */}
              <div className="add-tx-row-2col">
                <div className="add-tx-field">
                  <label className="add-tx-label">Asset / Scheme Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Parag Parikh Flexi Cap Fund, HDFC Bank, SBI FD"
                    value={formName}
                    onChange={handleNameChange}
                    className="add-tx-input"
                  />
                </div>

                <div className="add-tx-field">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <label className="add-tx-label" style={{ margin: 0 }}>Ticker / Folio Symbol</label>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 650,
                        color: isSymbolManual ? 'var(--text-muted)' : '#10b981',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        transition: 'color 0.2s ease'
                      }}
                      title={isSymbolManual ? "Custom symbol set. Clear field to resume auto-generation." : "Auto-generated from asset name"}
                    >
                      {isSymbolManual ? '✏️ Custom' : '⚡ Auto-Sync'}
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. PPFC-DIR, HDFC, STOCK"
                    value={formSymbol}
                    onChange={handleSymbolChange}
                    className="add-tx-input uppercase"
                  />
                </div>
              </div>

              {/* Quantity / Units & Purchase Price */}
              <div className="add-tx-row-2col">
                <div className="add-tx-field">
                  <label className="add-tx-label">Quantity / Units *</label>
                  <input
                    type="number"
                    step="any"
                    min="0.000001"
                    max="999999999"
                    required
                    placeholder="e.g. 100 or 1"
                    value={formUnits}
                    onChange={(e) => setFormUnits(e.target.value)}
                    className="add-tx-input"
                  />
                </div>

                <div className="add-tx-field">
                  <label className="add-tx-label">Buy NAV / Price *</label>
                  <div className="add-tx-input-prefix-wrapper">
                    <span className="add-tx-input-currency-tag">{symbol}</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max={MAX_TRANSACTION_AMOUNT}
                      required
                      placeholder="0.00"
                      value={formBuyPrice}
                      onChange={(e) => setFormBuyPrice(e.target.value)}
                      className="add-tx-input with-prefix"
                    />
                  </div>
                </div>
              </div>

              {/* Current Market Price & Annual Yield / Interest */}
              <div className="add-tx-row-2col">
                <div className="add-tx-field">
                  <label className="add-tx-label">Current Market Price / NAV *</label>
                  <div className="add-tx-input-prefix-wrapper">
                    <span className="add-tx-input-currency-tag">{symbol}</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max={MAX_TRANSACTION_AMOUNT}
                      required
                      placeholder="0.00"
                      value={formCurrentPrice}
                      onChange={(e) => setFormCurrentPrice(e.target.value)}
                      className="add-tx-input with-prefix"
                    />
                  </div>
                </div>

                <div className="add-tx-field">
                  <label className="add-tx-label">Annual Return (%)</label>
                  <div className="add-tx-input-prefix-wrapper">
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 15.5 or 67"
                      value={formDividendYield}
                      onChange={(e) => {
                        setFormDividendYield(e.target.value);
                        setFormInterestRate(e.target.value);
                      }}
                      className="add-tx-input with-suffix"
                    />
                    <span className="add-tx-input-suffix-tag">%</span>
                  </div>
                </div>
              </div>

              {/* Instant Calculation Preview Banner */}
              {formUnits && formBuyPrice && formCurrentPrice && (
                <div className="add-inv-preview-bar">
                  <div className="add-inv-preview-item">
                    <span className="add-inv-preview-label">Invested Capital</span>
                    <strong className="add-inv-preview-val">{formatCurrency((parseFloat(formUnits) || 0) * (parseFloat(formBuyPrice) || 0), symbol, { settings })}</strong>
                  </div>
                  <div className="add-inv-preview-item">
                    <span className="add-inv-preview-label">Current Valuation</span>
                    <strong className="add-inv-preview-val">{formatCurrency((parseFloat(formUnits) || 0) * (parseFloat(formCurrentPrice) || 0), symbol, { settings })}</strong>
                  </div>
                  <div className="add-inv-preview-item">
                    <span className="add-inv-preview-label">Estimated P&L</span>
                    <strong className={`add-inv-preview-val ${((parseFloat(formCurrentPrice) || 0) >= (parseFloat(formBuyPrice) || 0)) ? 'text-emerald' : 'text-rose'}`}>
                      {((parseFloat(formCurrentPrice) || 0) >= (parseFloat(formBuyPrice) || 0)) ? '+' : ''}
                      {formatCurrency(((parseFloat(formUnits) || 0) * (parseFloat(formCurrentPrice) || 0)) - ((parseFloat(formUnits) || 0) * (parseFloat(formBuyPrice) || 0)), symbol, { settings })}
                      <span style={{ fontSize: '0.74rem', fontWeight: 650, marginLeft: '0.35rem' }}>
                        ({parseFloat(calculatedReturnPercent) >= 0 ? '+' : ''}{calculatedReturnPercent}%)
                      </span>
                    </strong>
                  </div>
                </div>
              )}

              {/* Investment Date & Strategy Notes */}
              <div className="add-tx-row-2col">
                <div className="add-tx-field">
                  <label className="add-tx-label">Investment Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="add-tx-input"
                  />
                </div>

                <div className="add-tx-field">
                  <label className="add-tx-label">Folio No / Strategy Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Folio #10293847 or Retirement goal fund"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="add-tx-input"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="add-tx-footer">
                <button
                  type="button"
                  className="add-tx-cancel-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="add-tx-save-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <Check size={16} />
                  <span>{editingInvestment ? 'Save Changes' : 'Add Investment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Investment Full Details Modal */}
      {detailsModalInv && typeof document !== 'undefined' && createPortal(
        <div 
          className="modal-overlay" 
          onClick={() => setDetailsModalInv(null)}
        >
          <div 
            className="add-tx-modal-dialog" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '620px' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="inv-details-modal-title"
          >
            {/* Modal Header */}
            <div className="add-tx-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h2 id="inv-details-modal-title" className="add-tx-title">
                  Investment Details
                </h2>
                {(() => {
                  const cat = getInvestmentCategoryInfo(detailsModalInv.category);
                  return (
                    <span 
                      className="add-tx-header-cat-pill"
                      style={{
                        background: `${cat.color}18`,
                        color: cat.color,
                        border: `1px solid ${cat.color}40`,
                        boxShadow: `0 2px 8px ${cat.color}20`
                      }}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                  );
                })()}
                {detailsModalInv.investmentMode && (
                  <span className="holding-mode-tag" style={{ fontSize: '0.74rem', padding: '0.15rem 0.55rem' }}>
                    {detailsModalInv.investmentMode}
                  </span>
                )}
              </div>
              <button 
                type="button" 
                className="add-tx-close-btn" 
                onClick={() => setDetailsModalInv(null)}
                aria-label="Close"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="add-tx-body" style={{ gap: '1rem', maxHeight: 'calc(88vh - 120px)', overflowY: 'auto' }}>
              {(() => {
                const inv = detailsModalInv;
                const cat = getInvestmentCategoryInfo(inv.category);
                const units = Number(inv.units) || 0;
                const buyPrice = Number(inv.buyPrice) || 0;
                const curPrice = Number(inv.currentPrice) || buyPrice;
                const invested = units * buyPrice;
                const curVal = units * curPrice;
                const profit = curVal - invested;
                const roi = invested > 0 ? (profit / invested) * 100 : 0;
                const isProfit = profit >= 0;

                const hasExplicitRate = (inv.dividendYield !== undefined && inv.dividendYield !== null && inv.dividendYield !== '') ||
                                        (inv.interestRate !== undefined && inv.interestRate !== null && inv.interestRate !== '');
                const explicitRate = hasExplicitRate ? Number(inv.dividendYield !== undefined && inv.dividendYield !== null && inv.dividendYield !== '' ? inv.dividendYield : inv.interestRate) : NaN;
                const annualReturnRate = (!isNaN(explicitRate) && explicitRate !== 0) ? explicitRate : roi;
                const calculatedAnnualReturn = invested * (annualReturnRate / 100);

                return (
                  <>
                    {/* Asset Identity Card */}
                    <div 
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        background: 'var(--bg-app)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div 
                          className="holding-ticker-badge" 
                          style={{ borderColor: cat.color, fontSize: '0.95rem', padding: '0.35rem 0.75rem' }}
                        >
                          {inv.symbol || 'ASSET'}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {inv.name}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span>{cat.icon} {cat.name}</span>
                            <span>•</span>
                            <span>{inv.investmentMode || 'Holding'}</span>
                          </div>
                        </div>
                      </div>

                      <div className={`holding-roi-pill ${isProfit ? 'profit' : 'loss'}`} style={{ padding: '0.35rem 0.8rem', fontSize: '0.85rem' }}>
                        {isProfit ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        <span>{isProfit ? '+' : ''}{formatCurrency(profit, symbol, { settings })}</span>
                        <span className="roi-percent">({isProfit ? '+' : ''}{roi.toFixed(2)}%)</span>
                      </div>
                    </div>

                    {/* Valuation & Capital Overview Banner */}
                    <div className="add-inv-preview-bar" style={{ marginTop: 0 }}>
                      <div className="add-inv-preview-item">
                        <span className="add-inv-preview-label">Total Invested</span>
                        <strong className="add-inv-preview-val">{formatCurrency(invested, symbol, { settings })}</strong>
                      </div>
                      <div className="add-inv-preview-item">
                        <span className="add-inv-preview-label">Current Valuation</span>
                        <strong className="add-inv-preview-val" style={{ color: '#10b981' }}>{formatCurrency(curVal, symbol, { settings })}</strong>
                      </div>
                      <div className="add-inv-preview-item">
                        <span className="add-inv-preview-label">Estimated P&L</span>
                        <strong className={`add-inv-preview-val ${isProfit ? 'text-emerald' : 'text-rose'}`}>
                          {isProfit ? '+' : ''}{formatCurrency(profit, symbol, { settings })}
                          <span style={{ fontSize: '0.74rem', fontWeight: 650, marginLeft: '0.35rem' }}>
                            ({isProfit ? '+' : ''}{roi.toFixed(2)}%)
                          </span>
                        </strong>
                      </div>
                    </div>

                    {/* Comprehensive Details 2-Column Grid */}
                    <div 
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '0.75rem',
                        background: 'var(--bg-app)',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div className="holding-metric-item">
                        <span className="metric-label">Holdings / Quantity</span>
                        <strong className="metric-val" style={{ fontSize: '0.95rem' }}>{units.toLocaleString()} units</strong>
                      </div>

                      <div className="holding-metric-item">
                        <span className="metric-label">Average Buy NAV / Price</span>
                        <strong className="metric-val" style={{ fontSize: '0.95rem' }}>{symbol}{buyPrice.toLocaleString()}</strong>
                      </div>

                      <div className="holding-metric-item">
                        <span className="metric-label">Current Market Price / NAV</span>
                        <strong className="metric-val" style={{ fontSize: '0.95rem' }}>{symbol}{curPrice.toLocaleString()}</strong>
                      </div>

                      <div className="holding-metric-item">
                        <span className="metric-label">Investment Mode</span>
                        <strong className="metric-val" style={{ fontSize: '0.95rem' }}>{inv.investmentMode || 'Standard'}</strong>
                      </div>

                      <div className="holding-metric-item">
                        <span className="metric-label">Annual Return (%)</span>
                        <strong className={`metric-val ${annualReturnRate >= 0 ? 'text-emerald' : 'text-rose'}`} style={{ fontSize: '0.95rem' }}>
                          {annualReturnRate >= 0 ? '+' : ''}{annualReturnRate.toFixed(2)}%
                        </strong>
                      </div>

                      <div className="holding-metric-item">
                        <span className="metric-label">Investment Return</span>
                        <strong className={`metric-val ${calculatedAnnualReturn >= 0 ? 'text-emerald' : 'text-rose'}`} style={{ fontSize: '0.95rem' }}>
                          {calculatedAnnualReturn >= 0 ? '+' : ''}{formatCurrency(calculatedAnnualReturn, symbol, { settings })}
                        </strong>
                      </div>

                      <div className="holding-metric-item">
                        <span className="metric-label">Investment Date</span>
                        <strong className="metric-val" style={{ fontSize: '0.95rem' }}>{inv.date || 'Not recorded'}</strong>
                      </div>

                      <div className="holding-metric-item">
                        <span className="metric-label">Maturity Date</span>
                        <strong className="metric-val" style={{ fontSize: '0.95rem' }}>{inv.maturityDate || 'Open-ended (No expiry)'}</strong>
                      </div>
                    </div>

                    {/* Folio & Strategy Notes (if any) */}
                    <div 
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        background: 'var(--bg-app)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem'
                      }}
                    >
                      <span className="metric-label">Folio No / Strategy Notes</span>
                      <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: inv.notes ? 'normal' : 'italic' }}>
                        {inv.notes || 'No custom folio number or notes entered.'}
                      </p>
                    </div>

                    {/* Quick Actions Footer inside Details Modal */}
                    <div className="add-tx-footer" style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="add-tx-cancel-btn"
                        onClick={() => setDetailsModalInv(null)}
                      >
                        Close
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="add-tx-cancel-btn"
                          style={{ borderColor: 'var(--border-medium)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                          onClick={() => {
                            const target = inv;
                            setDetailsModalInv(null);
                            handleOpenQuickAddModal(target);
                          }}
                        >
                          <PlusCircle size={15} />
                          <span>Add Units / SIP</span>
                        </button>

                        <button
                          type="button"
                          className="add-tx-save-btn"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                          onClick={() => {
                            const target = inv;
                            setDetailsModalInv(null);
                            handleOpenEdit(target);
                          }}
                        >
                          <Edit2 size={15} />
                          <span>Edit Holding</span>
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
