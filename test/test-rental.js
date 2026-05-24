/* ══════════════════════════════════════
   rental.js tests — RENTAL_DATA + renderRental
   ══════════════════════════════════════ */
const { makeWindow, loadScripts, evalIn, counter } = require('./_jsdom-helper.js');
const { assert, section, done } = counter();

function setup(country) {
  const win = makeWindow('<div id="rental-content"></div>');
  win.eurRates = null;
  win.rateDate = null;
  win.exchangeInitialized = false;
  win.tipInitialized = false;
  win.sosInitialized = false;
  win.roadInitialized = false;
  win.pharmacyInitialized = false;
  win.transitInitialized = false;
  win.paymentInitialized = false;
  win.rentalInitialized = false;
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
  loadScripts(win, ['countries.js', 'rental.js']);
  if (country) win.localStorage.setItem('travelHelpers_selectedCountry', country);
  return win;
}

section('rental: RENTAL_DATA covers every country');
{
  const win = setup();
  const COUNTRIES = evalIn(win, 'COUNTRIES');
  const RENTAL_DATA = evalIn(win, 'RENTAL_DATA');
  Object.keys(COUNTRIES).forEach(code => {
    assert(RENTAL_DATA[code], 'RENTAL_DATA has ' + code);
    if (RENTAL_DATA[code]) {
      assert(Array.isArray(RENTAL_DATA[code].pickup), code + ': pickup checklist');
      assert(Array.isArray(RENTAL_DATA[code].tips), code + ': tips list');
      assert(RENTAL_DATA[code].fuelLabels && typeof RENTAL_DATA[code].fuelLabels.diesel === 'string', code + ': diesel label');
    }
  });
}

section('rental: initRental + renderRental work for every country');
{
  const COUNTRIES = evalIn(setup(), 'COUNTRIES');
  Object.keys(COUNTRIES).forEach(code => {
    const win = setup(code);
    win.initRental();
    const html = win.document.getElementById('rental-content').innerHTML;
    assert(html.length > 0, code + ': rental-content rendered');
    assert(html.includes('Pickup checklist'), code + ': checklist rendered');
    assert(html.includes('Fuel labels'), code + ': fuel table rendered');
  });
}

section('rental: left-driving countries show warning banner');
{
  const win = setup('GB');
  win.initRental();
  const html = win.document.getElementById('rental-content').innerHTML;
  assert(html.includes('LEFT SIDE DRIVING'), 'GB shows left-driving warning');
}

section('rental: missing country gracefully empties content');
{
  const win = setup('XX');
  win.initRental();
  assert(win.document.getElementById('rental-content').innerHTML === '',
    'rental-content empty for unknown country');
}

done();
