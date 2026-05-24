/* ══════════════════════════════════════
   meals.js tests — MEALS_DATA + renderMeals
   ══════════════════════════════════════ */
const { makeWindow, loadScripts, evalIn, counter } = require('./_jsdom-helper.js');
const { assert, section, done } = counter();

function setup(country) {
  const win = makeWindow('<div id="meals-content"></div>');
  win.eurRates = null;
  win.rateDate = null;
  win.exchangeInitialized = false;
  win.tipInitialized = false;
  win.sosInitialized = false;
  win.roadInitialized = false;
  win.pharmacyInitialized = false;
  win.transitInitialized = false;
  win.paymentInitialized = false;
  win.mealsInitialized = false;
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
  loadScripts(win, ['countries.js', 'meals.js']);
  if (country) win.localStorage.setItem('travelHelpers_selectedCountry', country);
  return win;
}

section('meals: MEALS_DATA covers every country');
{
  const win = setup();
  const COUNTRIES = evalIn(win, 'COUNTRIES');
  const MEALS_DATA = evalIn(win, 'MEALS_DATA');
  Object.keys(COUNTRIES).forEach(code => {
    assert(MEALS_DATA[code], 'MEALS_DATA has ' + code);
    if (MEALS_DATA[code]) {
      assert(MEALS_DATA[code].lunch && MEALS_DATA[code].dinner, code + ': meal windows');
      assert(Array.isArray(MEALS_DATA[code].tips), code + ': tips array');
    }
  });
}

section('meals: initMeals + renderMeals work for every country');
{
  const COUNTRIES = evalIn(setup(), 'COUNTRIES');
  Object.keys(COUNTRIES).forEach(code => {
    const win = setup(code);
    win.initMeals();
    const html = win.document.getElementById('meals-content').innerHTML;
    assert(html.length > 0, code + ': meals-content rendered');
    assert(html.includes('Usual meal times'), code + ': meal time section rendered');
    assert(html.includes('Dining tips'), code + ': tips section rendered');
  });
}

section('meals: Italy renders the requested customs');
{
  const win = setup('IT');
  win.initMeals();
  const html = win.document.getElementById('meals-content').innerHTML;
  assert(html.includes('coperto'), 'IT mentions coperto');
  assert(html.includes('Il conto, per favore'), 'IT includes bill phrase');
}

section('meals: missing country gracefully empties content');
{
  const win = setup('XX');
  win.initMeals();
  assert(win.document.getElementById('meals-content').innerHTML === '',
    'meals-content empty for unknown country');
}

done();
