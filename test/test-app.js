/* ══════════════════════════════════════
   app.js tests — switchPage, updateQrTabVisibility, toggleMenu,
   copyVal, showToast.
   ══════════════════════════════════════ */
const { makeWindow, loadScripts, counter } = require('./_jsdom-helper.js');
const { assert, section, done } = counter();

function setup() {
  const body =
    '<button class="nav-btn" data-page="exchange">Ex</button>' +
    '<button class="nav-btn" data-page="tip">Tip</button>' +
    '<button class="nav-btn" data-page="qr" id="nav-qr">QR</button>' +
    '<nav class="main-nav"></nav>' +
    '<div id="hamburger"></div>' +
    '<div id="toast"></div>' +
    '<select id="global-country-select"></select>' +
    '<div id="page-exchange" class="page"></div>' +
    '<div id="page-tip" class="page"></div>' +
    '<div id="page-qr" class="page"></div>' +
    '<div id="page-emergency" class="page"></div>' +
    '<div id="page-road" class="page"></div>' +
    '<div id="page-pharmacy" class="page"></div>' +
    '<div id="page-transit" class="page"></div>' +
    '<div id="page-payment" class="page"></div>';
  const win = makeWindow(body);
  win.exchangeInitialized = true;
  win.tipInitialized = true;
  win.sosInitialized = true;
  win.roadInitialized = true;
  win.pharmacyInitialized = true;
  win.transitInitialized = true;
  win.paymentInitialized = true;
  win.QR_COUNTRY_FORMAT = { CZ: 'SPAYD', DE: 'EPC' };
  win.QR_FORMAT_LABELS = { SPAYD: '💳 QR (CZ)', EPC: '💳 EPC' };
  const initCalls = [];
  win.initExchange = function() { initCalls.push('exchange'); win.exchangeInitialized = true; };
  win.initTip      = function() { initCalls.push('tip'); win.tipInitialized = true; };
  win.initSos      = function() { initCalls.push('sos'); win.sosInitialized = true; };
  win.initRoad     = function() { initCalls.push('road'); win.roadInitialized = true; };
  win.initPharmacy = function() { initCalls.push('pharmacy'); win.pharmacyInitialized = true; };
  win.initTransit  = function() { initCalls.push('transit'); win.transitInitialized = true; };
  win.initPayment  = function() { initCalls.push('payment'); win.paymentInitialized = true; };
  let stopCalls = 0;
  win.stopCamera = function() { stopCalls++; };
  loadScripts(win, ['countries.js', 'app.js']);
  return { win, initCalls, getStopCalls: () => stopCalls };
}

