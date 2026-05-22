/* ══════════════════════════════════════
   SPAYD Renderer XSS Tests
   Regression coverage for the QR result renderer in public/spayd.js.
   Verifies that QR-controlled values containing ", ', backslashes, and
   HTML tags cannot escape into executable attributes or markup, and that
   the click-to-copy handler still receives the unmodified raw value.
   ══════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

let passed = 0;
let failed = 0;
const failures = [];

function assert(cond, msg) {
  if (cond) passed++;
  else { failed++; failures.push(msg); console.error('  FAIL: ' + msg); }
}
function section(n) { console.log('\n── ' + n + ' ──'); }

function makeEnv() {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><body>' +
    '<input id="input"><div id="spayd-error"></div>' +
    '<div id="result"></div><div id="fields"></div>' +
    '<span id="version-badge"></span>' +
    '</body></html>',
    { url: 'http://localhost/', runScripts: 'outside-only' },
  );
  const win = dom.window;
  const copyCalls = [];
  win.copyVal = function(v) { copyCalls.push(v); };
  win.showToast = function() {};
  // jsdom Element#scrollIntoView is missing; stub it.
  win.Element.prototype.scrollIntoView = function() {};
  // Load the scripts via vm.runInContext with the real on-disk filename.
  // That way V8 / NODE_V8_COVERAGE attributes coverage to the real source
  // file, so c8 actually instruments these modules (textContent script
  // injection produced anonymous scripts that c8 could not see).
  const ctx = dom.getInternalVMContext();
  const qrPath = path.resolve(__dirname, '..', 'public', 'qr-parsers.js');
  const spaydPath = path.resolve(__dirname, '..', 'public', 'spayd.js');
  vm.runInContext(fs.readFileSync(qrPath, 'utf8'), ctx, { filename: qrPath });
  vm.runInContext(fs.readFileSync(spaydPath, 'utf8'), ctx, { filename: spaydPath });
  return { win, copyCalls };
}

section('SPAYD: parseAndShow handles malicious QR fields without XSS');
{
  const { win, copyCalls: _copyCalls } = makeEnv();
  const mal = 'RN:"><img src=x onerror=alert(1)>\\\' --';
  const qr = 'SPD*1.0*ACC:CZ1120100000002101727312*AM:100.00*CC:CZK*' + mal + '*MSG:hi';
  win.parseAndShow(qr);
  const fields = win.document.getElementById('fields');
  const html = fields.innerHTML;
  assert(!/onclick=/i.test(html), 'no inline onclick attributes in rendered output');
  assert(!/<img[^>]+onerror/i.test(html), 'no <img> element materialised from injection');
  assert(fields.querySelector('img') === null, 'no <img> element materialised at all');
  assert(!html.includes('<script>'), 'no script tags present');
  // No element actually carries an onerror attribute (text characters don't count).
  const hasOnerrorAttr = Array.from(fields.querySelectorAll('*'))
    .some(el => el.hasAttribute && el.hasAttribute('onerror'));
  assert(!hasOnerrorAttr, 'no element has an onerror attribute');
  // The recipient name field exists and shows the literal text safely.
  const recipientField = Array.from(fields.querySelectorAll('.field-label'))
    .find(el => el.textContent === 'Recipient');
  assert(recipientField != null, 'recipient field present');
  const recipientValue = recipientField.nextSibling;
  assert(recipientValue.textContent.includes('"><img src=x onerror=alert(1)>'), 'recipient text preserved verbatim');
}

section('SPAYD: clicking a field copies the raw value (no escaping mutation)');
{
  const { win, copyCalls } = makeEnv();
  const tricky = 'O\'Brien "Pay" \\backslash';
  const qr = 'SPD*1.0*ACC:CZ1120100000002101727312*AM:50*CC:CZK*MSG:' + encodeURIComponent(tricky);
  win.parseAndShow(qr);
  // Click the Message field
  const fields = win.document.getElementById('fields');
  const msgLabel = Array.from(fields.querySelectorAll('.field-label'))
    .find(el => el.textContent === 'Message');
  assert(msgLabel != null, 'message field present');
  const fieldDiv = msgLabel.parentElement;
  fieldDiv.dispatchEvent(new win.Event('click', { bubbles: true }));
  assert(copyCalls.length === 1, 'one copyVal call');
  assert(copyCalls[0] === tricky, 'raw value copied unmodified: got ' + JSON.stringify(copyCalls[0]));
}

section('SPAYD: amount field uses safe DOM (no onclick attribute)');
{
  const { win, copyCalls } = makeEnv();
  const qr = 'SPD*1.0*ACC:CZ1120100000002101727312*AM:1234.56*CC:CZK';
  win.parseAndShow(qr);
  const amountField = win.document.querySelector('.amount-row');
  assert(amountField != null, 'amount-row element present');
  assert(!amountField.getAttribute('onclick'), 'no onclick attribute on amount row');
  amountField.dispatchEvent(new win.Event('click', { bubbles: true }));
  assert(copyCalls.length === 1, 'amount copyVal called once');
  assert(copyCalls[0] === '1234.56 CZK', 'amount copy value: got ' + copyCalls[0]);
}

section('SPAYD: malicious currency code cannot break out');
{
  const { win, copyCalls } = makeEnv();
  // CC is normally a 3-letter ISO; but the parser does not enforce that,
  // so attackers can put arbitrary text. The renderer must not let it
  // escape into an attribute.
  const qr = 'SPD*1.0*ACC:CZ1120100000002101727312*AM:10*CC:' + encodeURIComponent('A"\'><b');
  win.parseAndShow(qr);
  const fields = win.document.getElementById('fields');
  const html = fields.innerHTML;
  assert(!html.includes('<b>'), 'no <b> tag materialised from CC');
  assert(!/onclick="/i.test(html), 'no onclick attribute injected via CC');
  const amountField = win.document.querySelector('.amount-row');
  amountField.dispatchEvent(new win.Event('click', { bubbles: true }));
  assert(copyCalls.length === 1, 'amount copy called');
  assert(copyCalls[0].includes('A"\'><b'), 'raw currency preserved in copy');
}

section('SPAYD: warnings render as text only');
{
  const { win } = makeEnv();
  // Bad-checksum IBAN triggers a warning. Use a recipient-name with HTML
  // to verify warnings + injected fields both stay safe.
  const qr = 'SPD*1.0*ACC:CZ0000000000000000000000*RN:' + encodeURIComponent('<script>alert(1)</script>');
  win.parseAndShow(qr);
  const fields = win.document.getElementById('fields');
  const html = fields.innerHTML;
  assert(!/<script>/i.test(html), 'no script tag rendered');
  // Warning label text uses ⚠ and class field-label with error style.
  const warnings = Array.from(fields.querySelectorAll('.field-label'))
    .filter(el => el.textContent === '⚠');
  assert(warnings.length > 0, 'at least one warning rendered');
}

section('SPAYD: IBAN renders as grouped spans (no innerHTML injection)');
{
  const { win } = makeEnv();
  const qr = 'SPD*1.0*ACC:CZ1120100000002101727312*AM:10*CC:CZK';
  win.parseAndShow(qr);
  const fields = win.document.getElementById('fields');
  const ibanLabel = Array.from(fields.querySelectorAll('.field-label'))
    .find(el => el.textContent === 'IBAN');
  assert(ibanLabel != null, 'IBAN label present');
  const ibanValue = ibanLabel.nextSibling;
  const groups = ibanValue.querySelectorAll('.iban-group');
  assert(groups.length >= 5, 'IBAN split into multiple groups');
  const joined = Array.from(groups).map(g => g.textContent).join('');
  assert(joined === 'CZ1120100000002101727312', 'IBAN groups join back to original: ' + joined);
}

/* ── Additional coverage for non-render helpers in spayd.js ────────────
   The reviewer flagged that public/spayd.js was not actually being
   instrumented by c8 because the previous test injected the file via
   <script>el.textContent = src</script>, which V8 reports as an
   anonymous script. Switching to vm.runInContext fixes attribution but
   exposed several entry points (text tab, error helpers, clearAll,
   copyAll, switchSpaydTab, startCamera fail-path) that had no test
   coverage. These tests close that gap. */

