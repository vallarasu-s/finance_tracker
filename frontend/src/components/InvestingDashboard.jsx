import React, { useState, useMemo } from 'react';
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
  Filter
} from 'lucide-react';
import { 
  INVESTMENT_CATEGORIES, 
  getInvestmentCategoryInfo, 
  formatCurrency, 
  MAX_TRANSACTION_AMOUNT 
} from '../services/storage';

export default function InvestingDashboard({
  investments = [],
  settings = {},
  onAddInvestment,
  onUpdateInvestment,
  onDeleteInvestment,
}) {
  const symbol = settings.currencySymbol || '$';

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('value-desc'); // 'value-desc' | 'profit-desc' | 'name-asc' | 'recent'

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSymbol, setFormSymbol] = useState('');
  const [formCategory, setFormCategory] = useState('stocks');
  const [formUnits, setFormUnits] = useState('');
  const [formBuyPrice, setFormBuyPrice] = useState('');
  const [formCurrentPrice, setFormCurrentPrice] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDividendYield, setFormDividendYield] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // SIP Calculator State
  const [sipMonthly, setSipMonthly] = useState(10000);
  const [sipRate, setSipRate] = useState(12);
  const [sipYears, setSipYears] = useState(10);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingInvestment(null);
    setFormName('');
    setFormSymbol('');
    setFormCategory('stocks');
    setFormUnits('10');
    setFormBuyPrice('100');
    setFormCurrentPrice('115');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDividendYield('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (inv) => {
    setEditingInvestment(inv);
    setFormName(inv.name || '');
    setFormSymbol(inv.symbol || '');
    setFormCategory(inv.category || 'stocks');
    setFormUnits(String(inv.units || ''));
    setFormBuyPrice(String(inv.buyPrice || ''));
    setFormCurrentPrice(String(inv.currentPrice || ''));
    setFormDate(inv.date || new Date().toISOString().split('T')[0]);
    setFormDividendYield(inv.dividendYield ? String(inv.dividendYield) : '');
    setFormNotes(inv.notes || '');
    setIsModalOpen(true);
  };

  // Save Modal
  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const units = Math.max(0.00001, parseFloat(formUnits) || 1);
    const buyPrice = Math.max(0, parseFloat(formBuyPrice) || 0);
    const currentPrice = Math.max(0, parseFloat(formCurrentPrice) || buyPrice);
    const dividendYield = parseFloat(formDividendYield) || 0;

    const payload = {
      id: editingInvestment?.id,
      name: formName.trim(),
      symbol: (formSymbol.trim() || formName.trim().substring(0, 4)).toUpperCase(),
      category: formCategory,
      units,
      buyPrice,
      currentPrice,
      date: formDate,
      dividendYield,
      notes: formNotes.trim(),
    };

    if (editingInvestment) {
      onUpdateInvestment?.(payload);
    } else {
      onAddInvestment?.(payload);
    }
    setIsModalOpen(false);
  };

  // Quick Buy More (e.g. add 1 or 5 units)
  const handleQuickAddUnits = (inv) => {
    const addAmt = inv.category === 'crypto' ? 0.05 : 5;
    const newUnits = Number((inv.units + addAmt).toFixed(4));
    onUpdateInvestment?.({
      ...inv,
      units: newUnits,
    });
  };

  // Aggregate Portfolio Metrics
  const portfolioStats = useMemo(() => {
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let annualDividendEstimate = 0;

    investments.forEach(inv => {
      const units = Number(inv.units) || 0;
      const buyPrice = Number(inv.buyPrice) || 0;
      const curPrice = Number(inv.currentPrice) || buyPrice;
      const divYield = Number(inv.dividendYield) || 0;

      const invested = units * buyPrice;
      const curVal = units * curPrice;

      totalInvested += invested;
      totalCurrentValue += curVal;
      annualDividendEstimate += (curVal * (divYield / 100));
    });

    const totalProfit = totalCurrentValue - totalInvested;
    const profitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrentValue,
      totalProfit,
      profitPercent,
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
      const cat = inv.category || 'stocks';
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

  // SIP Compound Interest Calculation:
  // Maturity = P * (( (1 + i)^n - 1 ) / i) * (1 + i)
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

  return (
    <div className="investing-dashboard-container">
      {/* 1. Header Banner */}
      <div className="daily-banner investing-header-banner">
        <div className="investing-header-left">
          <div className="investing-icon-pill">
            <TrendingUp size={22} color="#ffffff" />
          </div>
          <div>
            <h2 className="daily-title">Investment & Wealth Portfolio</h2>
            <p className="daily-subtitle">
              Track equities, systematic mutual funds, crypto, bullion & compound wealth
            </p>
          </div>
        </div>

        <button 
          type="button" 
          className="fogo-btn-primary"
          onClick={handleOpenCreate}
          title="Add New Investment Holding"
        >
          <Plus size={16} />
          <span>Add Investment</span>
        </button>
      </div>

      {/* 2. Executive Portfolio KPI Cards */}
      <div className="fogo-kpi-grid">
        {/* Card 1: Total Portfolio Value */}
        <div className="fogo-card fogo-kpi-card highlight-blue">
          <div className="fogo-kpi-header">
            <span className="fogo-kpi-label">Total Portfolio Value</span>
            <div className="fogo-kpi-icon-pill blue">
              <PieChart size={18} />
            </div>
          </div>
          <div className="fogo-kpi-value-row">
            <h3 className="fogo-kpi-amount">
              {formatCurrency(portfolioStats.totalCurrentValue, symbol, { settings })}
            </h3>
          </div>
          <div className="fogo-kpi-footer">
            <span className="fogo-kpi-badge emerald">
              <ArrowUpRight size={13} /> Active Wealth
            </span>
            <span className="fogo-kpi-note">{investments.length} Active Holdings</span>
          </div>
        </div>

        {/* Card 2: Total Invested Principal */}
        <div className="fogo-card fogo-kpi-card">
          <div className="fogo-kpi-header">
            <span className="fogo-kpi-label">Total Invested (Cost)</span>
            <div className="fogo-kpi-icon-pill neutral">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="fogo-kpi-value-row">
            <h3 className="fogo-kpi-amount">
              {formatCurrency(portfolioStats.totalInvested, symbol, { settings })}
            </h3>
          </div>
          <div className="fogo-kpi-footer">
            <span className="fogo-kpi-badge neutral">
              Principal Capital
            </span>
            <span className="fogo-kpi-note">Base Investment</span>
          </div>
        </div>

        {/* Card 3: Total Profit / Loss */}
        <div className="fogo-card fogo-kpi-card">
          <div className="fogo-kpi-header">
            <span className="fogo-kpi-label">Total Return (P&L)</span>
            <div className={`fogo-kpi-icon-pill ${portfolioStats.totalProfit >= 0 ? 'emerald' : 'rose'}`}>
              {portfolioStats.totalProfit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
          </div>
          <div className="fogo-kpi-value-row">
            <h3 className={`fogo-kpi-amount ${portfolioStats.totalProfit >= 0 ? 'text-emerald' : 'text-rose'}`}>
              {portfolioStats.totalProfit >= 0 ? '+' : ''}
              {formatCurrency(portfolioStats.totalProfit, symbol, { settings })}
            </h3>
          </div>
          <div className="fogo-kpi-footer">
            <span className={`fogo-kpi-badge ${portfolioStats.totalProfit >= 0 ? 'emerald' : 'rose'}`}>
              {portfolioStats.totalProfit >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {portfolioStats.totalProfit >= 0 ? '+' : ''}{portfolioStats.profitPercent.toFixed(2)}% ROI
            </span>
            <span className="fogo-kpi-note">All-Time Returns</span>
          </div>
        </div>

        {/* Card 4: Dividend / Passive Yield */}
        <div className="fogo-card fogo-kpi-card">
          <div className="fogo-kpi-header">
            <span className="fogo-kpi-label">Estimated Annual Yield</span>
            <div className="fogo-kpi-icon-pill amber">
              <Coins size={18} />
            </div>
          </div>
          <div className="fogo-kpi-value-row">
            <h3 className="fogo-kpi-amount text-amber">
              {formatCurrency(portfolioStats.annualDividendEstimate, symbol, { settings })}
            </h3>
          </div>
          <div className="fogo-kpi-footer">
            <span className="fogo-kpi-badge amber">
              Passive Income
            </span>
            <span className="fogo-kpi-note">Dividends / Annual</span>
          </div>
        </div>
      </div>

      {/* 3. Asset Allocation & Distribution Bar */}
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
                <label>Monthly Investment Amount</label>
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
                {[1000, 5000, 10000, 25000, 50000].map(amt => (
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

            {/* Control 2: Expected Return Rate % */}
            <div className="sip-control-group">
              <div className="sip-control-label-row">
                <label>Expected Annual Return (p.a.)</label>
                <div className="sip-val-badge text-emerald">{sipRate}%</div>
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
                {[8, 12, 15, 18].map(r => (
                  <button 
                    key={r} 
                    type="button" 
                    className={`sip-chip ${sipRate === r ? 'active' : ''}`}
                    onClick={() => setSipRate(r)}
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>

            {/* Control 3: Time Horizon in Years */}
            <div className="sip-control-group">
              <div className="sip-control-label-row">
                <label>Investment Horizon</label>
                <div className="sip-val-badge text-brand">{sipYears} Years</div>
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
                <Sparkles size={13} /> +{sipResult.gainPercent}% Estimated Compound Wealth
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
                  <span>Estimated Capital Gains</span>
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

      {/* 5. Holdings Management Section */}
      <div className="investing-holdings-section">
        {/* Controls Toolbar: Search, Filters, Sort */}
        <div className="investing-toolbar">
          <div className="investing-search-wrapper">
            <Search size={16} className="search-icon" />
            <input 
              type="text"
              placeholder="Search by asset name or ticker (e.g. AAPL, BTC, VOO)..."
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
            {/* Filter Tabs */}
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
                : 'Start tracking your stocks, mutual funds, crypto and gold portfolio today.'}
            </p>
            <button 
              type="button" 
              className="fogo-btn-primary"
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
                        <span className="holding-category-tag" style={{ color: catInfo.color }}>
                          {catInfo.icon} {catInfo.name}
                        </span>
                      </div>
                    </div>

                    <div className="holding-actions-group">
                      <button 
                        type="button" 
                        className="holding-icon-btn" 
                        onClick={() => handleQuickAddUnits(inv)}
                        title="Quick Buy / Add Units"
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
                  </div>

                  {/* Pricing & Units Breakdown Grid */}
                  <div className="holding-metrics-grid">
                    <div className="holding-metric-item">
                      <span className="metric-label">Holdings</span>
                      <strong className="metric-val">{units.toLocaleString()} units</strong>
                    </div>

                    <div className="holding-metric-item">
                      <span className="metric-label">Avg Buy Price</span>
                      <strong className="metric-val">{symbol}{buyPrice.toLocaleString()}</strong>
                    </div>

                    <div className="holding-metric-item">
                      <span className="metric-label">Current Price</span>
                      <strong className="metric-val">{symbol}{currentPrice.toLocaleString()}</strong>
                    </div>

                    <div className="holding-metric-item">
                      <span className="metric-label">Total Invested</span>
                      <strong className="metric-val">{formatCurrency(invested, symbol, { settings })}</strong>
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

      {/* 6. Add / Edit Investment Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog modal-content investing-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="investing-modal-icon-pill">
                  <TrendingUp size={20} color="#ffffff" />
                </div>
                <div>
                  <h3 className="modal-title">
                    {editingInvestment ? 'Edit Investment Holding' : 'Add New Investment Asset'}
                  </h3>
                  <p className="modal-subtitle">
                    Enter your holdings details for accurate portfolio valuation and ROI tracking
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="investing-modal-body">
              {/* Asset Name & Ticker Symbol */}
              <div className="form-row two-col">
                <div className="form-group">
                  <label className="form-label">Asset / Fund Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apple Inc. or Vanguard S&P 500"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ticker Symbol</label>
                  <input
                    type="text"
                    placeholder="e.g. AAPL, VOO, BTC"
                    value={formSymbol}
                    onChange={(e) => setFormSymbol(e.target.value.toUpperCase())}
                    className="form-input uppercase"
                  />
                </div>
              </div>

              {/* Asset Class Category */}
              <div className="form-group">
                <label className="form-label">Asset Category *</label>
                <div className="investing-category-picker">
                  {INVESTMENT_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`cat-picker-item ${formCategory === cat.id ? 'active' : ''}`}
                      onClick={() => setFormCategory(cat.id)}
                    >
                      <span className="cat-picker-icon">{cat.icon}</span>
                      <span className="cat-picker-name">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity & Buy Price */}
              <div className="form-row two-col">
                <div className="form-group">
                  <label className="form-label">Quantity / Units Owned *</label>
                  <input
                    type="number"
                    step="any"
                    min="0.000001"
                    max="999999999"
                    required
                    placeholder="e.g. 15 or 0.25"
                    value={formUnits}
                    onChange={(e) => setFormUnits(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Average Buy Price ({symbol}) *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max={MAX_TRANSACTION_AMOUNT}
                    required
                    placeholder="e.g. 150.00"
                    value={formBuyPrice}
                    onChange={(e) => setFormBuyPrice(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Current Market Price & Purchase Date */}
              <div className="form-row two-col">
                <div className="form-group">
                  <label className="form-label">Current Market Price ({symbol}) *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max={MAX_TRANSACTION_AMOUNT}
                    required
                    placeholder="e.g. 175.50"
                    value={formCurrentPrice}
                    onChange={(e) => setFormCurrentPrice(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Purchase Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Dividend Yield & Strategy Notes */}
              <div className="form-row two-col">
                <div className="form-group">
                  <label className="form-label">Annual Dividend Yield (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="e.g. 1.85 (optional)"
                    value={formDividendYield}
                    onChange={(e) => setFormDividendYield(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Strategy / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Long-term retirement hold"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Instant Calculation Preview Banner */}
              {formUnits && formBuyPrice && formCurrentPrice && (
                <div className="investing-calc-preview">
                  <div className="preview-stat">
                    <span>Invested Capital:</span>
                    <strong>{formatCurrency((parseFloat(formUnits) || 0) * (parseFloat(formBuyPrice) || 0), symbol, { settings })}</strong>
                  </div>
                  <div className="preview-stat">
                    <span>Current Valuation:</span>
                    <strong>{formatCurrency((parseFloat(formUnits) || 0) * (parseFloat(formCurrentPrice) || 0), symbol, { settings })}</strong>
                  </div>
                  <div className="preview-stat">
                    <span>Estimated P&L:</span>
                    <strong className={((parseFloat(formCurrentPrice) || 0) >= (parseFloat(formBuyPrice) || 0)) ? 'text-emerald' : 'text-rose'}>
                      {((parseFloat(formCurrentPrice) || 0) >= (parseFloat(formBuyPrice) || 0)) ? '+' : ''}
                      {formatCurrency(((parseFloat(formUnits) || 0) * (parseFloat(formCurrentPrice) || 0)) - ((parseFloat(formUnits) || 0) * (parseFloat(formBuyPrice) || 0)), symbol, { settings })}
                    </strong>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fogo-btn-primary"
                >
                  <Check size={16} />
                  <span>{editingInvestment ? 'Save Changes' : 'Add Investment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
