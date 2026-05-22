/* ══════════════════════════════════════
   Emergency / Embassy Renderer Tests
   Regression coverage for public/emergency.js — verifies that scraped
   embassy data (untrusted) cannot inject markup or javascript: URLs, and
   that a slow-arriving response for a previously-selected country does
   NOT overwrite the current screen (race-safety token).
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

function makeEnv(opts) {
  opts = opts || {};
  const dom = new JSDOM(
    '<!DOCTYPE html><html><body><div id="sos-content"></div></body></html>',
    { url: 'http://localhost/', runScripts: 'outside-only' },
  );
  const win = dom.window;
  win.copyVal = function() {};
  win.COUNTRIES = { CZ: { name: 'Czech Republic', currency: 'CZK' }, DE: { name: 'Germany', currency: 'EUR' } };
  win.EMERGENCY_DATA = {
    CZ: { general: '112', police: '158', ambulance: '155', fire: '150', notes: ['note one'] },
    DE: { general: '112', police: '110', ambulance: '112', fire: '112', notes: ['note de'] },
  };
  win._selected = opts.country || 'CZ';
  win.getSelectedCountry = function() { return win._selected; };
  win.setSelectedCountryForTest = function(c) { win._selected = c; };
  win._pendingFetches = {};
  win.fetch = function(url) {
    const m = url.match(/\/api\/embassy\/([A-Z]+)/);
    const code = m ? m[1] : 'XX';
    return new Promise((resolve, reject) => {
      win._pendingFetches[code] = { resolve, reject };
    });
  };
  // Use vm.runInContext with the real on-disk filename so c8 attributes
  // coverage to public/url-safety.js + public/emergency.js (textContent
  // <script> injection produced anonymous scripts that c8 could not
  // instrument).
  const ctx = dom.getInternalVMContext();
  const urlSafetyPath = path.resolve(__dirname, '..', 'public', 'url-safety.js');
  const emergencyPath = path.resolve(__dirname, '..', 'public', 'emergency.js');
  vm.runInContext(fs.readFileSync(urlSafetyPath, 'utf8'), ctx, { filename: urlSafetyPath });
  vm.runInContext(fs.readFileSync(emergencyPath, 'utf8'), ctx, { filename: emergencyPath });
  return win;
}

function resolveFetch(win, code, value) {
  const p = win._pendingFetches[code];
  if (!p) throw new Error('no pending fetch for ' + code);
  const resp = { ok: true, status: 200, json: () => Promise.resolve(value) };
  p.resolve(resp);
  delete win._pendingFetches[code];
}

function flush() {
  return new Promise(resolve => setImmediate(() => setImmediate(() => setImmediate(resolve))));
}

async function testMaliciousScrape() {
  section('Emergency: scraped HTML / script payload is rendered as text only');
  const win = makeEnv();
  const malicious = {
    name: '<script>alert("xss")</script> Embassy',
    city: 'Prague',
    address: '<img src=x onerror=alert(1)> Some Street',
    phones: [
      { label: '<b>Main</b>', number: '+420123456789' },
      { label: 'Bad', number: 'javascript:alert(1)' },
    ],
    emails: [
      { label: '<script>x</script>', address: 'consul@example.com' },
      { label: 'Bad', address: 'not-an-email' },
    ],
    hours: '<i>9-5</i>',
    url: 'javascript:alert(1)',
    contacts: 'https://embassies.gov.il/cz/contacts',
    mapsUrl: 'data:text/html,<script>',
  };
  const renderPromise = win.renderSos();
  await flush();
  resolveFetch(win, 'CZ', malicious);
  await renderPromise;
  await flush();

  const doc = win.document;
  const embData = doc.getElementById('embassy-data');
  assert(embData != null, 'embassy-data container present');
  const html = embData.innerHTML;
  assert(!/<script>/i.test(html), 'no script tags rendered');
  assert(!/<img[^>]+onerror/i.test(html), 'no img/onerror element');
  assert(embData.querySelector('img') === null, 'no <img> element materialised at all');
  const hasOnerrorAttr = Array.from(embData.querySelectorAll('*'))
    .some(el => el.hasAttribute && el.hasAttribute('onerror'));
  assert(!hasOnerrorAttr, 'no element has an onerror attribute');

  const links = doc.querySelectorAll('#embassy-data a');
  Array.from(links).forEach(a => {
    const href = a.getAttribute('href');
    assert(/^(tel:|mailto:|https?:)/.test(href), 'every href is tel/mailto/http(s): ' + href);
    assert(!/^javascript:/i.test(href), 'no javascript: href: ' + href);
    assert(!/^data:/i.test(href), 'no data: href: ' + href);
  });

  const websiteLink = Array.from(links).find(a => a.textContent.includes('Website'));
  assert(websiteLink == null, 'invalid javascript: website URL was not rendered');
  const contactsLink = Array.from(links).find(a => a.textContent.includes('Contacts'));
  assert(contactsLink != null, 'safe https contacts URL was rendered');
  assert(contactsLink && contactsLink.getAttribute('href') === 'https://embassies.gov.il/cz/contacts', 'contacts href preserved');
  const mapsLink = Array.from(links).find(a => a.textContent.includes('Directions'));
  assert(mapsLink == null, 'invalid data: maps URL was not rendered');

  assert(html.includes('&lt;b&gt;Main&lt;/b&gt;'), 'phone label HTML escaped to text');
  assert(!/onclick=/i.test(html), 'no inline onclick attributes');

  const telLinks = Array.from(links).filter(a => /^tel:/.test(a.getAttribute('href')));
  assert(telLinks.length === 1, 'one safe tel link rendered: got ' + telLinks.length);
  assert(telLinks[0].getAttribute('href') === 'tel:+420123456789', 'tel href correct');

  const mailLinks = Array.from(links).filter(a => /^mailto:/.test(a.getAttribute('href')));
  assert(mailLinks.length === 1, 'one safe mailto link rendered: got ' + mailLinks.length);
}

async function testRaceCondition() {
  section('Emergency: race-token prevents stale response overwriting current screen');
  const win = makeEnv({ country: 'CZ' });
  const p1 = win.renderSos();
  await flush();
  win.setSelectedCountryForTest('DE');
  const p2 = win.renderSos();
  await flush();
  resolveFetch(win, 'CZ', { name: 'CZ EMBASSY (stale)', city: 'Prague', phones: [], emails: [], contacts: 'https://x.test' });
  await flush();
  resolveFetch(win, 'DE', { name: 'DE EMBASSY (current)', city: 'Berlin', phones: [], emails: [], contacts: 'https://y.test' });
  await Promise.all([p1, p2]);
  await flush();

  const html = win.document.getElementById('embassy-data').innerHTML;
  assert(html.includes('DE EMBASSY (current)'), 'current country data rendered');
  assert(!html.includes('CZ EMBASSY (stale)'), 'stale country data did NOT overwrite current');
}

async function testSosCards() {
  section('Emergency: sos numbers are wired via addEventListener (no inline onclick)');
  const win = makeEnv();
  const renderPromise = win.renderSos();
  await flush();
  resolveFetch(win, 'CZ', { name: 'Test', city: 'Prague', phones: [], emails: [], contacts: 'https://x.test' });
  await renderPromise;
  await flush();

  const sosHtml = win.document.getElementById('sos-content').innerHTML;
  assert(!/onclick=/i.test(sosHtml), 'no inline onclick attributes anywhere in SOS content');
  const cards = win.document.querySelectorAll('.sos-card');
  assert(cards.length === 4, 'four sos-cards rendered: got ' + cards.length);
  const nums = Array.from(cards).map(c => c.querySelector('.sos-number').textContent);
  assert(nums.includes('112'), 'general 112 present');
  assert(nums.includes('158'), 'police 158 present');

  const calls = [];
  win.copyVal = function(v) { calls.push(v); };
  cards[1].dispatchEvent(new win.Event('click', { bubbles: true }));
  assert(calls.length === 1 && calls[0] === '158', 'sos card click copies number: ' + JSON.stringify(calls));
}

async function testNotesEscaping() {
  section('Emergency: notes are rendered as text (no HTML interpretation)');
  const win = makeEnv();
  // EMERGENCY_DATA is a const inside emergency.js, so it isn't a window property —
  // we mutate one of its existing entries to inject the malicious payload.
  win.eval("EMERGENCY_DATA.CZ.notes = ['<script>alert(1)</script>', 'plain text'];");
  const renderPromise = win.renderSos();
  await flush();
  resolveFetch(win, 'CZ', { name: 'Test', city: 'Prague', phones: [], emails: [], contacts: 'https://x.test' });
  await renderPromise;
  await flush();
  const html = win.document.getElementById('sos-content').innerHTML;
  assert(!/<script>alert/i.test(html), 'script in note is escaped to text');
  assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'note text encoded literally');
}

async function testFailedFetchFallback() {
  section('Emergency: failed embassy fetch shows fallback link (still safe)');
  const win = makeEnv();
  win.fetch = function() { return Promise.reject(new Error('network')); };
  await win.renderSos();
  await flush();
  const html = win.document.getElementById('embassy-data').innerHTML;
  assert(/Could not load embassy data/.test(html), 'fallback message shown');
  const link = win.document.querySelector('#embassy-data a');
  assert(link != null, 'fallback link rendered');
  assert(link.getAttribute('href') === 'https://embassies.gov.il', 'fallback link points to safe URL');
}

async function main() {
  await testMaliciousScrape();
  await testRaceCondition();
  await testSosCards();
  await testNotesEscaping();
  await testFailedFetchFallback();
  console.log('\n══════════════════════════════════');
  console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(f => console.log('  ✗ ' + f));
  }
  console.log('══════════════════════════════════');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
