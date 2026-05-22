/* ══════════════════════════════════════
   URL Safety Helper Tests
   Regression coverage for safe{Tel,Mailto,Http}Href validators.
   ══════════════════════════════════════ */
const { safeTelHref, safeMailtoHref, safeHttpHref } = require('../public/url-safety.js');

let passed = 0;
let failed = 0;
const failures = [];

function assert(cond, msg) {
  if (cond) passed++;
  else { failed++; failures.push(msg); console.error('  FAIL: ' + msg); }
}
function section(n) { console.log('\n── ' + n + ' ──'); }

section('safeTelHref');
assert(safeTelHref('+972-2-530-3155') === 'tel:+972-2-530-3155', 'accepts E.164 with dashes');
assert(safeTelHref('+420 123 456 789') === 'tel:+420 123 456 789', 'accepts spaces');
assert(safeTelHref('  +12025550100  ') === 'tel:+12025550100', 'trims whitespace');
assert(safeTelHref('(800) 555-0100') === 'tel:(800) 555-0100', 'accepts parens');
assert(safeTelHref('') === null, 'rejects empty');
assert(safeTelHref(null) === null, 'rejects null');
assert(safeTelHref(undefined) === null, 'rejects undefined');
assert(safeTelHref(123456) === null, 'rejects non-string');
assert(safeTelHref('javascript:alert(1)') === null, 'rejects javascript: scheme');
assert(safeTelHref('"><script>alert(1)</script>') === null, 'rejects HTML/script injection');
assert(safeTelHref('+1\nDROP TABLE') === null, 'rejects newline injection');
assert(safeTelHref('1234567890123456789012345678901234567890123456789') === null, 'rejects overlong');

section('safeMailtoHref');
assert(safeMailtoHref('user@example.com') === 'mailto:user@example.com', 'accepts simple');
assert(safeMailtoHref('  consul@embassy.gov.il  ') === 'mailto:consul@embassy.gov.il', 'trims');
assert(safeMailtoHref('first.last+tag@sub.example.co.uk') === 'mailto:first.last+tag@sub.example.co.uk', 'accepts plus/dot');
assert(safeMailtoHref('') === null, 'rejects empty');
assert(safeMailtoHref(null) === null, 'rejects null');
assert(safeMailtoHref(42) === null, 'rejects non-string');
assert(safeMailtoHref('not-an-email') === null, 'rejects missing @');
assert(safeMailtoHref('a@b') === null, 'rejects missing tld');
assert(safeMailtoHref('javascript:alert(1)') === null, 'rejects javascript:');
assert(safeMailtoHref('user@example.com"><script>alert(1)</script>') === null, 'rejects html/script injection');
assert(safeMailtoHref('user@example.com\nBcc:evil@x.com') === null, 'rejects newline header injection');

section('safeHttpHref');
assert(safeHttpHref('https://embassies.gov.il/foo') === 'https://embassies.gov.il/foo', 'accepts https');
assert(safeHttpHref('http://example.com/') === 'http://example.com/', 'accepts http');
assert(safeHttpHref('   https://example.com/path?q=1   ') === 'https://example.com/path?q=1', 'trims');
assert(safeHttpHref('') === null, 'rejects empty');
assert(safeHttpHref(null) === null, 'rejects null');
assert(safeHttpHref(undefined) === null, 'rejects undefined');
assert(safeHttpHref('javascript:alert(1)') === null, 'rejects javascript:');
assert(safeHttpHref('data:text/html,<script>alert(1)</script>') === null, 'rejects data:');
assert(safeHttpHref('vbscript:msgbox(1)') === null, 'rejects vbscript:');
assert(safeHttpHref('file:///etc/passwd') === null, 'rejects file:');
assert(safeHttpHref('not a url') === null, 'rejects garbage');
assert(safeHttpHref('//evil.com/no-scheme') === null, 'rejects schemeless //');

console.log('\n══════════════════════════════════');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failures.length) {
  console.log('\nFailures:');
  failures.forEach(f => console.log('  ✗ ' + f));
}
console.log('══════════════════════════════════');
process.exit(failed > 0 ? 1 : 0);
