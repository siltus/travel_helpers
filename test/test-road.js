/* ══════════════════════════════════════
   road.js tests — ROAD_DATA + renderRoad + speedBadge + signSvg
   Covers every country plus every signSvg branch.
   ══════════════════════════════════════ */
const { makeWindow, loadScripts, evalIn, counter } = require('./_jsdom-helper.js');
const { assert, section, done } = counter();

function setup(country) {
  const win = makeWindow('<div id="road-content"></div>');
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
  win.renderPharmacy = function() {};
  win.renderTransit = function() {};
  win.renderPayment = function() {};
  win.renderExchangeTables = function() {};
  win.updateQrTabVisibility = function() {};
  loadScripts(win, ['countries.js', 'road.js']);
  if (country) win.localStorage.setItem('travelHelpers_selectedCountry', country);
  return win;
}

section('road: ROAD_DATA covers every country');
{
  const win = setup();
  const COUNTRIES = evalIn(win, 'COUNTRIES');
  const ROAD_DATA = evalIn(win, 'ROAD_DATA');
  Object.keys(COUNTRIES).forEach(code => {
    assert(ROAD_DATA[code], 'ROAD_DATA has ' + code);
    if (ROAD_DATA[code]) {
      assert(ROAD_DATA[code].speed, code + ': speed limits set');
      assert(typeof ROAD_DATA[code].alcohol === 'string', code + ': alcohol string set');
    }
  });
}

section('road: initRoad + renderRoad work for every country');
{
  const COUNTRIES = evalIn(setup(), 'COUNTRIES');
  Object.keys(COUNTRIES).forEach(code => {
    const win = setup(code);
    win.initRoad();
    const html = win.document.getElementById('road-content').innerHTML;
    assert(html.length > 0, code + ': road-content rendered');
    assert(html.includes('Speed Limits'), code + ': speed-limits heading present');
    assert(html.includes('Alcohol Limit'), code + ': alcohol heading present');
  });
}

section('road: signSvg covers every documented sign type');
{
  const win = setup();
  const signSvg = win.signSvg;
  const types = ['speed_limit', 'end_speed', 'prohibition', 'warning', 'info', 'zone', 'stop_jp'];
  types.forEach(t => {
    const svg = signSvg(t, '50');
    assert(svg.includes('<svg'), t + ' produces svg');
  });
  const longInfo = signSvg('info', 'ABC');  // length-based font branch
  assert(longInfo.includes('font-size="22"'), 'info: long value uses small font');
  const longZone = signSvg('zone', '30km');
  assert(longZone.includes('font-size="18"'), 'zone: long value uses small font');
  const unknown = signSvg('made_up_type', 'x');
  assert(unknown === '', 'unknown sign type returns empty');
  // Missing-value fallbacks
  assert(signSvg('speed_limit').includes('?'), 'speed_limit fallback shows "?"');
  assert(signSvg('warning').includes('!'), 'warning fallback shows "!"');
  assert(signSvg('info').includes('i'), 'info fallback shows "i"');
  assert(signSvg('stop_jp').includes('STOP'), 'stop_jp fallback shows STOP');
}

section('road: speedBadge handles both numeric and string limits');
{
  const win = setup();
  const speedBadge = win.speedBadge;
  const numHi = speedBadge('Motorway', 130);
  assert(numHi.includes('<svg'), 'numeric value renders SVG');
  assert(numHi.includes('font-size="30"'), 'numeric >=100 uses smaller font');
  const numLo = speedBadge('Urban', 50);
  assert(numLo.includes('font-size="38"'), 'numeric <100 uses larger font');
  const strVal = speedBadge('Rural', 'varies');
  assert(strVal.includes('speed-value'), 'string value rendered as text not SVG');
}

section('road: missing country gracefully no-ops');
{
  const win = setup('XX');
  win.initRoad();
  assert(win.document.getElementById('road-content').innerHTML === '',
    'road-content untouched for unknown country');
}

done();
