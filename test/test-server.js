/* ══════════════════════════════════════
   Server / Embassy Endpoint Tests
   Regression coverage for server.js — covers fetchPage timeout +
   response-size cap, corrupt cache handling, /api/embassy/:code
   (cached / stale / unknown), and /api/embassies aggregation.
   ══════════════════════════════════════ */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const request = require('supertest');

// Point server cache at a tmp dir BEFORE requiring server.js so any
// pre-existing repo cache files don't pollute our tests.
const tmpCache = fs.mkdtempSync(path.join(os.tmpdir(), 'th-cache-'));
process.env.PORT = '0';
// server.js uses path.join(__dirname, 'cache') for CACHE_DIR; we can't
// override that without changing the source. Instead, write into the
// repo's cache/ dir under a sentinel name and clean up afterwards.
const repoCache = path.join(__dirname, '..', 'cache');
const sentinelFiles = [];
function cacheFile(code) {
  const f = path.join(repoCache, `embassy_${code}.json`);
  if (!sentinelFiles.includes(f)) sentinelFiles.push(f);
  return f;
}
function cleanupCache() {
  for (const f of sentinelFiles) {
    try { fs.unlinkSync(f); } catch (_unlinkErr) { /* ignore */ }
  }
  try { fs.rmdirSync(tmpCache); } catch (_rmErr) { /* ignore */ }
}

const server = require('../server.js');
const { app, fetchPage, parseEmbassyHtml, readCachedEmbassy, setFetchImplForTest, EMBASSY_PATHS } = server;

let passed = 0;
let failed = 0;
const failures = [];

function assert(cond, msg) {
  if (cond) passed++;
  else { failed++; failures.push(msg); console.error('  FAIL: ' + msg); }
}
function section(n) { console.log('\n── ' + n + ' ──'); }

async function testReadCachedEmbassy() {
  section('readCachedEmbassy: corrupt JSON returns null and unlinks');
  const code = 'TESTCORRUPT';
  const f = path.join(repoCache, `embassy_${code}.json`);
  sentinelFiles.push(f);
  fs.writeFileSync(f, '{ this is not json');
  const result = readCachedEmbassy(f);
  assert(result === null, 'returns null for corrupt JSON');
  assert(!fs.existsSync(f), 'corrupt file unlinked');

  fs.writeFileSync(f, '{"name":"OK","city":"Place"}');
  const result2 = readCachedEmbassy(f);
  assert(result2 && result2.name === 'OK', 'returns parsed object for valid JSON');
  try { fs.unlinkSync(f); } catch (_unlinkErr) { /* cleanup */ }
}

async function testEmbassyEndpointUnknown() {
  section('GET /api/embassy/:code 404 on unknown code');
  const res = await request(app).get('/api/embassy/ZZ');
  assert(res.status === 404, 'status is 404: got ' + res.status);
  assert(res.body && res.body.error, 'error body present');
}

async function testEmbassyEndpointCached() {
  section('GET /api/embassy/:code returns cached data (no network)');
  const code = 'CZ';
  const f = cacheFile(code);
  // Touch a fresh cache file.
  const data = { name: 'Test Embassy', city: 'Prague', phones: [{ label: 'Main', number: '+420123' }], emails: [] };
  fs.writeFileSync(f, JSON.stringify(data));
  // Set mtime to now so the cache is considered fresh.
  const now = new Date();
  fs.utimesSync(f, now, now);

  const res = await request(app).get('/api/embassy/CZ');
  assert(res.status === 200, 'status 200');
  assert(res.body.name === 'Test Embassy', 'cached name returned');
  assert(res.body._cached === true, '_cached flag set');
}

async function testEmbassyEndpointCorruptCacheRefetchAttempt() {
  section('GET /api/embassy/:code handles corrupt cache without 500');
  const code = 'PL';
  const f = cacheFile(code);
  fs.writeFileSync(f, '{ corrupted');
  // Set fresh mtime so it would normally be returned.
  const now = new Date();
  fs.utimesSync(f, now, now);
  // Use a stubbed fetch that always rejects so the test is hermetic
  // (no network) and predictable: corrupt-fresh → fall through to
  // refetch → refetch rejects → no stale cache (we deleted it) → 502.
  setFetchImplForTest(() => Promise.reject(new Error('stub: network disabled')));
  try {
    const res = await request(app).get('/api/embassy/PL');
    // Corrupt cache was unlinked by readCachedEmbassy(), so no stale
    // fallback is possible: the only valid responses are 200 (fresh
    // network success — but we stubbed the network out) or 502.
    assert(res.status === 502, 'returns 502 once corrupt cache is gone and fetch fails: got ' + res.status);
    assert(!fs.existsSync(f), 'corrupt cache file unlinked');
  } finally {
    setFetchImplForTest(null);
  }
}

