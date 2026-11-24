import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Delete, 
  Calculator, 
  Languages, 
  X, 
  Check, 
  Pencil, 
  Plus, 
  LayoutGrid, 
  Smile, 
  Settings, 
  Palette, 
  MicOff, 
  ChevronDown, 
  KeyRound, 
  CreditCard, 
  MapPin 
} from 'lucide-react';
import { CURRENCIES, CATEGORIES, MOBILE_KEYPAD_EXPENSE_CATEGORIES, parseShortAmount, formatCurrency, MAX_TRANSACTION_AMOUNT } from '../services/storage';
import { pushModalNavigation, popModalNavigation } from '../services/navigation';

/**
 * MobileAmountKeypad
 * Redesigned to replicate the native Gboard numeric keyboard aesthetic on Android:
 * - Dark slate/charcoal container with rounded top
 * - Gboard autofill header row (with mode tabs & currency)
 * - Gboard quick action toolbar (Grid, Smile, GIF, Settings, Languages, Palette, Calculator, MicOff)
 * - 4x4 rounded pill buttons with authentic dark slate styling
 * - Distinct teal action button (➔|) for submission/done
 * - Bottom dismiss chevron (˅) and gesture navigation bar
 * - Strictly enabled on mobile devices only (screen width <= 768px).
 */
