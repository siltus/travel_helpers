/* ══════════════════════════════════════
   payment.js tests — PAYMENT_DATA + renderPayment
   ══════════════════════════════════════ */
const { makeWindow, loadScripts, evalIn, counter } = require('./_jsdom-helper.js');
const { assert, section, done } = counter();

function setup(country) {
  const win = makeWindow('<div id="payment-content"></div>');
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
  win.renderTip = function() {};
  win.renderSos = function() {};
  win.renderRoad = function() {};
  win.renderPharmacy = function() {};
  win.renderTransit = function() {};
  win.renderExchangeTables = function() {};
  win.updateQrTabVisibility = function() {};
  loadScripts(win, ['countries.js', 'payment.js']);
  if (country) win.localStorage.setItem('travelHelpers_selectedCountry', country);
  return win;
}

section('payment: PAYMENT_DATA covers every country');
{
  const win = setup();
  const COUNTRIES = evalIn(win, 'COUNTRIES');
  const PAYMENT_DATA = evalIn(win, 'PAYMENT_DATA');
  Object.keys(COUNTRIES).forEach(code => {
    assert(PAYMENT_DATA[code], 'PAYMENT_DATA has ' + code);
    if (PAYMENT_DATA[code]) {
      assert(typeof PAYMENT_DATA[code].currency === 'string', code + ': currency label');
      assert(typeof PAYMENT_DATA[code].atm === 'string', code + ': atm advice');
    }
  });
}

section('payment: initPayment + renderPayment work for every country');
{
  const COUNTRIES = evalIn(setup(), 'COUNTRIES');
  Object.keys(COUNTRIES).forEach(code => {
    const win = setup(code);
    win.initPayment();
    const html = win.document.getElementById('payment-content').innerHTML;
    assert(html.length > 0, code + ': payment-content rendered');
    assert(html.includes('Card vs Cash'), code + ': Card vs Cash row rendered');
    assert(html.includes('Contactless'), code + ': Contactless row rendered');
    assert(html.includes('ATMs'), code + ': ATMs row rendered');
  });
}

section('payment: countries with `tips` get a Tips section');
{
  const win = setup('CZ');
  win.initPayment();
  const html = win.document.getElementById('payment-content').innerHTML;
  // CZ entry has tips array — Tips heading must render
  assert(html.includes('💡 Tips'), 'CZ shows Tips heading');
}

section('payment: missing country gracefully empties content');
{
  const win = setup('XX');
  win.initPayment();
  assert(win.document.getElementById('payment-content').innerHTML === '',
    'payment-content empty for unknown country');
}

done();