async function testEmbassiesEndpoint() {
  section('GET /api/embassies returns metadata for all known countries');
  const res = await request(app).get('/api/embassies');
  assert(res.status === 200, 'status 200');
  for (const code of Object.keys(EMBASSY_PATHS)) {
    assert(res.body[code] != null, 'entry present for ' + code);
  }
}

async function testEmbassiesEndpointCorruptCache() {
  section('GET /api/embassies tolerates a corrupt cache file');
  const code = 'HU';
  const f = cacheFile(code);
  fs.writeFileSync(f, 'not json');
  const res = await request(app).get('/api/embassies');
  assert(res.status === 200, 'status 200 despite corrupt cache');
  assert(res.body[code] != null, 'entry still present for ' + code);
  assert(typeof res.body[code].city === 'string' || res.body[code].name != null, 'fallback metadata returned');
}

async function testFetchPageTimeout() {
  section('fetchPage: rejects on timeout');
  // Start a local TCP server that accepts but never responds.
  const slow = http.createServer(() => { /* hang */ });
  await new Promise(resolve => slow.listen(0, '127.0.0.1', resolve));
  const port = slow.address().port;
  const url = `http://127.0.0.1:${port}/never`;
  let threw = false;
  try {
    // Force the cleartext client so we don't need a self-signed cert.
    await fetchPage(url, { timeoutMs: 200, maxBytes: 1024, client: http });
  } catch (err) {
    threw = true;
    assert(/timed out/i.test(err.message), 'rejected with timeout error: ' + err.message);
  }
  assert(threw, 'fetchPage rejected (did not hang)');
  await new Promise(resolve => slow.close(resolve));
}

async function testFetchPageMaxBytes() {
  section('fetchPage: enforces response size cap (regression for server.js:63-68)');
  // Local HTTP server that streams more bytes than maxBytes allows.
  // We stream chunks slowly enough that the size check has time to
  // fire on a chunk boundary rather than the whole body arriving in
  // a single buffer.
  const big = Buffer.alloc(64 * 1024, 0x61); // 64 KiB of 'a'
  const srv = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    let sent = 0;
    function pump() {
      if (sent >= big.length) { res.end(); return; }
      const chunk = big.slice(sent, sent + 4096);
      sent += chunk.length;
      res.write(chunk);
      // Defer next chunk so 'data' handler can run and reject.
      setImmediate(pump);
    }
    pump();
  });
  await new Promise(resolve => srv.listen(0, '127.0.0.1', resolve));
  const port = srv.address().port;
  let err = null;
  try {
    await fetchPage(`http://127.0.0.1:${port}/big`, {
      timeoutMs: 5000,
      maxBytes: 1024,
      client: http,
    });
  } catch (e) {
    err = e;
  }
  assert(err !== null, 'fetchPage rejected (size cap fired)');
  assert(err && /exceeded 1024 bytes/.test(err.message),
    'rejection message names the byte cap: ' + (err && err.message));
  await new Promise(resolve => srv.close(resolve));
}

async function testFetchPageSuccess() {
  section('fetchPage: resolves with body when response is under maxBytes');
  const srv = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<html>tiny</html>');
  });
  await new Promise(resolve => srv.listen(0, '127.0.0.1', resolve));
  const port = srv.address().port;
  try {
    const body = await fetchPage(`http://127.0.0.1:${port}/small`, {
      timeoutMs: 5000,
      maxBytes: 1024,
      client: http,
    });
    assert(body === '<html>tiny</html>', 'body fully read: ' + body);
  } finally {
    await new Promise(resolve => srv.close(resolve));
  }
}

async function testFetchPageRejectsNon200() {
  section('fetchPage: rejects when upstream returns non-200/non-redirect');
  const srv = http.createServer((req, res) => { res.writeHead(503); res.end('nope'); });
  await new Promise(resolve => srv.listen(0, '127.0.0.1', resolve));
  const port = srv.address().port;
  let err = null;
  try {
    await fetchPage(`http://127.0.0.1:${port}/err`, { timeoutMs: 2000, client: http });
  } catch (e) { err = e; }
  assert(err && /HTTP 503/.test(err.message), 'rejected with HTTP status: ' + (err && err.message));
  await new Promise(resolve => srv.close(resolve));
}

