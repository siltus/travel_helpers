/* Full-page Azerbaijan path: load the real screen markup and visit every route. */
const fs = require('fs');
const path = require('path');
const { makeWindow, loadScripts, counter } = require('./_jsdom-helper.js');
const { assert, section, done } = counter();

function waitForAsyncWork() {
  return new Promise(resolve => setImmediate(resolve));
}

async function main() {
  const index = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  const body = index.match(/<body>([\s\S]*)<\/body>/i)[1];
  const win = makeWindow(body, { url: 'http://localhost:3000/' });

  win.fetch = function(url) {
    if (url === '/api/embassy/AZ') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          name: 'Embassy test fixture',
          city: 'Baku',
          phones: [{ label: 'Main', number: '+994000000000' }],
          emails: [],
        }),
      });
    }
    if (url === 'https://open.er-api.com/v6/latest/EUR') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          result: 'success',
          rates: { AZN: 1.97 },
        }),
      });
    }
    return Promise.reject(new Error('Unexpected fetch: ' + url));
  };

  win.localStorage.setItem('travelHelpers_exchangeRates', JSON.stringify({
    rates: { EUR: 1, USD: 1.1, ILS: 3.9, CZK: 25 },
    date: '2026-09-12',
    timestamp: Date.now(),
  }));
  win.localStorage.setItem('travelHelpers_selectedCountry', 'AZ');

  loadScripts(win, [
    'qr-parsers.js',
    'url-safety.js',
    'spayd.js',
    'exchange.js',
    'countries.js',
    'tip.js',
    'emergency.js',
    'road.js',
    'pharmacy.js',
    'transit.js',
    'payment.js',
    'rental.js',
    'ztl.js',
    'meals.js',
    'app.js',
  ]);

  section('Azerbaijan: global country selection and exchange currency');
  win.populateGlobalCountrySelect();
  const countrySelect = win.document.getElementById('global-country-select');
  assert(countrySelect.value === 'AZ', 'Azerbaijan selected in global country selector');
  assert(countrySelect.querySelector('option[value="AZ"]').textContent.includes('Azerbaijan'),
    'Azerbaijan option is visible');
  assert(!win.document.body.textContent.includes('Bakı'), 'local Bakı spelling is absent');

  win.switchPage('exchange');
  await waitForAsyncWork();
  assert(win.document.getElementById('currency-select').value === 'AZN',
    'exchange currency follows Azerbaijan as AZN');
  assert(win.document.getElementById('rate-tables').textContent.includes('AZN'),
    'exchange tables render AZN');

  section('Azerbaijan: every navigation screen renders');
  const screens = [
    ['tip', 'tip-results', 'AZN'],
    ['emergency', 'sos-content', '112'],
    ['road', 'road-content', 'Speed Limits'],
    ['pharmacy', 'pharmacy-content', 'Aptek'],
    ['transit', 'transit-content', 'BakuCard'],
    ['payment', 'payment-content', 'Azerbaijani Manat'],
    ['rental', 'rental-content', 'Fuel labels'],
    ['ztl', 'ztl-content', 'No restricted traffic zones in Azerbaijan'],
    ['meals', 'meals-content', 'Usual meal times'],
  ];

  for (const [screen, contentId, marker] of screens) {
    win.switchPage(screen);
    await waitForAsyncWork();
    const page = win.document.getElementById('page-' + screen);
    const content = win.document.getElementById(contentId);
    assert(page.classList.contains('active'), screen + ' screen activates');
    assert(content.textContent.includes(marker), screen + ' renders Azerbaijan content');
  }

  section('Azerbaijan: QR path is correctly unavailable');
  win.localStorage.setItem('travelHelpers_activePage', 'qr');
  win.updateQrTabVisibility();
  assert(win.document.getElementById('nav-qr').style.display === 'none',
    'QR navigation is hidden for Azerbaijan');
  assert(win.localStorage.getItem('travelHelpers_activePage') === 'exchange',
    'QR selection redirects to exchange for Azerbaijan');

  section('Azerbaijan: country change re-renders initialized screens');
  win.switchPage('tip');
  win.document.getElementById('global-country-select').value = 'AZ';
  win.onGlobalCountryChange();
  await waitForAsyncWork();
  assert(win.document.getElementById('tip-currency').textContent === 'AZN',
    'country change keeps tip currency at AZN');
  assert(win.document.body.textContent.includes('Baku'), 'English Baku spelling is rendered');

  done();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
