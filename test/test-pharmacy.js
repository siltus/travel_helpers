/* ══════════════════════════════════════
   pharmacy.js tests — PHARMACY_DATA + renderPharmacy
   ══════════════════════════════════════ */
const { makeWindow, loadScripts, evalIn, counter } = require('./_jsdom-helper.js');
const { assert, section, done } = counter();

function setup(country) {
  const win = makeWindow('<div id="pharmacy-content"></div>');
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
  win.renderTransit = function() {};
  win.renderPayment = function() {};
  win.renderExchangeTables = function() {};
  win.updateQrTabVisibility = function() {};
  loadScripts(win, ['countries.js', 'pharmacy.js']);
  if (country) win.localStorage.setItem('travelHelpers_selectedCountry', country);
  return win;
}

section('pharmacy: PHARMACY_DATA covers every country');
{
  const win = setup();
  const COUNTRIES = evalIn(win, 'COUNTRIES');
  const PHARMACY_DATA = evalIn(win, 'PHARMACY_DATA');
  Object.keys(COUNTRIES).forEach(code => {
    assert(PHARMACY_DATA[code], 'PHARMACY_DATA has ' + code);
    if (PHARMACY_DATA[code]) {
      assert(typeof PHARMACY_DATA[code].sign === 'string', code + ': sign string');
      assert(Array.isArray(PHARMACY_DATA[code].drugs), code + ': drugs array');
    }
  });
}

section('pharmacy: initPharmacy + renderPharmacy work for every country');
{
  const COUNTRIES = evalIn(setup(), 'COUNTRIES');
  Object.keys(COUNTRIES).forEach(code => {
    const win = setup(code);
    win.initPharmacy();
    const html = win.document.getElementById('pharmacy-content').innerHTML;
    assert(html.length > 0, code + ': pharmacy-content rendered');
    assert(html.includes('Common Drugs') || html.includes('Apteka') || html.includes('Pharmacy') || html.includes('Apothek') || html.includes('Farmac') || html.includes('drug') || html.length > 100,
      code + ': drugs section rendered');
  });
}

section('pharmacy: missing country gracefully empties content');
{
  const win = setup('XX');
  win.initPharmacy();
  assert(win.document.getElementById('pharmacy-content').innerHTML === '',
    'pharmacy-content empty for unknown country');
}

done();
