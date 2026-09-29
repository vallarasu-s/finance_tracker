import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calculator, 
  ArrowRightLeft, 
  RefreshCw, 
  Copy, 
  Check, 
  Wallet, 
  ChevronDown, 
  Search, 
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react';
import { CURRENCIES } from '../services/storage';

// Benchmark exchange rates relative to USD (1.0 USD = X Currency)
const BENCHMARK_RATES_USD = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.50,
  JPY: 154.20,
  CAD: 1.36,
  AUD: 1.52,
  CHF: 0.91,
  CNY: 7.24,
  AED: 3.67,
  SAR: 3.75,
  SGD: 1.35,
  NZD: 1.66,
  BRL: 5.15,
  ZAR: 18.40,
  MXN: 16.90,
  KRW: 1375.0,
  RUB: 92.50,
  TRY: 32.20,
  SEK: 10.80,
  NOK: 10.95,
  DKK: 6.90,
  PLN: 3.98,
  IDR: 16100.0,
  MYR: 4.75,
  THB: 36.80,
  PHP: 57.50,
  VND: 25400.0,
  PKR: 278.0,
  BDT: 117.0,
  NGN: 1450.0,
  EGP: 47.60,
  KES: 131.0,
  GHS: 14.20,
  ARS: 885.0,
  CLP: 940.0,
  COP: 3900.0,
  ILS: 3.72,
  HKD: 7.82,
  TWD: 32.40,
  KWD: 0.31,
  QAR: 3.64,
  OMR: 0.38,
  BHD: 0.38,
  LKR: 302.0,
  NPR: 133.50,
};

const POPULAR_PAIRS = [
  { from: 'USD', to: 'INR', label: 'USD → INR' },
  { from: 'EUR', to: 'INR', label: 'EUR → INR' },
  { from: 'GBP', to: 'INR', label: 'GBP → INR' },
  { from: 'AED', to: 'INR', label: 'AED → INR' },
  { from: 'SAR', to: 'INR', label: 'SAR → INR' },
  { from: 'CAD', to: 'INR', label: 'CAD → INR' },
  { from: 'USD', to: 'EUR', label: 'USD → EUR' },
  { from: 'USD', to: 'GBP', label: 'USD → GBP' },
];

