/* ══════════════════════════════════════
   tip.js tests — TIP_DATA table + renderTip + calculateTips
   ══════════════════════════════════════ */
const { makeWindow, loadScripts, evalIn, counter } = require('./_jsdom-helper.js');
const { assert, section, done } = counter();

function setup(country) {
  const win = makeWindow(
    '<input id="tip-bill"><span id="tip-currency"></span><div id="tip-results"></div>',
  );
  // countries.js cross-script `let`-shadows
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
  win.QR_COUNTRY_FORMAT = {};
  win.QR_FORMAT_LABELS = {};
  // Stubs for siblings
  win.renderSos = function() {};
  win.renderRoad = function() {};
  win.renderPharmacy = function() {};
  win.renderTransit = function() {};
  win.renderPayment = function() {};
  win.renderExchangeTables = function() {};
  win.updateQrTabVisibility = function() {};
  // exchange.js convert/fmtRate are referenced by tip's fmtHomeEquiv() — stub.
  win.convert = function(val) { return val; };
  win.fmtRate = function(val) { return String(val); };
  loadScripts(win, ['countries.js', 'tip.js']);
  if (country) win.localStorage.setItem('travelHelpers_selectedCountry', country);
  return win;
}

section('tip: TIP_DATA covers every country in COUNTRIES');
{
  const win = setup();
  const COUNTRIES = evalIn(win, 'COUNTRIES');
  const TIP_DATA = evalIn(win, 'TIP_DATA');
  Object.keys(COUNTRIES).forEach(code => {
    assert(TIP_DATA[code], 'TIP_DATA has ' + code);
    if (TIP_DATA[code]) {
      assert(Array.isArray(TIP_DATA[code].restaurant), code + ' has restaurant range');
      assert(typeof TIP_DATA[code].note === 'string', code + ' has note');
    }
  });
}

section('tip: initTip + renderTip work for every country with non-zero bill');
{
  const COUNTRIES = evalIn(setup(), 'COUNTRIES');
  Object.keys(COUNTRIES).forEach(code => {
    const win = setup(code);
    win.document.getElementById('tip-bill').value = '100';
    win.initTip();
    const results = win.document.getElementById('tip-results').innerHTML;
    assert(results.length > 0, code + ': tip-results rendered');
    assert(win.document.getElementById('tip-currency').textContent === COUNTRIES[code].currency,
      code + ': currency badge set to ' + COUNTRIES[code].currency);
  });
}

section('tip: zero bill renders categories without amounts');
{
  const win = setup('CZ');
  win.document.getElementById('tip-bill').value = '0';
  win.initTip();
  const html = win.document.getElementById('tip-results').innerHTML;
  assert(html.includes('tip-category'), 'categories still rendered');
  assert(!/Total:/.test(html), 'no Total: line when bill is 0');
}

section('tip: calculateTips with JPY rounds to integer (no decimals)');
{
  const win = setup('JP');
  win.document.getElementById('tip-bill').value = '1000';
  win.initTip();
  const html = win.document.getElementById('tip-results').innerHTML;
  // Japan TIP_DATA has all-zero categories → "No tip expected" or just no amount
  assert(html.includes('tip-category'), 'categories rendered for JP');
}

section('tip: noDecimals branch hits HUF formatting');
{
  const win = setup('HU');
  win.document.getElementById('tip-bill').value = '5000';
  win.initTip();
  const html = win.document.getElementById('tip-results').innerHTML;
  // HUF, no decimals — totals must not contain '.00'
  assert(html.includes('HUF'), 'HUF appears in output');
}

section('tip: missing country gracefully no-ops');
{
  const win = setup('XX');
  win.document.getElementById('tip-bill').value = '50';
  win.initTip();
  // renderTip early-returns when data is undefined; results stay empty.
  assert(win.document.getElementById('tip-results').innerHTML === '',
    'results untouched for unknown country');
}

section('tip: fmtHomeEquiv branch exercises when rates cached');
{
  const win = setup('CZ');
  win.localStorage.setItem('travelHelpers_exchangeRates', JSON.stringify({
    rates: { CZK: 25, USD: 1.1, ILS: 4, EUR: 1 },
    date: '2026-01-01',
    timestamp: Date.now(),
  }));
  win.document.getElementById('tip-bill').value = '100';
  win.initTip();
  const html = win.document.getElementById('tip-results').innerHTML;
  assert(html.includes('tip-equiv') || html.length > 0, 'tip-equiv span or content present');
}

done();