function makeFullEnv() {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><body>' +
    '<div id="page-qr" class="page active">' +
    '  <div class="tabs">' +
    '    <button class="tab active">QR</button>' +
    '    <button class="tab">Camera</button>' +
    '    <button class="tab">Text</button>' +
    '  </div>' +
    '  <div id="panel-qr" class="tab-panel active"><input id="fileInput" type="file"></div>' +
    '  <div id="panel-camera" class="tab-panel">' +
    '    <video id="camera-video"></video>' +
    '    <canvas id="camera-canvas"></canvas>' +
    '    <div id="camera-wrap" style="display:none"></div>' +
    '    <div id="camera-status"></div>' +
    '    <button id="btn-camera-start">Start</button>' +
    '    <button id="btn-camera-stop" style="display:none">Stop</button>' +
    '  </div>' +
    '  <div id="panel-text" class="tab-panel"></div>' +
    '</div>' +
    '<input id="input"><div id="spayd-error" style="display:none"></div>' +
    '<div id="result" style="display:none"></div><div id="fields"></div>' +
    '<span id="version-badge"></span>' +
    '<img id="qr-preview" style="display:none">' +
    '<div id="dropzone"></div>' +
    '</body></html>',
    { url: 'http://localhost/', runScripts: 'outside-only' },
  );
  const win = dom.window;
  const copyCalls = [];
  const toastCalls = [];
  win.copyVal = function(v) { copyCalls.push(v); };
  win.showToast = function(m) { toastCalls.push(m); };
  win.Element.prototype.scrollIntoView = function() {};
  // Stub camera + jsQR + clipboard so startCamera() takes its error
  // branch deterministically.
  win.navigator.mediaDevices = {
    getUserMedia: function() { return Promise.reject(new Error('no camera in jsdom')); },
  };
  win.navigator.clipboard = {
    writeText: function() { return Promise.resolve(); },
  };
  win.jsQR = function() { return null; };
  const ctx = dom.getInternalVMContext();
  const qrPath = path.resolve(__dirname, '..', 'public', 'qr-parsers.js');
  const spaydPath = path.resolve(__dirname, '..', 'public', 'spayd.js');
  vm.runInContext(fs.readFileSync(qrPath, 'utf8'), ctx, { filename: qrPath });
  vm.runInContext(fs.readFileSync(spaydPath, 'utf8'), ctx, { filename: spaydPath });
  return { win, copyCalls, toastCalls };
}

