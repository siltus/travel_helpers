/* ══════════════════════════════════════
   ztl.js tests — ZTL_DATA + renderZtl
   ══════════════════════════════════════ */
const { makeWindow, loadScripts, evalIn, counter } = require('./_jsdom-helper.js');
const { assert, section, done } = counter();

function setup(country) {
  const win = makeWindow('<div id="ztl-content"></div>');
  win.eurRates = null;
  win.rateDate = null;
  win.exchangeInitialized = false;
  win.tipInitialized = false;
  win.sosInitialized = false;
  win.roadInitialized = false;
  win.pharmacyInitialized = false;
  win.transitInitialized = false;
  win.paymentInitialized = false;
  win.ztlInitialized = false;
  win.SELECTED_CURRENCY_KEY = 'travelHelpers_selectedCurrency';
  win.QR_COUNTRY_FORMAT = {};
  win.QR_FORMAT_LABELS = {};
  win.renderTip = function() {};
  win.renderSos = function() {};
  win.renderRoad = function() {};
  win.renderPharmacy = function() {};
  win.renderTransit = function() {};
  win.renderPayment = function() {};
  win.renderExchangeTables = function() {};
  win.updateQrTabVisibility = function() {};
  loadScripts(win, ['countries.js', 'ztl.js']);
  if (country) win.localStorage.setItem('travelHelpers_selectedCountry', country);
  return win;
}

section('ztl: ZTL_DATA exposes the documented countries');
{
  const win = setup();
  const ZTL_DATA = evalIn(win, 'ZTL_DATA');
  ['IT', 'DE', 'FR', 'GB', 'BE', 'NL'].forEach(code => {
    assert(ZTL_DATA[code], 'ZTL_DATA has ' + code);
    assert(Array.isArray(ZTL_DATA[code].cities), code + ': cities array');
    assert(Array.isArray(ZTL_DATA[code].howToAvoid), code + ': avoid list');
  });
}

section('ztl: listed countries render severity + city cards');
{
  const win = setup('IT');
  win.initZtl();
  const html = win.document.getElementById('ztl-content').innerHTML;
  assert(html.includes('High risk'), 'IT shows severity label');
  assert(html.includes('Florence'), 'IT shows city card');
  assert(html.includes('How to avoid fines'), 'IT shows avoid section');
}

section('ztl: non-listed countries show no-zone message');
{
  const win = setup('CZ');
  win.initZtl();
  const html = win.document.getElementById('ztl-content').innerHTML;
  assert(html.includes('No restricted traffic zones'), 'CZ shows no-zone message');
}

done();
