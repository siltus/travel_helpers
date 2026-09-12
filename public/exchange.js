/* ══════════════════════════════════════
   Exchange Rates
   ══════════════════════════════════════ */
const REFERENCE_CURRENCIES = ['ILS', 'EUR', 'USD'];
const AMOUNTS = [1, 5, 20, 100];
const CACHE_KEY = 'travelHelpers_exchangeRates';
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const SELECTED_CURRENCY_KEY = 'travelHelpers_selectedCurrency';
const FALLBACK_RATES_URL = 'https://open.er-api.com/v6/latest/EUR';

const CURRENCIES = {
  CZK: { name: 'Czech Koruna',        flag: '🇨🇿' },
  PLN: { name: 'Polish Złoty',        flag: '🇵🇱' },
  HUF: { name: 'Hungarian Forint',    flag: '🇭🇺' },
  RON: { name: 'Romanian Leu',        flag: '🇷🇴' },
  BGN: { name: 'Bulgarian Lev',       flag: '🇧🇬' },
  TRY: { name: 'Turkish Lira',        flag: '🇹🇷' },
  AZN: { name: 'Azerbaijani Manat',  flag: '🇦🇿' },
  GBP: { name: 'British Pound',       flag: '🇬🇧' },
  CHF: { name: 'Swiss Franc',         flag: '🇨🇭' },
  SEK: { name: 'Swedish Krona',       flag: '🇸🇪' },
  NOK: { name: 'Norwegian Krone',     flag: '🇳🇴' },
  DKK: { name: 'Danish Krone',        flag: '🇩🇰' },
  ISK: { name: 'Icelandic Króna',     flag: '🇮🇸' },
  THB: { name: 'Thai Baht',           flag: '🇹🇭' },
  JPY: { name: 'Japanese Yen',        flag: '🇯🇵' },
  KRW: { name: 'South Korean Won',    flag: '🇰🇷' },
  INR: { name: 'Indian Rupee',        flag: '🇮🇳' },
  IDR: { name: 'Indonesian Rupiah',   flag: '🇮🇩' },
  MYR: { name: 'Malaysian Ringgit',   flag: '🇲🇾' },
  SGD: { name: 'Singapore Dollar',    flag: '🇸🇬' },
  PHP: { name: 'Philippine Peso',     flag: '🇵🇭' },
  HKD: { name: 'Hong Kong Dollar',    flag: '🇭🇰' },
  CNY: { name: 'Chinese Yuan',        flag: '🇨🇳' },
  AUD: { name: 'Australian Dollar',   flag: '🇦🇺' },
  NZD: { name: 'New Zealand Dollar',  flag: '🇳🇿' },
  MXN: { name: 'Mexican Peso',        flag: '🇲🇽' },
  BRL: { name: 'Brazilian Real',      flag: '🇧🇷' },
  ZAR: { name: 'South African Rand',  flag: '🇿🇦' },
  EUR: { name: 'Euro',                flag: '🇪🇺' },
  USD: { name: 'US Dollar',           flag: '🇺🇸' },
  ILS: { name: 'Israeli Shekel',      flag: '🇮🇱' },
};

let exchangeInitialized = false;
let eurRates = null;
let rateDate = null;

function initExchange() {
  exchangeInitialized = true;
  populateCurrencySelect();
  const countryCode = typeof getSelectedCountry === 'function' ? getSelectedCountry() : '';
  const countryCurrency = typeof COUNTRIES !== 'undefined' && COUNTRIES[countryCode]
    ? COUNTRIES[countryCode].currency
    : '';
  const select = document.getElementById('currency-select');
  if (select && CURRENCIES[countryCurrency]) {
    select.value = countryCurrency;
    localStorage.setItem(SELECTED_CURRENCY_KEY, countryCurrency);
  }
  refreshRates(false);
}

function populateCurrencySelect() {
  const select = document.getElementById('currency-select');
  const saved = localStorage.getItem(SELECTED_CURRENCY_KEY) || 'CZK';
  const codes = Object.keys(CURRENCIES).sort((a, b) => {
    const aRef = REFERENCE_CURRENCIES.includes(a);
    const bRef = REFERENCE_CURRENCIES.includes(b);
    if (aRef !== bRef) return aRef ? 1 : -1;
    return CURRENCIES[a].name.localeCompare(CURRENCIES[b].name);
  });
  select.innerHTML = codes.map(code => {
    const c = CURRENCIES[code];
    return `<option value="${code}" ${code === saved ? 'selected' : ''}>${c.flag} ${c.name} (${code})</option>`;
  }).join('');
}

