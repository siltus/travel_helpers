/* ══════════════════════════════════════
   countries.js tests — shared country metadata + select helpers
   ══════════════════════════════════════ */
const { makeWindow, loadScripts, evalIn, counter } = require('./_jsdom-helper.js');
const { assert, section, done } = counter();

function setup(bodyHtml, scripts) {
  const win = makeWindow(bodyHtml);
  // countries.js references `let`-declared bindings from sibling modules
  // (exchangeInitialized, tipInitialized, etc.). In production all scripts
  // co-load, so those names resolve. For isolated tests we expose matching
  // properties on the global object so the references succeed.
  win.eurRates = null;
  win.rateDate = null;
  win.exchangeInitialized = false;
  win.tipInitialized = false;
  win.sosInitialized = false;
  win.roadInitialized = false;
  win.pharmacyInitialized = false;
  win.transitInitialized = false;
  win.paymentInitialized = false;
  win.SELECTED_CURRENCY_KEY = 'travelHelpers_selectedCurrency';
  win.QR_COUNTRY_FORMAT = { CZ: 'SPAYD', DE: 'EPC' };
  win.QR_FORMAT_LABELS = { SPAYD: '💳 QR', EPC: '💳 EPC' };
  // Stubs for cross-module callbacks invoked by onGlobalCountryChange.
  win.renderTip = function() {};
  win.renderSos = function() {};
  win.renderRoad = function() {};
  win.renderPharmacy = function() {};
  win.renderTransit = function() {};
  win.renderPayment = function() {};
  win.renderExchangeTables = function() {};
  win.updateQrTabVisibility = function() {};
  loadScripts(win, scripts || ['countries.js']);
  return win;
}

section('countries: COUNTRIES table is complete and well-formed');
{
  const win = setup('');
  const countries = evalIn(win, 'COUNTRIES');
  const codes = Object.keys(countries);
  assert(codes.length === 20, '20 countries listed: got ' + codes.length);
  codes.forEach(code => {
    const c = countries[code];
    assert(typeof c.name === 'string' && c.name.length > 0, code + ' has name');
    assert(typeof c.currency === 'string' && c.currency.length === 3, code + ' has 3-letter currency');
    assert(typeof c.flag === 'string', code + ' has flag');
  });
}

section('countries: populateCountrySelect fills options sorted by name');
{
  const win = setup('<select id="x"></select>');
  const subset = { CZ: 1, DE: 1, FR: 1 };
  win.populateCountrySelect('x', subset);
  const sel = win.document.getElementById('x');
  const opts = Array.from(sel.querySelectorAll('option')).map(o => o.value);
  assert(opts.length === 3, '3 options rendered: got ' + opts.length);
  // Sorted by name: Czech Republic, France, Germany
  assert(opts[0] === 'CZ' && opts[1] === 'FR' && opts[2] === 'DE',
    'sorted alphabetically by country name: ' + opts.join(','));
}

section('countries: populateCountrySelect with missing saved country picks first');
{
  const win = setup('<select id="x"></select>');
  win.localStorage.setItem('travelHelpers_selectedCountry', 'XX');
  win.populateCountrySelect('x', { CZ: 1, DE: 1 });
  const sel = win.document.getElementById('x');
  assert(sel.value === 'CZ' || sel.value === 'DE', 'fallback selected: ' + sel.value);
}

section('countries: setSelectedCountry persists + syncs visible selects');
{
  const win = setup(
    '<select id="a" class="country-select"><option value="CZ">CZ</option><option value="DE">DE</option></select>' +
    '<select id="b" class="country-select"><option value="CZ">CZ</option><option value="DE">DE</option></select>',
  );
  win.setSelectedCountry('DE');
  assert(win.localStorage.getItem('travelHelpers_selectedCountry') === 'DE', 'stored DE');
  assert(win.document.getElementById('a').value === 'DE', 'select a synced');
  assert(win.document.getElementById('b').value === 'DE', 'select b synced');
}

section('countries: getSelectedCountry defaults to CZ when nothing stored');
{
  const win = setup('');
  win.localStorage.removeItem('travelHelpers_selectedCountry');
  assert(win.getSelectedCountry() === 'CZ', 'default CZ');
}

section('countries: populateGlobalCountrySelect emits 20 options');
{
  const win = setup('<select id="global-country-select"></select>');
  win.populateGlobalCountrySelect();
  const sel = win.document.getElementById('global-country-select');
  assert(sel.querySelectorAll('option').length === 20, '20 options rendered');
}

section('countries: onGlobalCountryChange persists + triggers init-aware re-renders');
{
  const win = setup(
    '<select id="global-country-select"><option value="CZ">CZ</option><option value="DE">DE</option></select>' +
    '<select id="currency-select"><option value="EUR">EUR</option></select>',
  );
  let renderTipCalled = 0;
  win.renderTip = function() { renderTipCalled++; };
  win.tipInitialized = true;
  win.document.getElementById('global-country-select').value = 'DE';
  win.onGlobalCountryChange();
  assert(win.localStorage.getItem('travelHelpers_selectedCountry') === 'DE', 'stored DE');
  assert(renderTipCalled === 1, 'renderTip invoked once: got ' + renderTipCalled);
}

section('countries: loadCachedRates parses cached JSON and pushes onto globals');
{
  const win = setup('');
  win.localStorage.setItem('travelHelpers_exchangeRates', JSON.stringify({
    rates: { USD: 1.1, ILS: 4.0 },
    date: '2026-01-01',
    timestamp: Date.now(),
  }));
  const ok = win.loadCachedRates();
  assert(ok === true, 'returns true when cache present');
  assert(win.eurRates && win.eurRates.USD === 1.1, 'rates populated');
  assert(win.rateDate === '2026-01-01', 'date populated');
}

section('countries: loadCachedRates returns false on corrupt cache');
{
  const win = setup('');
  win.localStorage.setItem('travelHelpers_exchangeRates', 'not-json');
  win.eurRates = null;
  const ok = win.loadCachedRates();
  assert(ok === false, 'returns false on corrupt JSON');
}

section('countries: loadCachedRates is a no-op when eurRates already set');
{
  const win = setup('');
  win.eurRates = { USD: 1.0 };
  const ok = win.loadCachedRates();
  assert(ok === true, 'returns true (already loaded)');
}

done();