function syncSection(name, body) {
  section(name);
  body();
}

async function asyncSection(name, body) {
  section(name);
  await body();
}

async function main() {
  syncSection('SPAYD: switchSpaydTab switches active panel and stops camera', () => {
    const { win } = makeFullEnv();
    win.switchSpaydTab('text');
    assert(win.document.getElementById('panel-text').classList.contains('active'), 'text panel active');
    win.switchSpaydTab('qr');
    assert(win.document.getElementById('panel-qr').classList.contains('active'), 'qr panel active after switch back');
  });

  syncSection('SPAYD: parseText with empty input shows an error', () => {
    const { win } = makeFullEnv();
    win.document.getElementById('input').value = '   ';
    win.parseText();
    const err = win.document.getElementById('spayd-error');
    assert(err.style.display === 'block', 'error element visible');
    assert(/Please enter/.test(err.textContent), 'error message about empty input: ' + err.textContent);
  });

  syncSection('SPAYD: parseText with valid input parses and shows result card', () => {
    const { win } = makeFullEnv();
    win.document.getElementById('input').value = 'SPD*1.0*ACC:CZ1120100000002101727312*AM:10*CC:CZK';
    win.parseText();
    assert(win.document.getElementById('result').style.display === 'block', 'result card visible');
    const fields = win.document.getElementById('fields');
    assert(fields.children.length > 0, 'fields populated: ' + fields.children.length);
  });

  syncSection('SPAYD: loadExample populates input and parses', () => {
    const { win } = makeFullEnv();
    win.loadExample();
    const input = win.document.getElementById('input');
    assert(input.value.startsWith('SPD*1.0'), 'input populated with example: ' + input.value.substring(0, 20));
    assert(win.document.getElementById('result').style.display === 'block', 'result card visible after example');
  });

  syncSection('SPAYD: clearAll resets input + result visibility', () => {
    const { win } = makeFullEnv();
    win.loadExample();
    win.clearAll();
    assert(win.document.getElementById('input').value === '', 'input cleared');
    assert(win.document.getElementById('result').style.display === 'none', 'result hidden');
    assert(win.document.getElementById('spayd-error').style.display === 'none', 'error hidden');
    assert(win.document.getElementById('qr-preview').style.display === 'none', 'preview hidden');
  });

  await asyncSection('SPAYD: copyAll concatenates fields and calls clipboard', async () => {
    const { win } = makeFullEnv();
    let writtenText = null;
    win.navigator.clipboard.writeText = function(text) {
      writtenText = text;
      return Promise.resolve();
    };
    win.loadExample();
    win.copyAll();
    await new Promise(resolve => setImmediate(resolve));
    assert(writtenText !== null, 'clipboard.writeText called');
    assert(/IBAN: /.test(writtenText || ''), 'output includes IBAN line: ' + (writtenText || '').substring(0, 80));
  });

  await asyncSection('SPAYD: startCamera falls back to error message when getUserMedia rejects', async () => {
    const { win } = makeFullEnv();
    win.startCamera();
    // Resolve microtasks twice so the promise rejection chain settles.
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    const status = win.document.getElementById('camera-status');
    assert(/Camera error/.test(status.textContent), 'camera-status reports error: ' + status.textContent);
    const stop = win.document.getElementById('btn-camera-stop');
    assert(stop.style.display === 'none', 'stop button hidden after failure');
  });

  syncSection('SPAYD: showSpaydError + parseAndShow show error for malformed input', () => {
    const { win } = makeFullEnv();
    // Pass a non-SPAYD / non-EPC / non-SwissQR payload through parseAndShow.
    win.parseAndShow('NOT-A-VALID-QR');
    const err = win.document.getElementById('spayd-error');
    assert(err.style.display === 'block', 'error visible for unknown format');
    assert(err.textContent.trim().length > 1, 'error message populated: ' + err.textContent);
  });

  syncSection('SPAYD: EPC payload renders amount + currency + purpose fields', () => {
    const { win } = makeFullEnv();
    const epc = 'BCD\n002\n1\nSCT\nBPHKDEFF\nMax Mustermann\nDE89370400440532013000\nEUR123.45\nCHAR\nRef-1\nInvoice 7\nThanks';
    win.parseAndShow(epc);
    const fields = win.document.getElementById('fields');
    const labels = Array.from(fields.querySelectorAll('.field-label')).map(el => el.textContent);
    assert(labels.includes('IBAN'), 'IBAN label rendered');
    assert(labels.includes('Amount'), 'Amount label rendered');
    assert(labels.includes('Recipient'), 'Recipient label rendered');
  });

  syncSection('SPAYD: Swiss QR address structured-block renders Swiss creditor address', () => {
    const { win } = makeFullEnv();
    const swiss = [
      'SPC', '0200', '1',
      'CH4431999123000889012',
      'S', 'Robert Schneider AG', 'Rue du Lac', '1268', '2501', 'Biel', 'CH',
      '', '', '', '', '', '', '',
      '1949.75', 'CHF',
      'S', 'Pia Rutschmann', 'Marktgasse', '28', '9400', 'Rorschach', 'CH',
      'NON', '', '',
      'EPD',
    ].join('\r\n');
    win.parseAndShow(swiss);
    const fields = win.document.getElementById('fields');
    const labels = Array.from(fields.querySelectorAll('.field-label')).map(el => el.textContent);
    assert(labels.includes('Address'), 'Swiss address rendered: labels=' + labels.join(','));
  });
}

main().then(() => {
  console.log('\n══════════════════════════════════');
  console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(f => console.log('  ✗ ' + f));
  }
  console.log('══════════════════════════════════');
  process.exit(failed > 0 ? 1 : 0);
}).catch(e => { console.error(e); process.exit(1); });