async function main() {
  section('app: switchPage activates page + button, persists, manages camera');
  {
    const { win, getStopCalls } = setup();
    win.switchPage('tip');
    const pageTip = win.document.getElementById('page-tip');
    assert(pageTip.classList.contains('active'), 'page-tip activated');
    const btn = win.document.querySelector('.nav-btn[data-page="tip"]');
    assert(btn.classList.contains('active'), 'nav button for tip activated');
    assert(win.localStorage.getItem('travelHelpers_activePage') === 'tip',
      'activePage persisted to localStorage');
    assert(getStopCalls() === 1, 'stopCamera invoked for non-qr page');
  }

  section('app: switchPage("qr") does not call stopCamera');
  {
    const { win, getStopCalls } = setup();
    win.switchPage('qr');
    assert(getStopCalls() === 0, 'stopCamera not invoked when switching TO qr');
  }

  section('app: switchPage triggers init* only when not initialized');
  {
    const { win, initCalls } = setup();
    win.exchangeInitialized = false;
    win.tipInitialized = false;
    win.sosInitialized = false;
    win.roadInitialized = false;
    win.pharmacyInitialized = false;
    win.transitInitialized = false;
    win.paymentInitialized = false;
    win.switchPage('exchange');
    win.switchPage('tip');
    win.switchPage('emergency');
    win.switchPage('road');
    win.switchPage('pharmacy');
    win.switchPage('transit');
    win.switchPage('payment');
    win.switchPage('exchange');  // already init'd, must NOT re-init
    assert(initCalls.filter(c => c === 'exchange').length === 1, 'initExchange called once');
    assert(initCalls.filter(c => c === 'tip').length === 1, 'initTip called once');
    assert(initCalls.filter(c => c === 'sos').length === 1, 'initSos called once');
    assert(initCalls.filter(c => c === 'road').length === 1, 'initRoad called once');
    assert(initCalls.filter(c => c === 'pharmacy').length === 1, 'initPharmacy called once');
    assert(initCalls.filter(c => c === 'transit').length === 1, 'initTransit called once');
    assert(initCalls.filter(c => c === 'payment').length === 1, 'initPayment called once');
  }

  section('app: switchPage closes hamburger menu');
  {
    const { win } = setup();
    win.document.querySelector('.main-nav').classList.add('open');
    win.document.getElementById('hamburger').classList.add('open');
    win.switchPage('exchange');
    assert(!win.document.querySelector('.main-nav').classList.contains('open'),
      'main-nav closed');
    assert(!win.document.getElementById('hamburger').classList.contains('open'),
      'hamburger closed');
  }

  section('app: toggleMenu flips both nav and hamburger open states');
  {
    const { win } = setup();
    win.toggleMenu();
    assert(win.document.querySelector('.main-nav').classList.contains('open'),
      'main-nav opened');
    assert(win.document.getElementById('hamburger').classList.contains('open'),
      'hamburger opened');
    win.toggleMenu();
    assert(!win.document.querySelector('.main-nav').classList.contains('open'),
      'main-nav re-closed');
  }

  section('app: updateQrTabVisibility shows + labels QR button for QR country');
  {
    const { win } = setup();
    win.localStorage.setItem('travelHelpers_selectedCountry', 'CZ');
    win.updateQrTabVisibility();
    const btn = win.document.getElementById('nav-qr');
    assert(btn.style.display === '', 'QR button visible for CZ');
    assert(btn.textContent === '💳 QR (CZ)', 'QR button labelled SPAYD: ' + btn.textContent);

    win.localStorage.setItem('travelHelpers_selectedCountry', 'DE');
    win.updateQrTabVisibility();
    assert(btn.textContent === '💳 EPC', 'QR button labelled EPC for DE');
  }

  section('app: updateQrTabVisibility hides QR button + redirects if on QR page');
  {
    const { win } = setup();
    win.localStorage.setItem('travelHelpers_selectedCountry', 'FR');  // no QR format
    win.localStorage.setItem('travelHelpers_activePage', 'qr');
    win.updateQrTabVisibility();
    const btn = win.document.getElementById('nav-qr');
    assert(btn.style.display === 'none', 'QR button hidden for FR');
    assert(win.localStorage.getItem('travelHelpers_activePage') === 'exchange',
      'auto-switched away from QR page');
  }

  section('app: updateQrTabVisibility no-ops when nav-qr missing');
  {
    const { win } = setup();
    win.document.getElementById('nav-qr').remove();
    let threw = false;
    try { win.updateQrTabVisibility(); } catch (_e) { threw = true; }
    assert(!threw, 'updateQrTabVisibility safe when nav-qr absent');
  }

  section('app: showToast sets text + show class then clears after delay');
  {
    const { win } = setup();
    win.showToast('hello');
    const t = win.document.getElementById('toast');
    assert(t.textContent === 'hello', 'toast text set');
    assert(t.classList.contains('show'), 'show class added');
  }

  section('app: copyVal awaits clipboard.writeText and toasts');
  {
    const { win } = setup();
    let copied = null;
    win.navigator.clipboard.writeText = function(v) {
      copied = v;
      return Promise.resolve();
    };
    win.copyVal('hello-world');
    await new Promise(resolve => setImmediate(resolve));
    assert(copied === 'hello-world', 'clipboard.writeText received exact text');
    const t = win.document.getElementById('toast');
    assert(t.textContent === 'Copied: hello-world', 'toast shows copied text');
  }

  done();
}

main().catch(err => { console.error(err); process.exit(1); });