export default function MobileAmountKeypad({
  isOpen,
  activeTab = 'amount', // 'amount' | 'category'
  onTabChange,
  amount = '',
  onChange,
  category = 'food',
  onCategoryChange,
  type = 'expense', // 'expense' | 'income'
  onTypeChange,
  onClose,
  currencySymbol = '₹',
  onCurrencyChange,
  onDone,
}) {
  const [currentTab, setCurrentTab] = useState(activeTab || 'amount');
  const [internalValue, setInternalValue] = useState(amount ? String(amount) : '');
  const [isCalcExpanded, setIsCalcExpanded] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(currencySymbol || '₹');
  const [isAddingCustomCat, setIsAddingCustomCat] = useState(false);
  const [customCatName, setCustomCatName] = useState('');
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('finance_user_custom_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const longPressTimerRef = useRef(null);

  // Sync currentTab when activeTab changes
  useEffect(() => {
    if (activeTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  // Sync internal amount value
  useEffect(() => {
    if (amount !== undefined && amount !== null) {
      setInternalValue(amount === '' ? '' : String(amount));
    }
  }, [amount, isOpen]);

  // Sync currency symbol
  useEffect(() => {
    if (currencySymbol) {
      setSelectedCurrency(currencySymbol);
    }
  }, [currencySymbol]);

  // Handle tab switch
  const handleTabSwitch = (tab) => {
    setCurrentTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Safe arithmetic evaluator
  const safeEvaluate = useCallback((expr) => {
    if (!expr) return 0;
    let clean = String(expr).trim().replace(/[+\-*/.]+$/, '');
    clean = clean.replace(/,/g, '.');
    clean = clean.replace(/[^0-9+\-*/.]/g, '');
    if (!clean) return 0;
    try {
      const fn = new Function(`'use strict'; return (${clean})`);
      const res = fn();
      if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
        return Math.round(res * 100) / 100;
      }
    } catch {
      // fallback
    }
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  const hasOperator = /[+\-*/]/.test(internalValue);
  const parsedShort = useMemo(() => parseShortAmount(internalValue), [internalValue]);
  const previewResult = hasOperator 
    ? safeEvaluate(internalValue) 
    : (parsedShort.isValid && parsedShort.unit ? parsedShort.value : null);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // ignore
      }
    }
  };

  // Amount digit handling
  const handleDigit = (digit) => {
    triggerHaptic();
    setInternalValue((prev) => {
      let next;
      if (!prev || prev === '0') {
        next = digit;
      } else {
        const parts = prev.split(/[+\-*/]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.') && lastPart.split('.')[1]?.length >= 2) {
          return prev;
        }
        next = prev + digit;
      }
      if (onChange) onChange(next);
      return next;
    });
  };

  const handleDecimal = () => {
    triggerHaptic();
    setInternalValue((prev) => {
      let next;
      if (!prev) {
        next = '0.';
      } else {
        const parts = prev.split(/[+\-*/]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.')) {
          return prev;
        }
        if (/[+\-*/]$/.test(prev)) {
          next = prev + '0.';
        } else {
          next = prev + '.';
        }
      }
      if (onChange) onChange(next);
      return next;
    });
  };

  const handleComma = () => {
    // Comma behaves like decimal separator for intl support
    handleDecimal();
  };

  const handleOperator = (op) => {
    triggerHaptic();
    setInternalValue((prev) => {
      if (!prev || prev === '0') {
        if (op === '-') return '-';
        return prev;
      }
      let next;
      if (/[+\-*/]$/.test(prev)) {
        next = prev.slice(0, -1) + op;
      } else {
        next = prev + op;
      }
      if (onChange) onChange(next);
      return next;
    });
  };

  const handleSpaceOrPlus = () => {
    triggerHaptic();
    // In Gboard numeric, space key acts as quick addition/separator
    if (internalValue && /[0-9.]$/.test(internalValue)) {
      handleOperator('+');
    }
  };

  const handleBackspace = () => {
    triggerHaptic();
    setInternalValue((prev) => {
      if (!prev || prev.length <= 1) {
        if (onChange) onChange('');
        return '';
      }
      const next = prev.slice(0, -1);
      if (onChange) onChange(next);
      return next;
    });
  };

  const handleBackspaceStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      triggerHaptic();
      setInternalValue('');
      if (onChange) onChange('');
    }, 550);
  };

  const handleBackspaceEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleOpenCurrencyModal = () => {
    setShowCurrencyModal(true);
    pushModalNavigation('keypad_currency_modal', () => setShowCurrencyModal(false));
  };

  const handleCloseCurrencyModal = () => {
    popModalNavigation('keypad_currency_modal');
  };

  const handleSelectCurrency = (sym) => {
    triggerHaptic();
    setSelectedCurrency(sym);
    if (onCurrencyChange) onCurrencyChange(sym);
    handleCloseCurrencyModal();
  };

  const handleShortformKey = (suffix) => {
    triggerHaptic();
    setInternalValue(prev => {
      const raw = String(prev || '').trim();
      let next;
      if (!raw) {
        next = `1${suffix}`;
      } else {
        const match = raw.match(/^([0-9.]+)\s*([a-z]+)?$/i);
        if (match) {
          next = `${match[1]}${suffix}`;
        } else {
          next = `${raw}${suffix}`;
        }
      }
      if (onChange) onChange(next);
      return next;
    });
  };

  const handleQuickAddKey = (delta) => {
    triggerHaptic();
    const current = parseShortAmount(internalValue);
    const newVal = Math.min(MAX_TRANSACTION_AMOUNT, (current.isValid ? current.value : 0) + delta);
    const next = String(newVal);
    setInternalValue(next);
    if (onChange) onChange(next);
  };

  const handleDone = () => {
    triggerHaptic();
    let finalAmt = internalValue;
    const parsed = parseShortAmount(internalValue);
    if (parsed.isValid && parsed.value > 0) {
      finalAmt = String(parsed.value);
      setInternalValue(finalAmt);
      if (onChange) onChange(finalAmt);
    } else if (hasOperator) {
      const evaluated = safeEvaluate(internalValue);
      finalAmt = evaluated > 0 ? String(evaluated) : '';
      setInternalValue(finalAmt);
      if (onChange) onChange(finalAmt);
    }
    if (onDone) {
      onDone(finalAmt);
    } else if (onClose) {
      onClose();
    }
  };

  // Categories list to display in the Category Pad
  const categoriesToDisplay = useMemo(() => {
    if (type === 'income') {
      return CATEGORIES.income;
    }
    return [...MOBILE_KEYPAD_EXPENSE_CATEGORIES, ...customCategories];
  }, [type, customCategories]);

  // Handle category selection
  const handleSelectCategory = (catId) => {
    triggerHaptic();
    if (onCategoryChange) {
      onCategoryChange(catId);
    }
    setTimeout(() => {
      if (onClose) onClose();
    }, 180);
  };

  // Add custom category from pencil icon
  const handleAddCustomCategory = (e) => {
    e.preventDefault();
    if (!customCatName.trim()) return;
    const newCat = {
      id: `custom_${Date.now()}`,
      name: customCatName.trim(),
      icon: '✨',
      color: '#6366F1',
    };
    const updated = [...customCategories, newCat];
    setCustomCategories(updated);
    try {
      localStorage.setItem('finance_user_custom_categories', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setCustomCatName('');
    setIsAddingCustomCat(false);
    handleSelectCategory(newCat.id);
  };

  // Strictly Mobile View Only: screen width <= 768px (never laptop or PC)
  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(typeof window !== 'undefined' && window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen || !isMobileScreen) return null;

  return (
    <>
      {/* Backdrop: Completely transparent so the form is visible */}
      <div 
        className="mobile-keypad-backdrop" 
        onClick={onClose}
        aria-hidden="true" 
      />
      
      {/* Gboard-Styled Keypad Bottom Sheet */}
      <div 
        className="mobile-keypad-sheet gboard-sheet"
        role="region"
        aria-label={currentTab === 'category' ? 'Category Pad' : 'Gboard Amount Keypad'}
      >
        {/* --- ROW 1: GBOARD AUTOFILL & MODE STRIP --- */}
        <div className="gboard-autofill-strip">
          <div className="gboard-autofill-left">
            <button
              type="button"
              className={`gboard-mode-chip ${currentTab === 'amount' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('amount')}
            >
              123 Amount
            </button>
            <button
              type="button"
              className={`gboard-mode-chip ${currentTab === 'category' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('category')}
            >
              🏷️ Category
            </button>
            {currentTab === 'amount' && previewResult !== null && (
              <span className="gboard-calc-badge" title="Live Calculated Result">
                = {selectedCurrency} {formatCurrency(previewResult, selectedCurrency, { compact: false })}
                {parsedShort?.unitLabel ? ` (${parsedShort.baseNum} ${parsedShort.unitLabel})` : ''}
              </span>
            )}
          </div>

          <div className="gboard-autofill-right">
            <button
              type="button"
              className="gboard-curr-badge"
              onClick={handleOpenCurrencyModal}
              title="Select Currency"
            >
              {selectedCurrency}
            </button>
            <span className="gboard-autofill-icon" title="Autofill Key">
              <KeyRound size={15} />
            </span>
            <span className="gboard-autofill-icon" title="Cards">
              <CreditCard size={15} />
            </span>
            <span className="gboard-autofill-icon" title="Location">
              <MapPin size={15} />
            </span>
          </div>
        </div>

        {/* --- VIEW 1: CATEGORY PAD --- */}
        {currentTab === 'category' ? (
          <div className="gboard-category-container">
            {/* Category Pad Header */}
            <div className="gboard-cat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="gboard-cat-title">Categories</span>
                <span className={`mobile-pad-type-badge ${type === 'income' ? 'badge-inc' : 'badge-exp'}`}>
                  {type === 'income' ? 'Income' : 'Expense'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Type toggle */}
                <div className="gboard-cat-type-toggle">
                  <button
                    type="button"
                    className={`gboard-cat-type-pill ${type === 'expense' ? 'active' : ''}`}
                    onClick={() => onTypeChange && onTypeChange('expense')}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    className={`gboard-cat-type-pill ${type === 'income' ? 'active' : ''}`}
                    onClick={() => onTypeChange && onTypeChange('income')}
                  >
                    Income
                  </button>
                </div>

                <button 
                  type="button" 
                  className={`gboard-icon-btn ${isAddingCustomCat ? 'active' : ''}`}
                  onClick={() => setIsAddingCustomCat(prev => !prev)}
                  title="Add Custom Category"
                >
                  <Pencil size={16} />
                </button>

                <button 
                  type="button" 
                  className="gboard-icon-btn"
                  onClick={onClose}
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Custom Category Form */}
            {isAddingCustomCat && (
              <form onSubmit={handleAddCustomCategory} className="mobile-custom-cat-form">
                <input
                  type="text"
                  className="mobile-custom-cat-input"
                  placeholder="New category name..."
                  value={customCatName}
                  onChange={(e) => setCustomCatName(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="mobile-custom-cat-btn">
                  <Plus size={15} /> Add
                </button>
              </form>
            )}

            {/* 3-Column Category Grid */}
            <div className="gboard-category-grid">
              {categoriesToDisplay.map((cat) => {
                const isSelected = category === cat.id;
                const catColor = cat.color || '#6366F1';
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`gboard-cat-cell ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectCategory(cat.id)}
                    title={`Select ${cat.name}`}
                    style={isSelected ? {
                      borderColor: catColor,
                      background: `${catColor}20`,
                      boxShadow: `0 2px 8px ${catColor}35`,
                    } : {}}
                  >
                    <span 
                      className="gboard-cat-cell-icon"
                      style={{
                        background: `${catColor}18`,
                        border: `1px solid ${catColor}35`
                      }}
                    >
                      {cat.icon}
                    </span>
                    <span 
                      className="gboard-cat-cell-label"
                      style={isSelected ? { color: catColor, fontWeight: 700 } : {}}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* --- VIEW 2: GBOARD NUMPAD --- */
          <>
            {/* ROW 2: GBOARD ICON TOOLBAR (Matching 2nd Reference Screenshot) */}
            <div className="gboard-toolbar">
              <button 
                type="button" 
                className="gboard-toolbar-btn" 
                onClick={() => handleTabSwitch('category')}
                title="Category Pad"
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                type="button" 
                className="gboard-toolbar-btn" 
                title="Stickers" 
                onClick={triggerHaptic}
              >
                <Smile size={18} />
              </button>
              <button 
                type="button" 
                className="gboard-toolbar-btn gboard-gif-btn" 
                title="GIF" 
                onClick={triggerHaptic}
              >
                <span className="gboard-gif-badge">GIF</span>
              </button>
              <button 
                type="button" 
                className="gboard-toolbar-btn" 
                title="Settings" 
                onClick={triggerHaptic}
              >
                <Settings size={18} />
              </button>
              <button 
                type="button" 
                className="gboard-toolbar-btn" 
                title="Currencies & Languages" 
                onClick={() => setShowCurrencyModal(true)}
              >
                <Languages size={18} />
              </button>
              <button 
                type="button" 
                className="gboard-toolbar-btn" 
                title="Switch Currency ($ / ₹)" 
                onClick={() => {
                  const next = selectedCurrency === '₹' ? '$' : '₹';
                  handleSelectCurrency(next);
                }}
              >
                <Palette size={18} />
              </button>
              <button 
                type="button" 
                className={`gboard-toolbar-btn ${isCalcExpanded ? 'active-calc' : ''}`}
                title="Toggle Calculator Bar (+, -, ×, ÷)" 
                onClick={() => {
                  triggerHaptic();
                  setIsCalcExpanded(!isCalcExpanded);
                }}
              >
                <Calculator size={18} />
              </button>
              <button 
                type="button" 
                className="gboard-toolbar-btn" 
                title="Microphone" 
                onClick={triggerHaptic}
              >
                <MicOff size={18} />
              </button>
            </div>

            {/* Optional Expandable Arithmetic Operations Bar */}
            {isCalcExpanded && (
              <div className="gboard-calc-subbar">
                <button type="button" className="gboard-calc-op" onClick={() => handleOperator('+')}>+</button>
                <button type="button" className="gboard-calc-op" onClick={() => handleOperator('-')}>−</button>
                <button type="button" className="gboard-calc-op" onClick={() => handleOperator('*')}>×</button>
                <button type="button" className="gboard-calc-op" onClick={() => handleOperator('/')}>÷</button>
                <button 
                  type="button" 
                  className="gboard-calc-op eval" 
                  onClick={() => {
                    const res = safeEvaluate(internalValue);
                    setInternalValue(String(res));
                    if (onChange) onChange(String(res));
                  }}
                >
                  =
                </button>
                <button 
                  type="button" 
                  className="gboard-calc-op clear" 
                  onClick={() => {
                    setInternalValue('');
                    if (onChange) onChange('');
                  }}
                >
                  C
                </button>
              </div>
            )}

            {/* Quick Shortform Bar for Mobile Keypad */}
            <div className="mobile-keypad-shortform-bar">
              <button type="button" className="mobile-shortform-chip" onClick={() => handleShortformKey('k')} title="Thousand">k</button>
              <button type="button" className="mobile-shortform-chip" onClick={() => handleShortformKey('l')} title="Lakh">L</button>
              <button type="button" className="mobile-shortform-chip crore" onClick={() => handleShortformKey('c')} title="Crore">c</button>
              <button type="button" className="mobile-shortform-chip" onClick={() => handleShortformKey('m')} title="Million">M</button>
              <span className="mobile-shortform-divider"></span>
              <button type="button" className="mobile-shortform-quick" onClick={() => handleQuickAddKey(1000)}>+1K</button>
              <button type="button" className="mobile-shortform-quick" onClick={() => handleQuickAddKey(100000)}>+1L</button>
              <button type="button" className="mobile-shortform-quick crore" onClick={() => handleQuickAddKey(10000000)}>+1c</button>
            </div>

            {/* 4x4 GBOARD PILL NUMPAD GRID (Exact match to 2nd screenshot marked in yellow) */}
            <div className="gboard-numpad-grid">
              {/* ROW 1: [ 1 ] [ 2 ] [ 3 ] [ - ] */}
              <button type="button" className="gboard-key" onClick={() => handleDigit('1')}>
                1
              </button>
              <button type="button" className="gboard-key" onClick={() => handleDigit('2')}>
                2
              </button>
              <button type="button" className="gboard-key" onClick={() => handleDigit('3')}>
                3
              </button>
              <button 
                type="button" 
                className="gboard-key gboard-op-key" 
                onClick={() => handleOperator('-')}
                title="Subtract / Minus"
                aria-label="Subtract"
              >
                −
              </button>

              {/* ROW 2: [ 4 ] [ 5 ] [ 6 ] [ ␣ (Space / +) ] */}
              <button type="button" className="gboard-key" onClick={() => handleDigit('4')}>
                4
              </button>
              <button type="button" className="gboard-key" onClick={() => handleDigit('5')}>
                5
              </button>
              <button type="button" className="gboard-key" onClick={() => handleDigit('6')}>
                6
              </button>
              <button 
                type="button" 
                className="gboard-key gboard-space-key" 
                onClick={handleSpaceOrPlus}
                title="Space / Add (+)"
                aria-label="Space bar"
              >
                {/* Authentic Gboard Space Bracket SVG */}
                <svg width="22" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 10v4h14v-4" />
                </svg>
              </button>

              {/* ROW 3: [ 7 ] [ 8 ] [ 9 ] [ ⌫ (Backspace) ] */}
              <button type="button" className="gboard-key" onClick={() => handleDigit('7')}>
                7
              </button>
              <button type="button" className="gboard-key" onClick={() => handleDigit('8')}>
                8
              </button>
              <button type="button" className="gboard-key" onClick={() => handleDigit('9')}>
                9
              </button>
              <button 
                type="button" 
                className="gboard-key gboard-backspace-key" 
                onClick={handleBackspace}
                onMouseDown={handleBackspaceStart}
                onMouseUp={handleBackspaceEnd}
                onMouseLeave={handleBackspaceEnd}
                onTouchStart={handleBackspaceStart}
                onTouchEnd={handleBackspaceEnd}
                title="Backspace (Hold to clear)"
                aria-label="Backspace"
              >
                {/* Standard Android Gboard Backspace Tag SVG */}
                <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              </button>

              {/* ROW 4: [ , ] [ 0 ] [ . ] [ ➔| (Teal Action Done) ] */}
              <button 
                type="button" 
                className="gboard-key gboard-comma-key" 
                onClick={handleComma}
                title="Comma"
                aria-label="Comma"
              >
                ,
              </button>
              <button type="button" className="gboard-key" onClick={() => handleDigit('0')}>
                0
              </button>
              <button 
                type="button" 
                className="gboard-key gboard-dot-key" 
                onClick={handleDecimal}
                title="Decimal Point"
                aria-label="Decimal"
              >
                .
              </button>
              <button 
                type="button" 
                className="gboard-key gboard-action-key" 
                onClick={handleDone}
                title="Done"
                aria-label="Done"
              >
                {/* Gboard Teal Return / Action Arrow pointing right to vertical bar (➔|) */}
                <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#0e322a" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12h12M11 6l6 6-6 6M20 5v14" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* --- BOTTOM DISMISS BAR & ANDROID HOME INDICATOR (Matching 2nd Screenshot) --- */}
        <div className="gboard-bottom-bar">
          <button 
            type="button" 
            className="gboard-dismiss-btn" 
            onClick={onClose}
            aria-label="Dismiss keyboard"
            title="Hide Keyboard"
          >
            <ChevronDown size={22} />
          </button>
          <div className="gboard-home-bar" />
        </div>
      </div>

      {/* Currency Selection Dialog (Opened from Globe/Languages Icon) */}
      {showCurrencyModal && (
        <div className="mobile-curr-picker-overlay" onClick={handleCloseCurrencyModal}>
          <div className="mobile-curr-picker-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-curr-picker-header">
              <h3>Select Currency</h3>
              <button 
                type="button" 
                className="mobile-curr-picker-close" 
                onClick={handleCloseCurrencyModal}
              >
                <X size={18} />
              </button>
            </div>
            <div className="mobile-curr-picker-list">
              {CURRENCIES.map((c) => {
                const isCurrent = selectedCurrency === c.symbol;
                return (
                  <button
                    key={c.code}
                    type="button"
                    className={`mobile-curr-item ${isCurrent ? 'selected' : ''}`}
                    onClick={() => handleSelectCurrency(c.symbol)}
                  >
                    <span className="mobile-curr-flag">{c.flag}</span>
                    <div className="mobile-curr-info">
                      <span className="mobile-curr-name">{c.name}</span>
                      <span className="mobile-curr-code">{c.code} ({c.country})</span>
                    </div>
                    <span className="mobile-curr-symbol">{c.symbol}</span>
                    {isCurrent && <Check size={16} className="mobile-curr-check" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
