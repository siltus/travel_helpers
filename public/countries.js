/* Shared country metadata used by tip, emergency, and road tools */
const COUNTRIES = {
  CZ: { name: 'Czech Republic',  flag: '🇨🇿', currency: 'CZK' },
  PL: { name: 'Poland',          flag: '🇵🇱', currency: 'PLN' },
  HU: { name: 'Hungary',         flag: '🇭🇺', currency: 'HUF' },
  DE: { name: 'Germany',         flag: '🇩🇪', currency: 'EUR' },
  AT: { name: 'Austria',         flag: '🇦🇹', currency: 'EUR' },
  IT: { name: 'Italy',           flag: '🇮🇹', currency: 'EUR' },
  FR: { name: 'France',          flag: '🇫🇷', currency: 'EUR' },
  ES: { name: 'Spain',           flag: '🇪🇸', currency: 'EUR' },
  PT: { name: 'Portugal',        flag: '🇵🇹', currency: 'EUR' },
  GR: { name: 'Greece',          flag: '🇬🇷', currency: 'EUR' },
  HR: { name: 'Croatia',         flag: '🇭🇷', currency: 'EUR' },
  NL: { name: 'Netherlands',     flag: '🇳🇱', currency: 'EUR' },
  BE: { name: 'Belgium',         flag: '🇧🇪', currency: 'EUR' },
  TR: { name: 'Turkey',          flag: '🇹🇷', currency: 'TRY' },
  GB: { name: 'United Kingdom',  flag: '🇬🇧', currency: 'GBP' },
  CH: { name: 'Switzerland',     flag: '🇨🇭', currency: 'CHF' },
  TH: { name: 'Thailand',        flag: '🇹🇭', currency: 'THB' },
  JP: { name: 'Japan',           flag: '🇯🇵', currency: 'JPY' },
  RO: { name: 'Romania',         flag: '🇷🇴', currency: 'RON' },
  BG: { name: 'Bulgaria',        flag: '🇧🇬', currency: 'BGN' },
};

const COUNTRY_LS_KEY = 'travelHelpers_selectedCountry';

/* Populate a <select> with countries from a data object, synced to localStorage */
function populateCountrySelect(selectId, dataObj) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const saved = localStorage.getItem(COUNTRY_LS_KEY) || 'CZ';
  const codes = Object.keys(dataObj).sort((a, b) =>
    COUNTRIES[a].name.localeCompare(COUNTRIES[b].name)
  );
  select.innerHTML = codes.map(code => {
    const c = COUNTRIES[code];
    return `<option value="${code}" ${code === saved ? 'selected' : ''}>${c.flag} ${c.name}</option>`;
  }).join('');
  // If saved country isn't in this tool's data, select first available
  if (!dataObj[saved] && codes.length) select.value = codes[0];
}

/* Update country in localStorage and sync all country selects on the page */
function setSelectedCountry(code) {
  localStorage.setItem(COUNTRY_LS_KEY, code);
  document.querySelectorAll('.country-select').forEach(sel => {
    const option = sel.querySelector(`option[value="${code}"]`);
    if (option) sel.value = code;
  });
}

function getSelectedCountry() {
  return localStorage.getItem(COUNTRY_LS_KEY) || 'CZ';
}

function populateGlobalCountrySelect() {
  const select = document.getElementById('global-country-select');
  if (!select) return;
  const saved = getSelectedCountry();
  const codes = Object.keys(COUNTRIES).sort((a, b) =>
    COUNTRIES[a].name.localeCompare(COUNTRIES[b].name)
  );
  select.innerHTML = codes.map(code => {
    const c = COUNTRIES[code];
    return '<option value="' + code + '" ' + (code === saved ? 'selected' : '') + '>' + c.flag + ' ' + c.name + '</option>';
  }).join('');
}

function onGlobalCountryChange() {
  const code = document.getElementById('global-country-select').value;
  setSelectedCountry(code);
  // Sync exchange rate currency to this country's currency
  const cur = COUNTRIES[code] && COUNTRIES[code].currency;
  if (cur && exchangeInitialized) {
    const sel = document.getElementById('currency-select');
    if (sel && sel.querySelector('option[value="' + cur + '"]')) {
      sel.value = cur;
      localStorage.setItem(SELECTED_CURRENCY_KEY, cur);
      if (eurRates) renderExchangeTables();
    }
  }
  // Re-render active page's country-dependent content
  if (tipInitialized) renderTip();
  if (sosInitialized) renderSos();
  if (roadInitialized) renderRoad();
  if (typeof pharmacyInitialized !== 'undefined' && pharmacyInitialized) renderPharmacy();
  if (typeof transitInitialized !== 'undefined' && transitInitialized) renderTransit();
  if (typeof paymentInitialized !== 'undefined' && paymentInitialized) renderPayment();
  if (typeof rentalInitialized !== 'undefined' && rentalInitialized) renderRental();
  if (typeof ztlInitialized !== 'undefined' && ztlInitialized) renderZtl();
  if (typeof mealsInitialized !== 'undefined' && mealsInitialized) renderMeals();
  // Update QR tab visibility
  updateQrTabVisibility();
}

/* Try to load cached exchange rates for tip calculator integration */
function loadCachedRates() {
  if (typeof eurRates !== 'undefined' && eurRates) return true;
  const cached = localStorage.getItem('travelHelpers_exchangeRates');
  if (!cached) return false;
  try {
    const data = JSON.parse(cached);
    // Make eurRates available globally (declared with let in exchange.js)
    eurRates = data.rates;
    rateDate = data.date;
    return true;
  } catch(_e) { return false; }
}