async function testFetchPageFollowsRedirect() {
  section('fetchPage: follows a redirect to final 200');
  let hits = 0;
  const srv = http.createServer((req, res) => {
    hits++;
    if (req.url === '/start') {
      res.writeHead(302, { Location: '/final' });
      res.end();
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('arrived');
    }
  });
  await new Promise(resolve => srv.listen(0, '127.0.0.1', resolve));
  const port = srv.address().port;
  const body = await fetchPage(`http://127.0.0.1:${port}/start`,
    { timeoutMs: 2000, client: http });
  assert(body === 'arrived', 'final body returned: ' + body);
  assert(hits === 2, 'redirect followed once: ' + hits);
  await new Promise(resolve => srv.close(resolve));
}

async function testFetchPageRedirectCap() {
  section('fetchPage: rejects after too many redirects');
  const srv = http.createServer((req, res) => {
    // Always redirect — should hit the cap (5).
    res.writeHead(302, { Location: req.url });
    res.end();
  });
  await new Promise(resolve => srv.listen(0, '127.0.0.1', resolve));
  const port = srv.address().port;
  let err = null;
  try {
    await fetchPage(`http://127.0.0.1:${port}/loop`,
      { timeoutMs: 2000, client: http });
  } catch (e) { err = e; }
  assert(err && /Too many redirects/.test(err.message), 'rejected with redirect cap: ' + (err && err.message));
  await new Promise(resolve => srv.close(resolve));
}

async function testParseEmbassyHtml() {
  section('parseEmbassyHtml: extracts fields from realistic HTML');
  const html = `
    <div class="location-name">Embassy of Israel in Prague</div>
    <div class="full-address">Badeniho 2, Prague 6<br>170 06 Prague</div>
    <div class="field-working-time">09:00 – 13:00</div>
    <div class="field-day">Monday<br>Tuesday<br>Wednesday<br>Thursday<br>Friday</div>
    <div class="field-title">Main</div>
    <div class="field-phone-number"><a href="tel:+420-2-1234567">+420-2-1234567</a></div>
    <div class="field-title">Consul</div>
    <div class="field-email-address"><a href="mailto:consul@prague.mfa.gov.il">consul</a></div>
  `;
  const r = parseEmbassyHtml(html, 'CZ');
  assert(r.name === 'Embassy of Israel in Prague', 'name extracted');
  assert(r.phones.length === 1 && r.phones[0].number === '+420-2-1234567', 'phone extracted');
  assert(r.emails.length === 1 && r.emails[0].address === 'consul@prague.mfa.gov.il', 'email extracted');
  assert(/Mon–Fri/.test(r.hours), 'days abbreviated to Mon–Fri: ' + r.hours);
  assert(r.address && r.address.includes('Badeniho 2'), 'address extracted');
}

async function testParseEmbassyHtmlDaysOnlyOtherPattern() {
  section('parseEmbassyHtml: non-Mon–Fri days are prefixed verbatim');
  // The parser strips <br> via `<[^>]+>` and collapses runs of
  // whitespace — so `Tuesday<br>Thursday` becomes `TuesdayThursday`.
  // That's a known limitation, not a bug we're fixing here; the
  // assertion just pins down current behaviour so a future refactor
  // doesn't silently lose this branch.
  const html = `
    <div class="location-name">Consulate Test</div>
    <div class="field-working-time">10:00 – 14:00</div>
    <div class="field-day">Tuesday<br>Thursday</div>
    <div class="field-title">Phone</div>
    <div class="field-phone-number"><a href="tel:+111">+111</a></div>
  `;
  const r = parseEmbassyHtml(html, 'CZ');
  assert(r.hours && /Tuesday/.test(r.hours) && /Thursday/.test(r.hours),
    'days prefixed verbatim: ' + r.hours);
  assert(r.hours && !/^Mon–Fri/.test(r.hours),
    'Mon–Fri abbreviation not applied: ' + r.hours);
}

async function testVendoredJsQR() {
  section('GET /vendor/jsQR.min.js serves the pinned package file');
  const res = await request(app).get('/vendor/jsQR.min.js');
  assert(res.status === 200, 'status 200: got ' + res.status);
  assert(/javascript/i.test(res.headers['content-type'] || ''), 'JS content-type: ' + res.headers['content-type']);
  assert(res.text && res.text.length > 100, 'non-trivial body length: ' + (res.text ? res.text.length : 0));
}

