import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Delete, Calculator, Globe, X, Check, Pencil, Plus } from 'lucide-react';
import { CURRENCIES, CATEGORIES, MOBILE_KEYPAD_EXPENSE_CATEGORIES } from '../services/storage';

/**
 * MobileAmountKeypad / MobileInputPad
 * Custom mobile input pad matching the reference screenshots.
 * Provides:
 * 1. 123 Amount Pad (Numeric keypad + Quick currency switcher + Calculator)
 * 2. Category Pad (Header: Category with pencil & X, 3-column category grid matching Image 2)
 * Strictly enabled on mobile devices only (screen width <= 768px).
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

  // Quick currencies in Amount pad
  const quickCurrencies = [
    { symbol: '$', code: 'USD', name: 'USD' },
    { symbol: '₹', code: 'INR', name: 'INR' },
  ];
  if (selectedCurrency !== '$' && selectedCurrency !== '₹') {
    quickCurrencies.push({ symbol: selectedCurrency, code: selectedCurrency, name: selectedCurrency });
  }

  // Safe arithmetic evaluator
  const safeEvaluate = useCallback((expr) => {
    if (!expr) return 0;
    let clean = String(expr).trim().replace(/[+\-*/.]+$/, '');
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
  const previewResult = hasOperator ? safeEvaluate(internalValue) : null;

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
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
    }, 600);
  };

  const handleBackspaceEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleSelectCurrency = (sym) => {
    triggerHaptic();
    setSelectedCurrency(sym);
    if (onCurrencyChange) onCurrencyChange(sym);
    setShowCurrencyModal(false);
  };

  const handleDone = () => {
    triggerHaptic();
    let finalAmt = internalValue;
    if (hasOperator) {
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
    // Expense categories matching Image 2
    return [...MOBILE_KEYPAD_EXPENSE_CATEGORIES, ...customCategories];
  }, [type, customCategories]);

  // Handle category selection
  const handleSelectCategory = (catId) => {
    triggerHaptic();
    if (onCategoryChange) {
      onCategoryChange(catId);
    }
    // Subtle auto-close after selection matching native 1Money experience
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
      <div 
        className="mobile-keypad-backdrop" 
        onClick={onClose}
        aria-hidden="true" 
      />
      
      <div 
        className="mobile-keypad-sheet"
        role="region"
        aria-label={currentTab === 'category' ? 'Category Pad' : 'Amount Keypad'}
      >
        {/* --- Top Header Bar of Sheet --- */}
        <div className="mobile-keypad-topbar">
          <div className="mobile-keypad-title-left">
            <span className="mobile-keypad-title">
              {currentTab === 'category' ? 'Category' : 'Amount'}
            </span>
            {currentTab === 'amount' && previewResult !== null && (
              <span className="mobile-keypad-calc-badge" title="Live Calculated Result">
                = {selectedCurrency} {previewResult}
              </span>
            )}
            {currentTab === 'category' && (
              <span className={`mobile-pad-type-badge ${type === 'income' ? 'badge-inc' : 'badge-exp'}`}>
                {type === 'income' ? 'Income' : 'Expense'}
              </span>
            )}
          </div>

          {/* Quick Mode Switcher Tabs: [123 Amount] [🏷️ Category] */}
          <div className="mobile-keypad-mode-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'amount'}
              className={`mobile-keypad-mode-tab ${currentTab === 'amount' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('amount')}
            >
              123 Amount
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'category'}
              className={`mobile-keypad-mode-tab ${currentTab === 'category' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('category')}
            >
              🏷️ Category
            </button>
          </div>
          
          <div className="mobile-keypad-actions">
            {currentTab === 'amount' ? (
              <button 
                type="button" 
                className="mobile-keypad-action-btn"
                onClick={() => setShowCurrencyModal(true)}
                title="Change Currency"
                aria-label="Change Currency"
              >
                <Globe size={18} />
              </button>
            ) : (
              <button 
                type="button" 
                className={`mobile-keypad-action-btn ${isAddingCustomCat ? 'active-pencil' : ''}`}
                onClick={() => setIsAddingCustomCat(prev => !prev)}
                title="Add / Edit Category"
                aria-label="Add or Edit Category"
              >
                <Pencil size={18} />
              </button>
            )}

            <button 
              type="button" 
              className="mobile-keypad-action-btn"
              onClick={onClose}
              title="Close Pad"
              aria-label="Close Pad"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* --- VIEW 1: CATEGORY PAD (Matching Image 2 Reference) --- */}
        {currentTab === 'category' && (
          <div className="mobile-category-pad-container">
            {/* Custom Category Add form when pencil clicked */}
            {isAddingCustomCat && (
              <form onSubmit={handleAddCustomCategory} className="mobile-custom-cat-form">
                <input
                  type="text"
                  className="mobile-custom-cat-input"
                  placeholder="New category name (e.g. Snacks)..."
                  value={customCatName}
                  onChange={(e) => setCustomCatName(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="mobile-custom-cat-btn">
                  <Plus size={16} /> Add
                </button>
              </form>
            )}

            {/* Sub-bar for switching Expense vs Income categories */}
            <div className="mobile-catpad-type-bar">
              <button
                type="button"
                className={`mobile-catpad-type-chip ${type === 'expense' ? 'active-exp' : ''}`}
                onClick={() => onTypeChange && onTypeChange('expense')}
              >
                Expense
              </button>
              <button
                type="button"
                className={`mobile-catpad-type-chip ${type === 'income' ? 'active-inc' : ''}`}
                onClick={() => onTypeChange && onTypeChange('income')}
              >
                Income
              </button>
            </div>

            {/* 3-Column Category Grid Matching Image 2 */}
            <div className="mobile-category-pad-grid">
              {categoriesToDisplay.map((cat) => {
                const isSelected = category === cat.id;
                const catColor = cat.color || '#6366F1';
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`mobile-catpad-cell ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectCategory(cat.id)}
                    title={`Select ${cat.name}`}
                    style={isSelected ? {
                      borderColor: catColor,
                      background: `${catColor}18`,
                      boxShadow: `0 2px 10px ${catColor}30`,
                    } : {}}
                  >
                    <span 
                      className="mobile-catpad-icon"
                      style={{
                        background: `${catColor}18`,
                        border: `1px solid ${catColor}35`,
                        borderRadius: '10px',
                        padding: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {cat.icon}
                    </span>
                    <span 
                      className="mobile-catpad-label"
                      style={isSelected ? { color: catColor, fontWeight: 700 } : {}}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* --- VIEW 2: AMOUNT KEYPAD --- */}
        {currentTab === 'amount' && (
          <>
            {/* Currency Quick-Switcher Strip */}
            <div className="mobile-keypad-currency-strip">
              {quickCurrencies.map((curr) => {
                const isSelected = selectedCurrency === curr.symbol;
                return (
                  <button
                    key={curr.symbol}
                    type="button"
                    className={`mobile-keypad-curr-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectCurrency(curr.symbol)}
                    title={`Use ${curr.name} (${curr.symbol})`}
                  >
                    {curr.symbol}
                  </button>
                );
              })}
              <button
                type="button"
                className="mobile-keypad-curr-more"
                onClick={() => setShowCurrencyModal(true)}
                title="More Currencies"
              >
                More...
              </button>
            </div>

            {/* Optional Expanded Calculator Operation Row */}
            {isCalcExpanded && (
              <div className="mobile-keypad-calc-subbar">
                <button type="button" className="mobile-keypad-calc-op" onClick={() => handleOperator('+')}>+</button>
                <button type="button" className="mobile-keypad-calc-op" onClick={() => handleOperator('-')}>−</button>
                <button type="button" className="mobile-keypad-calc-op" onClick={() => handleOperator('*')}>×</button>
                <button type="button" className="mobile-keypad-calc-op" onClick={() => handleOperator('/')}>÷</button>
                <button 
                  type="button" 
                  className="mobile-keypad-calc-op eval" 
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
                  className="mobile-keypad-calc-op clear" 
                  onClick={() => {
                    setInternalValue('');
                    if (onChange) onChange('');
                  }}
                >
                  C
                </button>
              </div>
            )}

            {/* 4x4 Numeric Pad Grid */}
            <div className="mobile-keypad-grid">
              {/* Row 1: 1, 2, 3, ⌫ */}
              <button type="button" className="mobile-keypad-key" onClick={() => handleDigit('1')}>1</button>
              <button type="button" className="mobile-keypad-key" onClick={() => handleDigit('2')}>2</button>
              <button type="button" className="mobile-keypad-key" onClick={() => handleDigit('3')}>3</button>
              <button 
                type="button" 
                className="mobile-keypad-key mobile-keypad-backspace-key"
                onClick={handleBackspace}
                onMouseDown={handleBackspaceStart}
                onMouseUp={handleBackspaceEnd}
                onMouseLeave={handleBackspaceEnd}
                onTouchStart={handleBackspaceStart}
                onTouchEnd={handleBackspaceEnd}
                title="Backspace (Hold to clear all)"
                aria-label="Backspace"
              >
                <Delete size={22} className="keypad-backspace-icon" />
              </button>

              {/* Row 2: 4, 5, 6, - */}
              <button type="button" className="mobile-keypad-key" onClick={() => handleDigit('4')}>4</button>
              <button type="button" className="mobile-keypad-key" onClick={() => handleDigit('5')}>5</button>
              <button type="button" className="mobile-keypad-key" onClick={() => handleDigit('6')}>6</button>
              <button 
                type="button" 
                className="mobile-keypad-key mobile-keypad-op-key"
                onClick={() => handleOperator('-')}
                title="Subtract / Minus"
                aria-label="Subtract"
              >
                -
              </button>

              {/* Row 3: 7, 8, 9, 🖩 */}
              <button type="button" className="mobile-keypad-key" onClick={() => handleDigit('7')}>7</button>
              <button type="button" className="mobile-keypad-key" onClick={() => handleDigit('8')}>8</button>
              <button type="button" className="mobile-keypad-key" onClick={() => handleDigit('9')}>9</button>
              <button 
                type="button" 
                className={`mobile-keypad-key mobile-keypad-calc-key ${isCalcExpanded ? 'active' : ''}`}
                onClick={() => setIsCalcExpanded(!isCalcExpanded)}
                title="Toggle Arithmetic Calculator (+, -, ×, ÷)"
                aria-label="Calculator"
              >
                <Calculator size={20} className="keypad-calc-icon" />
              </button>

              {/* Row 4: +, 0, ., Done */}
              <button 
                type="button" 
                className="mobile-keypad-key mobile-keypad-op-key"
                onClick={() => handleOperator('+')}
                title="Add / Plus"
                aria-label="Plus"
              >
                +
              </button>
              <button type="button" className="mobile-keypad-key" onClick={() => handleDigit('0')}>0</button>
              <button 
                type="button" 
                className="mobile-keypad-key mobile-keypad-dot-key" 
                onClick={handleDecimal}
                aria-label="Decimal"
              >
                .
              </button>
              <button 
                type="button" 
                className="mobile-keypad-key mobile-keypad-done-key"
                onClick={handleDone}
                aria-label="Done"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>

      {/* Currency Selection Dialog (Opened from Globe Icon) */}
      {showCurrencyModal && (
        <div className="mobile-curr-picker-overlay" onClick={() => setShowCurrencyModal(false)}>
          <div className="mobile-curr-picker-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-curr-picker-header">
              <h3>Select Currency</h3>
              <button 
                type="button" 
                className="mobile-curr-picker-close" 
                onClick={() => setShowCurrencyModal(false)}
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
