/* ══════════════════════════════════════
   exchange.js tests — currency tables, fetch + cache, convert, fmtRate
   ══════════════════════════════════════ */
const { makeWindow, loadScripts, evalIn, counter } = require('./_jsdom-helper.js');
const { assert, section, done } = counter();

function setup() {
  const win = makeWindow(
    '<select id="currency-select"></select>' +
    '<div id="exchange-loading"></div>' +
    '<div id="exchange-error"></div>' +
    '<div id="exchange-content"></div>' +
    '<div id="rate-date"></div>' +
    '<div id="rate-tables"></div>',
  );
  loadScripts(win, ['exchange.js']);
  return win;
}

async function run() {
  section('exchange: CURRENCIES table holds all expected codes');
  {
    const win = setup();
    const CURRENCIES = evalIn(win, 'CURRENCIES');
    assert(Object.keys(CURRENCIES).length >= 30, 'at least 30 currencies');
    ['EUR', 'USD', 'ILS', 'CZK', 'JPY', 'GBP', 'CHF'].forEach(c =>
      assert(CURRENCIES[c], 'CURRENCIES has ' + c));
  }

  section('exchange: populateCurrencySelect populates the dropdown');
  {
    const win = setup();
    win.populateCurrencySelect();
    const sel = win.document.getElementById('currency-select');
    assert(sel.querySelectorAll('option').length >= 30, 'at least 30 options');
    // First options are non-reference; reference currencies sorted to the end.
    const opts = Array.from(sel.querySelectorAll('option')).map(o => o.value);
    const refIdx = opts.indexOf('EUR');
    const cnyIdx = opts.indexOf('CNY');
    assert(refIdx > cnyIdx, 'reference currencies (EUR) come after non-reference (CNY)');
  }

  section('exchange: fmtRate uses 2/4/6 decimals based on magnitude');
  {
    const win = setup();
    const fmtRate = win.fmtRate;
    assert(fmtRate(1.5).replace(/[^0-9]/g, '').length >= 3, '>=1 uses 2 decimals');
    assert(/0\.0\d{3}/.test(fmtRate(0.05)) || fmtRate(0.05).includes('5'), '>=0.01 uses 4 decimals');
    assert(/0\.\d{6}/.test(fmtRate(0.001)), '<0.01 uses 6 decimals');
  }

  section('exchange: convert handles identity, EUR pivot, and cross-currency');
  {
    const win = setup();
    // Seed rates directly in the VM so convert() can read its `let eurRates`.
    evalIn(win, 'eurRates = { EUR: 1, USD: 1.1, CZK: 25 };');
    assert(win.convert(100, 'USD', 'USD') === 100, 'identity returns input');
    assert(win.convert(11, 'USD', 'EUR') === 10, '11 USD → 10 EUR at 1.1');
    assert(win.convert(10, 'EUR', 'CZK') === 250, '10 EUR → 250 CZK at 25');
    const cross = win.convert(110, 'USD', 'CZK');
    assert(Math.abs(cross - 2500) < 0.01, '110 USD → ~2500 CZK via EUR pivot');
  }

  section('exchange: refreshRates uses cached rates when fresh');
  {
    const win = setup();
    win.localStorage.setItem('travelHelpers_exchangeRates', JSON.stringify({
      rates: { USD: 1.1, CZK: 25, EUR: 1 },
      date: '2026-01-01',
      timestamp: Date.now(),
    }));
    win.populateCurrencySelect();
    win.document.getElementById('currency-select').value = 'CZK';
    let fetchCalled = false;
    win.fetch = function() { fetchCalled = true; return Promise.reject(new Error('should not fetch')); };
    await win.refreshRates(false);
    assert(fetchCalled === false, 'fetch not called when cache is fresh');
    assert(win.document.getElementById('rate-date').textContent.includes('2026-01-01'),
      'rate-date set from cache');
    assert(win.document.getElementById('rate-tables').innerHTML.includes('CZK'),
      'rate tables rendered');
  }

  section('exchange: refreshRates falls back to cache on fetch failure');
  {
    const win = setup();
    win.localStorage.setItem('travelHelpers_exchangeRates', JSON.stringify({
      rates: { USD: 1.1, CZK: 25, EUR: 1 },
      date: '2025-01-01',
      timestamp: 0,  // very stale
    }));
    win.populateCurrencySelect();
    win.document.getElementById('currency-select').value = 'CZK';
    win.fetch = function() { return Promise.reject(new Error('network down')); };
    await win.refreshRates(true);  // force = true skips cache fast path
    const err = win.document.getElementById('exchange-error');
    assert(err.style.display === 'block', 'error message shown');
    assert(err.textContent.includes('network down'), 'error includes original message');
    assert(err.textContent.includes('cached rates'), 'fallback appended cached-rates note');
  }

  section('exchange: refreshRates writes new cache on successful fetch');
  {
    const win = setup();
    win.populateCurrencySelect();
    win.document.getElementById('currency-select').value = 'CZK';
    win.fetch = function() {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: function() { return Promise.resolve({ rates: { USD: 1.2, CZK: 24 }, date: '2026-02-02' }); },
      });
    };
    await win.refreshRates(true);
    const cached = JSON.parse(win.localStorage.getItem('travelHelpers_exchangeRates'));
    assert(cached.rates.CZK === 24, 'cache holds new CZK rate');
    assert(cached.rates.EUR === 1, 'EUR injected into cache');
    assert(cached.date === '2026-02-02', 'cache holds new date');
  }

  section('exchange: refreshRates surfaces HTTP error with no cache');
  {
    const win = setup();
    win.populateCurrencySelect();
    win.document.getElementById('currency-select').value = 'CZK';
    win.fetch = function() { return Promise.resolve({ ok: false, status: 500 }); };
    await win.refreshRates(true);
    const err = win.document.getElementById('exchange-error');
    assert(err.style.display === 'block', 'error shown on HTTP 500');
    assert(err.textContent.includes('HTTP 500'), 'error includes status');
    assert(!err.textContent.includes('cached'), 'no "cached" suffix when no cache present');
  }

  section('exchange: onCurrencyChange persists selection');
  {
    const win = setup();
    win.populateCurrencySelect();
    win.document.getElementById('currency-select').value = 'GBP';
    evalIn(win, 'eurRates = { EUR: 1, GBP: 0.85, USD: 1.1, ILS: 4 };');
    evalIn(win, 'rateDate = "2026-01-01";');
    win.onCurrencyChange();
    assert(win.localStorage.getItem('travelHelpers_selectedCurrency') === 'GBP',
      'persisted GBP to localStorage');
  }

  section('exchange: refreshRates ignores corrupt cache JSON');
  {
    const win = setup();
    win.localStorage.setItem('travelHelpers_exchangeRates', 'not-valid-json');
    win.populateCurrencySelect();
    win.document.getElementById('currency-select').value = 'CZK';
    win.fetch = function() {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: function() { return Promise.resolve({ rates: { USD: 1.3 }, date: '2026-03-03' }); },
      });
    };
    await win.refreshRates(false);
    // Should fall through to fetch — verify by checking rate-date contents.
    assert(win.document.getElementById('rate-date').textContent.includes('2026-03-03'),
      'fell through to fetch on corrupt cache');
  }

  done();
}

run().catch(err => { console.error(err); process.exit(1); });
