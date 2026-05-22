/* ══════════════════════════════════════
   public/index.html static regression tests

   Review 0004 caught that the shipped CSP in `public/index.html` was
   wider than both the inline HTML comment and `ARCHITECTURE.md`
   claimed: `connect-src 'self' https:` allowed XHRs to ANY HTTPS
   origin, and `img-src 'self' data: blob: https:` allowed images
   from ANY HTTPS origin. We narrowed those directives — `connect-src`
   to `'self'` plus the exchange-rates API only, and `img-src` to
   `'self' data: blob:` with no `https:` wildcard. These tests pin
   that intent so the policy cannot silently drift back to a broader
   posture without a deliberate code change + matching test update.
   ══════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(repoRoot, 'public', 'index.html'), 'utf8');

let passed = 0;
let failed = 0;
const failures = [];
function assert(cond, msg) {
  if (cond) passed++;
  else { failed++; failures.push(msg); console.error('  FAIL: ' + msg); }
}
function section(n) { console.log('\n── ' + n + ' ──'); }

/* Extract the content attribute of the CSP <meta> tag. There must be
   exactly one such tag; multiple meta-CSPs would be merged by the
   browser in surprising ways. The CSP value itself contains single
   quotes (`'self'`, `'unsafe-inline'`, ...) so we anchor the regex
   on the literal double-quoted form actually used in the source. */
function extractCspContent(source) {
  const re = /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"\s*\/?>/gi;
  const matches = [];
  let m;
  while ((m = re.exec(source)) !== null) matches.push(m[1]);
  return matches;
}

/* Parse a CSP policy string into a directive => tokens[] map. */
function parseCsp(content) {
  const directives = {};
  content.split(';').forEach(part => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const tokens = trimmed.split(/\s+/);
    const name = tokens.shift().toLowerCase();
    directives[name] = tokens;
  });
  return directives;
}

function testExactlyOneCspMeta() {
  section('exactly one Content-Security-Policy meta tag is shipped');
  const matches = extractCspContent(html);
  assert(matches.length === 1, 'index.html declares exactly one CSP meta tag (got ' + matches.length + ')');
}

function testConnectSrcIsNarrow() {
  section('connect-src is narrowed to self + frankfurter API (no `https:` wildcard) — review 0004 regression');
  const matches = extractCspContent(html);
  if (matches.length !== 1) { assert(false, 'cannot evaluate connect-src without a unique CSP'); return; }
  const csp = parseCsp(matches[0]);
  const tokens = csp['connect-src'] || [];
  assert(tokens.includes("'self'"), "connect-src includes 'self'");
  assert(
    !tokens.includes('https:') && !tokens.includes('http:') && !tokens.includes('*'),
    "connect-src does not contain a scheme-only `https:` / `http:` / `*` wildcard (got: " + tokens.join(' ') + ')',
  );
  assert(
    tokens.includes('https://api.frankfurter.dev'),
    'connect-src explicitly allows the exchange-rates API origin used by public/exchange.js',
  );
  // No unexpected extras: every non-'self' token must be an explicit https:// origin.
  for (const tok of tokens) {
    if (tok === "'self'") continue;
    assert(
      /^https:\/\/[^\s/]+$/.test(tok),
      'connect-src token is an explicit https://host origin or `\'self\'` (got: ' + tok + ')',
    );
  }
}

function testImgSrcIsNarrow() {
  section('img-src is narrowed to self + data: + blob: (no `https:` wildcard) — review 0004 regression');
  const matches = extractCspContent(html);
  if (matches.length !== 1) { assert(false, 'cannot evaluate img-src without a unique CSP'); return; }
  const csp = parseCsp(matches[0]);
  const tokens = csp['img-src'] || [];
  assert(tokens.includes("'self'"), "img-src includes 'self'");
  assert(tokens.includes('data:'), 'img-src includes data: (favicon SVG + FileReader QR preview)');
  assert(
    !tokens.includes('https:') && !tokens.includes('http:') && !tokens.includes('*'),
    "img-src does not contain a scheme-only `https:` / `http:` / `*` wildcard (got: " + tokens.join(' ') + ')',
  );
}

function testCoreDirectivesPresent() {
  section('core lockdown directives are present and not weakened');
  const matches = extractCspContent(html);
  if (matches.length !== 1) { assert(false, 'cannot evaluate directives without a unique CSP'); return; }
  const csp = parseCsp(matches[0]);

  const defaultSrc = csp['default-src'] || [];
  assert(defaultSrc.length === 1 && defaultSrc[0] === "'self'", "default-src is exactly 'self'");

  const objectSrc = csp['object-src'] || [];
  assert(objectSrc.length === 1 && objectSrc[0] === "'none'", "object-src is exactly 'none'");

  const frameSrc = csp['frame-src'] || [];
  assert(frameSrc.length === 1 && frameSrc[0] === "'none'", "frame-src is exactly 'none'");

  const baseUri = csp['base-uri'] || [];
  assert(baseUri.length === 1 && baseUri[0] === "'self'", "base-uri is exactly 'self'");

  const formAction = csp['form-action'] || [];
  assert(formAction.length === 1 && formAction[0] === "'self'", "form-action is exactly 'self'");

  const scriptSrc = csp['script-src'] || [];
  assert(scriptSrc.includes("'self'"), "script-src includes 'self'");
  assert(
    !scriptSrc.includes('https:') && !scriptSrc.includes('http:') && !scriptSrc.includes('*'),
    "script-src does not contain a scheme-only wildcard (got: " + scriptSrc.join(' ') + ')',
  );
  // 'unsafe-inline' is intentionally tolerated for now (documented
  // transitional compromise). 'unsafe-eval' must NEVER be allowed.
  assert(!scriptSrc.includes("'unsafe-eval'"), "script-src does not allow 'unsafe-eval'");
}

async function main() {
  testExactlyOneCspMeta();
  testConnectSrcIsNarrow();
  testImgSrcIsNarrow();
  testCoreDirectivesPresent();

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
