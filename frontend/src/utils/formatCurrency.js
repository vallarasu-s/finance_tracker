// Currency, Number & Date Formatting Utilities

const SETTINGS_STORAGE_KEY = 'zt_finance_settings_v1';

// Maximum allowed transaction amount (999 Trillion / 99 Lakh Crore) to prevent number overflow
export const MAX_TRANSACTION_AMOUNT = 999999999999999;

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

export const POPULAR_CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'CAD', 'AUD', 'SAR', 'SGD', 'JPY'];

export function getCurrencyInfo(code) {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
}

function readSettingsFallback() {
  const defaults = {
    currency: 'USD',
    currencySymbol: '$',
    numberFormat: 'auto',
    compactNumbers: true,
    croreSymbol: 'c',
    currencyDisplay: 'symbol',
  };
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

/**
 * Format number in shortform (compact notation)
 * Supports Indian system (K, L, c/Cr) and International system (K, M, B, T)
 */
export function formatShortNumber(amount, options = {}) {
  const num = Number(amount) || 0;
  if (!isFinite(num) || isNaN(num)) return '0';

  const isNegative = num < 0;
  const abs = Math.abs(num);

  const style = options.style || 'indian'; // 'indian' | 'international' | 'standard'
  const croreSym = options.croreSymbol || 'c'; // 'c' or 'Cr'

  // Boundary check for extreme numbers to prevent layout breaking
  if (abs >= 1e15) {
    const prefix = isNegative ? '-' : '';
    if (style === 'indian') {
      return `${prefix}>999 Lakh ${croreSym}`;
    }
    return `${prefix}>999T`;
  }

  const formatDec = (val, maxDec = 2) => {
    const rounded = parseFloat(val.toFixed(maxDec));
    return rounded.toLocaleString('en-US', { maximumFractionDigits: maxDec });
  };

  const sign = isNegative ? '-' : '';

  if (style === 'indian') {
    if (abs < 1000) {
      return `${sign}${formatDec(abs, 2)}`;
    }
    if (abs < 100000) {
      return `${sign}${formatDec(abs / 1e3, 1)}K`;
    }
    if (abs < 10000000) {
      return `${sign}${formatDec(abs / 1e5, 2)}L`;
    }
    if (abs < 100000000000) {
      return `${sign}${formatDec(abs / 1e7, 2)}${croreSym}`;
    }
    return `${sign}${formatDec(abs / 1e7, 1)}${croreSym}`;
  }

  if (style === 'international') {
    if (abs < 1000) {
      return `${sign}${formatDec(abs, 2)}`;
    }
    if (abs < 1e6) {
      return `${sign}${formatDec(abs / 1e3, 1)}K`;
    }
    if (abs < 1e9) {
      return `${sign}${formatDec(abs / 1e6, 2)}M`;
    }
    if (abs < 1e12) {
      return `${sign}${formatDec(abs / 1e9, 2)}B`;
    }
    return `${sign}${formatDec(abs / 1e12, 2)}T`;
  }

  // Standard full formatting
  return `${sign}${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format currency with optional compact shortform mode and country currency code display
 */
export function formatCurrency(amount, symbol = '$', options = {}) {
  const num = Number(amount) || 0;
  const opts = typeof options === 'boolean' ? { compact: options } : (options || {});
  const settings = opts.settings || readSettingsFallback();

  const activeCurrencyCode = opts.currencyCode || settings.currency || 'USD';
  const currencyDisplay = opts.currencyDisplay || settings.currencyDisplay || 'symbol';
  const croreSymbol = opts.croreSymbol || settings.croreSymbol || 'c';

  // Determine if this country currency uses South Asian (Indian) numbering system
  const isSouthAsian =
    ['INR', 'PKR', 'BDT', 'NPR', 'LKR'].includes(activeCurrencyCode) ||
    symbol === '₹' ||
    symbol === 'Rs' ||
    symbol === '₨' ||
    symbol === '৳';

  let numberFormat = opts.style || settings.numberFormat;
  if (!numberFormat || numberFormat === 'auto') {
    numberFormat = isSouthAsian ? 'indian' : 'international';
  }

  const isCompact =
    opts.compact !== undefined
      ? opts.compact
      : settings.compactNumbers !== false && (Math.abs(num) >= 100000 || opts.autoCompact);

  let formattedNumberStr = '';

  if (isCompact && numberFormat !== 'standard' && Math.abs(num) >= 1000) {
    formattedNumberStr = formatShortNumber(num, { style: numberFormat, croreSymbol });
  } else if (Math.abs(num) >= 1e15) {
    formattedNumberStr = formatShortNumber(num, { style: numberFormat, croreSymbol });
  } else {
    const locale = isSouthAsian ? 'en-IN' : 'en-US';
    formattedNumberStr = num.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const sym = symbol || '';
  const code = activeCurrencyCode;

  if (currencyDisplay === 'code') {
    return `${formattedNumberStr} ${code}`;
  }
  if (currencyDisplay === 'both') {
    if (sym && sym.length > 1 && !sym.endsWith('$')) {
      return `${sym} ${formattedNumberStr} ${code}`;
    }
    return `${sym}${formattedNumberStr} ${code}`;
  }

  if (sym && sym.length > 1 && !sym.endsWith('$')) {
    return `${sym} ${formattedNumberStr}`;
  }
  return `${sym}${formattedNumberStr}`;
}

/**
 * Helper to force compact shortform formatting
 */
export function formatCompactCurrency(amount, symbol = '$', options = {}) {
  return formatCurrency(amount, symbol, { ...options, compact: true });
}

/**
 * Parse user entered amounts containing shortform suffixes (e.g. '10c', '10cr', '5L', '25k', '2M', '1.5B')
 */
export function parseShortAmount(input) {
  if (input === null || input === undefined || input === '') {
    return { value: 0, isValid: false, raw: '', preview: '', error: 'Empty input' };
  }
  if (typeof input === 'number') {
    if (!isFinite(input) || isNaN(input)) {
      return { value: 0, isValid: false, raw: '', preview: '', error: 'Invalid number' };
    }
    const clamped = Math.min(MAX_TRANSACTION_AMOUNT, Math.max(0, input));
    return {
      value: clamped,
      isValid: true,
      baseNum: clamped,
      unit: '',
      unitLabel: '',
      multiplier: 1,
      raw: String(clamped),
      preview: `${clamped}`,
    };
  }

  let str = String(input).trim();
  str = str.replace(/[$₹€£¥,]/g, '').trim();
  if (!str) {
    return { value: 0, isValid: false, raw: '', preview: '', error: 'Empty input' };
  }

  const match = str.match(/^([+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+))\s*([a-z]+)?$/i);
  if (!match) {
    const fallback = parseFloat(str);
    if (!isNaN(fallback) && isFinite(fallback)) {
      const clamped = Math.min(MAX_TRANSACTION_AMOUNT, Math.max(0, fallback));
      return {
        value: clamped,
        isValid: true,
        baseNum: clamped,
        unit: '',
        unitLabel: '',
        multiplier: 1,
        raw: str,
        preview: `${clamped}`,
      };
    }
    return { value: 0, isValid: false, raw: str, preview: '', error: 'Invalid number format' };
  }

  const baseNum = parseFloat(match[1]);
  if (isNaN(baseNum) || !isFinite(baseNum)) {
    return { value: 0, isValid: false, raw: str, preview: '', error: 'Invalid number' };
  }

  const unit = (match[2] || '').toLowerCase();
  let multiplier = 1;
  let unitLabel = '';

  switch (unit) {
    case 'k':
    case 'th':
    case 'thousand':
    case 'thousands':
      multiplier = 1e3;
      unitLabel = 'Thousand';
      break;
    case 'l':
    case 'lac':
    case 'lacs':
    case 'lakh':
    case 'lakhs':
      multiplier = 1e5;
      unitLabel = 'Lakh';
      break;
    case 'c':
    case 'cr':
    case 'crore':
    case 'crores':
      multiplier = 1e7;
      unitLabel = 'Crore';
      break;
    case 'ar':
    case 'arab':
    case 'arabs':
      multiplier = 1e9;
      unitLabel = 'Arab (100 Crore)';
      break;
    case 'kh':
    case 'kharab':
    case 'kharabs':
      multiplier = 1e11;
      unitLabel = 'Kharab';
      break;
    case 'm':
    case 'mil':
    case 'million':
    case 'millions':
      multiplier = 1e6;
      unitLabel = 'Million';
      break;
    case 'b':
    case 'bn':
    case 'billion':
    case 'billions':
      multiplier = 1e9;
      unitLabel = 'Billion';
      break;
    case 't':
    case 'tn':
    case 'trillion':
    case 'trillions':
      multiplier = 1e12;
      unitLabel = 'Trillion';
      break;
    case '':
      multiplier = 1;
      unitLabel = '';
      break;
    default:
      return { value: 0, isValid: false, raw: str, preview: '', error: `Unknown unit "${unit}"` };
  }

  const calculatedValue = baseNum * multiplier;
  if (!isFinite(calculatedValue) || isNaN(calculatedValue)) {
    return { value: 0, isValid: false, raw: str, preview: '', error: 'Number is too large' };
  }

  const isExceeded = calculatedValue > MAX_TRANSACTION_AMOUNT;
  const finalValue = isExceeded ? MAX_TRANSACTION_AMOUNT : calculatedValue;

  return {
    value: finalValue,
    isValid: true,
    baseNum,
    unit,
    unitLabel,
    multiplier,
    raw: str,
    isExceeded,
    preview: `${finalValue}`,
  };
}

/**
 * Format 24h time string (HH:MM or HH:MM:SS) to 12h format with AM/PM
 */
export function formatTime12Hour(timeStr) {
  if (!timeStr) return '';
  const str = String(timeStr).trim();
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

/**
 * Format date string (YYYY-MM-DD) to friendly format (e.g. Sep 17, 2026)
 */
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

export default formatCurrency;