async function fillMissingRates(rates) {
  const missing = Object.keys(CURRENCIES).filter(code =>
    code !== 'EUR' && !Number.isFinite(rates[code])
  );
  if (!missing.length) return [];

  const resp = await fetch(FALLBACK_RATES_URL);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} from fallback rates`);
  const data = await resp.json();
  if (data.result !== 'success' || !data.rates) {
    throw new Error('Fallback rates response was invalid');
  }

  const added = [];
  missing.forEach(code => {
    if (Number.isFinite(data.rates[code])) {
      rates[code] = data.rates[code];
      added.push(code);
    }
  });
  return added;
}

function showMissingRatesWarning(error) {
  const errorEl = document.getElementById('exchange-error');
  if (!errorEl) return;
  errorEl.textContent = '⚠ Some currency rates are unavailable: ' + error.message;
  errorEl.style.display = 'block';
}

function onCurrencyChange() {
  const code = document.getElementById('currency-select').value;
  localStorage.setItem(SELECTED_CURRENCY_KEY, code);
  if (eurRates) renderExchangeTables();
}

async function refreshRates(force) {
  const loadingEl = document.getElementById('exchange-loading');
  const errorEl = document.getElementById('exchange-error');
  const contentEl = document.getElementById('exchange-content');

  if (!force) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < CACHE_DURATION) {
          eurRates = data.rates;
          eurRates['EUR'] = 1;
          rateDate = data.date;
          try {
            const added = await fillMissingRates(eurRates);
            if (added.length) {
              localStorage.setItem(CACHE_KEY, JSON.stringify({
                rates: eurRates,
                date: rateDate,
                timestamp: Date.now(),
              }));
            }
          } catch (err) {
            showMissingRatesWarning(err);
          }
          renderExchangeTables();
          return;
        }
      } catch(_e) { /* ignore bad cache */ }
    }
  }

  loadingEl.style.display = 'block';
  errorEl.style.display = 'none';
  contentEl.style.display = 'none';

  try {
    const resp = await fetch('https://api.frankfurter.dev/v1/latest?from=EUR');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    eurRates = data.rates;
    eurRates['EUR'] = 1;
    rateDate = data.date;
    let fallbackError = null;
    try {
      await fillMissingRates(eurRates);
    } catch (err) {
      fallbackError = err;
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      rates: eurRates,
      date: rateDate,
      timestamp: Date.now()
    }));
    renderExchangeTables();
    if (fallbackError) showMissingRatesWarning(fallbackError);
  } catch(err) {
    errorEl.textContent = '⚠ Failed to fetch exchange rates: ' + err.message;
    errorEl.style.display = 'block';
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        eurRates = data.rates;
        eurRates['EUR'] = 1;
        rateDate = data.date;
        try {
          const added = await fillMissingRates(eurRates);
          if (added.length) {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              rates: eurRates,
              date: rateDate,
              timestamp: Date.now(),
            }));
          }
        } catch (fallbackErr) {
          showMissingRatesWarning(fallbackErr);
        }
        renderExchangeTables();
        errorEl.textContent += ' — showing cached rates';
      } catch(_e) { /* no luck */ }
    }
  } finally {
    loadingEl.style.display = 'none';
  }
}

function convert(amount, fromCode, toCode) {
  if (fromCode === toCode) return amount;
  const fromRate = fromCode === 'EUR' ? 1 : eurRates && eurRates[fromCode];
  const toRate = toCode === 'EUR' ? 1 : eurRates && eurRates[toCode];
  if (!Number.isFinite(fromRate) || !Number.isFinite(toRate)) return NaN;
  return (amount / fromRate) * toRate;
}

function fmtRate(val) {
  if (!Number.isFinite(val)) return 'N/A';
  const abs = Math.abs(val);
  let decimals;
  if (abs >= 1) decimals = 2;
  else if (abs >= 0.01) decimals = 4;
  else decimals = 6;
  return val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function renderExchangeTables() {
  const target = document.getElementById('currency-select').value;
  const info = CURRENCIES[target];
  const refs = REFERENCE_CURRENCIES.filter(c => c !== target);

  document.getElementById('rate-date').textContent = `Rates: ${rateDate}`;

  let out = '';
  refs.forEach(r => {
    const ri = CURRENCIES[r];
    out += `<div class="rate-section">`;
    out += `<div class="rate-section-title">${ri.flag} ${r} ↔ ${info.flag} ${target}</div>`;
    out += `<div class="rate-table-wrap"><table class="rate-table">`;
    out += `<thead><tr><th>${target} → ${r}</th><th>${r} → ${target}</th></tr></thead><tbody>`;
    AMOUNTS.forEach(amt => {
      const toRef = fmtRate(convert(amt, target, r));
      const toLocal = fmtRate(convert(amt, r, target));
      out += `<tr>`;
      out += `<td>${amt} ${target} = ${toRef} ${r}</td>`;
      out += `<td>${amt} ${r} = ${toLocal} ${target}</td>`;
      out += `</tr>`;
    });
    out += '</tbody></table></div></div>';
  });

  document.getElementById('rate-tables').innerHTML = out;
  document.getElementById('exchange-content').style.display = 'block';
}