async function testStaleCacheFallbackOnFetchFailure() {
  section('GET /api/embassy/:code falls back to stale cache when refetch fails (regression for server.js:204-211)');
  const code = 'BG';
  const f = cacheFile(code);
  const data = { name: 'BG Cached Stale', city: 'Sofia', phones: [], emails: [] };
  fs.writeFileSync(f, JSON.stringify(data));
  // Force cache to be considered stale: backdate mtime by 60 days
  // (> CACHE_MAX_AGE which is 30 days).
  const old = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  fs.utimesSync(f, old, old);
  // Force the refetch to fail deterministically so we are guaranteed
  // to take the stale-cache fallback branch (not just hope the network
  // is down). This is the regression: if the fallback at server.js
  // line range 204-211 is removed/broken, this assertion fails because
  // the endpoint would return 502 instead of the cached body.
  setFetchImplForTest(() => Promise.reject(new Error('stub: simulated upstream outage')));
  try {
    const res = await request(app).get('/api/embassy/BG');
    assert(res.status === 200, 'status 200 from stale fallback: got ' + res.status);
    assert(res.body && res.body._stale === true, '_stale flag set');
    assert(res.body && res.body._cached === true, '_cached flag set');
    assert(res.body && res.body.name === 'BG Cached Stale', 'preserved cached name: ' + (res.body && res.body.name));
  } finally {
    setFetchImplForTest(null);
  }
}

async function testStaleCacheFallback502WhenNoCache() {
  section('GET /api/embassy/:code returns 502 when fetch fails and no cache exists');
  const code = 'RO';
  const f = cacheFile(code);
  // Make sure no cache file is present.
  try { fs.unlinkSync(f); } catch (_unlinkErr) { /* ignore */ }
  setFetchImplForTest(() => Promise.reject(new Error('stub: simulated upstream outage')));
  try {
    const res = await request(app).get('/api/embassy/RO');
    assert(res.status === 502, 'status 502 when fetch fails and no cache: got ' + res.status);
    assert(res.body && /Failed to fetch/.test(res.body.error || ''), 'error message present: ' + (res.body && res.body.error));
  } finally {
    setFetchImplForTest(null);
  }
}

async function testFreshFetchPopulatesCache() {
  section('GET /api/embassy/:code: successful refetch writes cache and returns body');
  const code = 'GB';
  const f = cacheFile(code);
  try { fs.unlinkSync(f); } catch (_unlinkErr) { /* ignore */ }
  const html = `
    <div class="location-name">London Test</div>
    <div class="field-working-time">09:00 – 17:00</div>
    <div class="field-title">Main</div>
    <div class="field-phone-number"><a href="tel:+44-20-1234">+44-20-1234</a></div>
  `;
  setFetchImplForTest(async () => html);
  try {
    const res = await request(app).get('/api/embassy/GB');
    assert(res.status === 200, 'status 200 from fresh fetch: got ' + res.status);
    assert(res.body && res.body.name === 'London Test', 'parsed name returned: ' + (res.body && res.body.name));
    assert(res.body && res.body._fetched, '_fetched timestamp set');
    assert(fs.existsSync(f), 'cache file written');
    const onDisk = JSON.parse(fs.readFileSync(f, 'utf8'));
    assert(onDisk.name === 'London Test', 'cache file contains parsed body');
  } finally {
    setFetchImplForTest(null);
  }
}

async function main() {
  try {
    await testReadCachedEmbassy();
    await testEmbassyEndpointUnknown();
    await testEmbassyEndpointCached();
    await testEmbassyEndpointCorruptCacheRefetchAttempt();
    await testEmbassiesEndpoint();
    await testEmbassiesEndpointCorruptCache();
    await testFetchPageTimeout();
    await testFetchPageMaxBytes();
    await testFetchPageSuccess();
    await testFetchPageRejectsNon200();
    await testFetchPageFollowsRedirect();
    await testFetchPageRedirectCap();
    await testParseEmbassyHtml();
    await testParseEmbassyHtmlDaysOnlyOtherPattern();
    await testVendoredJsQR();
    await testStaleCacheFallbackOnFetchFailure();
    await testStaleCacheFallback502WhenNoCache();
    await testFreshFetchPopulatesCache();
  } finally {
    cleanupCache();
  }
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