export default function CurrencyCalculator({
  settings = {},
  currentBalance = 0,
  displayCash = 0,
  displayRevenue = 0,
}) {
  const defaultCurrency = settings.currency || 'INR';
  const CACHE_KEY = 'fogo_exchange_rates_v1';

  // Calculator State
  const [fromCode, setFromCode] = useState(defaultCurrency === 'USD' ? 'EUR' : 'USD');
  const [toCode, setToCode] = useState(defaultCurrency);
  const [amountStr, setAmountStr] = useState('100');

  // Initialize with cached live rates if available, else benchmark rates
  const [rates, setRates] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.rates) return { ...BENCHMARK_RATES_USD, ...parsed.rates };
      }
    } catch (e) {
      // fallback
    }
    return BENCHMARK_RATES_USD;
  });

  const [isLive, setIsLive] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return !!(cached && JSON.parse(cached).rates);
    } catch {
      return false;
    }
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp) return `Live sync at ${parsed.timestamp}`;
      }
    } catch {}
    return 'Benchmark Rates';
  });

  // Currency Dropdown Modals / Selectors
  const [openSelector, setOpenSelector] = useState(null); // 'from' | 'to' | null
  const [searchQuery, setSearchQuery] = useState('');
  const selectorRef = useRef(null);

  // Sync toCode if user switches currency in top header
  useEffect(() => {
    if (settings.currency && settings.currency !== fromCode) {
      setToCode(settings.currency);
    }
  }, [settings.currency]);

  // Safely evaluate simple math expressions in amount input (e.g., "100 + 50 * 2")
  const evaluatedAmount = useMemo(() => {
    if (!amountStr || !amountStr.trim()) return 0;
    try {
      // Allow only digits, dots, +, -, *, /, and spaces for safe parsing
      const sanitized = amountStr.replace(/[^0-9.+\-*/\s]/g, '');
      if (!sanitized) return 0;
      // eslint-disable-next-line no-new-func
      const result = Function(`'use strict'; return (${sanitized})`)();
      return typeof result === 'number' && !isNaN(result) && isFinite(result) ? Math.max(0, result) : 0;
    } catch {
      const num = parseFloat(amountStr);
      return !isNaN(num) && num > 0 ? num : 0;
    }
  }, [amountStr]);

  // Fetch live exchange rates from public API if online
  const fetchLiveRates = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          const merged = { ...BENCHMARK_RATES_USD, ...data.rates };
          setRates(merged);
          setIsLive(true);
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastUpdated(`Live sync at ${time}`);

          // Persist to local cache for offline instant loading
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              rates: data.rates,
              timestamp: time,
              date: new Date().toISOString()
            }));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Currency rates offline fallback used:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  // Automatic sync lifecycle: On mount, auto-reconnect, and periodic 15-minute background refresh
  useEffect(() => {
    // 1. Initial automated fetch
    fetchLiveRates(true);

    // 2. Periodic background refresh every 15 minutes
    const interval = setInterval(() => {
      fetchLiveRates(true);
    }, 15 * 60 * 1000);

    // 3. Automated refresh when returning online
    const handleOnline = () => fetchLiveRates(true);
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Close currency selector dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target)) {
        setOpenSelector(null);
      }
    };
    if (openSelector) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [openSelector]);

  const fromCurrency = CURRENCIES.find(c => c.code === fromCode) || CURRENCIES[0];
  const toCurrency = CURRENCIES.find(c => c.code === toCode) || CURRENCIES[1];

  // Calculate Exchange Rate: (Rate_TO / Rate_FROM)
  const exchangeRate = useMemo(() => {
    const rateFrom = rates[fromCode] || 1;
    const rateTo = rates[toCode] || 1;
    return rateTo / rateFrom;
  }, [rates, fromCode, toCode]);

  const convertedResult = evaluatedAmount * exchangeRate;
  const inverseRate = exchangeRate > 0 ? 1 / exchangeRate : 0;

  // Swap currencies
  const handleSwap = () => {
    setFromCode(toCode);
    setToCode(fromCode);
  };

  // Copy converted result to clipboard
  const handleCopy = () => {
    const text = `${toCurrency.symbol}${convertedResult.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter currencies for modal selector
  const filteredCurrencies = useMemo(() => {
    if (!searchQuery.trim()) return CURRENCIES;
    const q = searchQuery.toLowerCase();
    return CURRENCIES.filter(c => 
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelectCurrency = (code) => {
    if (openSelector === 'from') {
      setFromCode(code);
    } else if (openSelector === 'to') {
      setToCode(code);
    }
    setOpenSelector(null);
    setSearchQuery('');
  };

  return (
    <div className="fogo-card fogo-currency-calc-card">
      {/* Header */}
      <div className="fogo-card-header currency-calc-header">
        <div className="currency-calc-title-group">
          <div className="currency-calc-icon-pill">
            <Calculator size={18} color="#ffffff" />
          </div>
          <div>
            <h3 className="fogo-card-title">Currency Calculator & Converter</h3>
            <span className="currency-calc-sub">
              Live multi-currency exchange with instant conversion math
            </span>
          </div>
        </div>

        <div className="currency-calc-header-actions">
          <div className={`currency-live-tag ${isLive ? 'online' : 'benchmark'}`}>
            <span className="live-dot" />
            <span>{isLive ? 'Live Rates' : 'Standard Rates'}</span>
          </div>
          <button
            type="button"
            className={`currency-sync-btn ${isRefreshing ? 'spinning' : ''}`}
            onClick={() => fetchLiveRates(false)}
            title="Refresh Exchange Rates"
            aria-label="Refresh Exchange Rates"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Popular Currency Pairs Quick Ticker */}
      <div className="currency-pairs-ticker">
        <span className="ticker-label">Popular Pairs:</span>
        <div className="ticker-pills-list">
          {POPULAR_PAIRS.map(pair => {
            const isSelected = fromCode === pair.from && toCode === pair.to;
            return (
              <button
                key={pair.label}
                type="button"
                className={`ticker-pill ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  setFromCode(pair.from);
                  setToCode(pair.to);
                }}
              >
                {pair.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Converter Box */}
      <div className="currency-calc-box">
        {/* FROM SECTION */}
        <div className="currency-input-col">
          <div className="col-label-row">
            <label className="calc-col-label">Amount & Math Input</label>
            <span className="calc-helper-tag">supports +, -, *, /</span>
          </div>

          <div className="calc-input-wrapper">
            <span className="calc-symbol-prefix">{fromCurrency.symbol}</span>
            <input
              type="text"
              className="calc-amount-input"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="e.g. 100 or 50 * 4"
            />
            {amountStr && (
              <button 
                type="button" 
                className="calc-clear-btn" 
                onClick={() => setAmountStr('')}
                title="Clear input"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Currency Dropdown Selector Trigger */}
          <button
            type="button"
            className="currency-select-trigger"
            onClick={() => {
              setSearchQuery('');
              setOpenSelector('from');
            }}
          >
            <span className="curr-flag">{fromCurrency.flag}</span>
            <div className="curr-info">
              <span className="curr-code">{fromCurrency.code}</span>
              <span className="curr-name">{fromCurrency.name}</span>
            </div>
            <ChevronDown size={15} className="curr-arrow" />
          </button>

          {/* Quick presets */}
          <div className="calc-quick-chips">
            {[100, 500, 1000, 5000].map(val => (
              <button
                key={val}
                type="button"
                className="calc-chip"
                onClick={() => setAmountStr(String(val))}
              >
                +{val}
              </button>
            ))}
            {displayCash > 0 && (
              <button
                type="button"
                className="calc-chip highlight"
                onClick={() => setAmountStr(String(displayCash))}
                title="Insert Cash Balance"
              >
                <Wallet size={11} /> Cash ({fromCurrency.symbol}{displayCash})
              </button>
            )}
          </div>
        </div>

        {/* SWAP BUTTON */}
        <div className="currency-swap-col">
          <button
            type="button"
            className="currency-swap-btn"
            onClick={handleSwap}
            title="Swap Currencies (⇄)"
            aria-label="Swap Currencies"
          >
            <ArrowRightLeft size={18} />
          </button>
        </div>

        {/* TO SECTION */}
        <div className="currency-input-col result-col">
          <div className="col-label-row">
            <label className="calc-col-label">Converted Result</label>
            <span className="calc-rate-badge">
              1 {fromCode} = {exchangeRate.toFixed(4)} {toCode}
            </span>
          </div>

          <div className="calc-result-wrapper">
            <div className="calc-result-display">
              <span className="calc-result-symbol">{toCurrency.symbol}</span>
              <span className="calc-result-value">
                {convertedResult.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>

            <button
              type="button"
              className={`calc-copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
              title="Copy Converted Amount"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Target Currency Dropdown Trigger */}
          <button
            type="button"
            className="currency-select-trigger"
            onClick={() => {
              setSearchQuery('');
              setOpenSelector('to');
            }}
          >
            <span className="curr-flag">{toCurrency.flag}</span>
            <div className="curr-info">
              <span className="curr-code">{toCurrency.code}</span>
              <span className="curr-name">{toCurrency.name}</span>
            </div>
            <ChevronDown size={15} className="curr-arrow" />
          </button>

          {/* Rate comparison pill */}
          <div className="calc-inverse-info">
            <span>Inverse: 1 {toCode} = {inverseRate.toFixed(4)} {fromCode}</span>
            <span className="calc-updated-note">• {lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* CURRENCY SELECTOR MODAL / POPOVER */}
      {openSelector && (
        <div className="currency-selector-overlay" onClick={() => setOpenSelector(null)}>
          <div 
            className="currency-selector-modal" 
            ref={selectorRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="curr-modal-header">
              <div className="curr-modal-title">
                <Sparkles size={16} color="var(--color-brand)" />
                <h4>Select {openSelector === 'from' ? 'Source' : 'Target'} Currency</h4>
              </div>
              <button 
                type="button" 
                className="curr-modal-close"
                onClick={() => setOpenSelector(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Search input */}
            <div className="curr-modal-search">
              <Search size={16} className="curr-search-icon" />
              <input
                type="text"
                className="curr-search-input"
                placeholder="Search country, currency code or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {/* Currency list */}
            <div className="curr-modal-list">
              {filteredCurrencies.map(c => {
                const isCurrent = (openSelector === 'from' ? fromCode : toCode) === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    className={`curr-modal-item ${isCurrent ? 'selected' : ''}`}
                    onClick={() => handleSelectCurrency(c.code)}
                  >
                    <span className="item-flag">{c.flag}</span>
                    <div className="item-details">
                      <div className="item-code-row">
                        <strong className="item-code">{c.code}</strong>
                        <span className="item-symbol">({c.symbol})</span>
                      </div>
                      <span className="item-name">{c.name} • {c.country}</span>
                    </div>
                    {isCurrent && <Check size={16} className="item-check" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
