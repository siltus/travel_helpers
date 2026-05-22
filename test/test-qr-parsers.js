/* ══════════════════════════════════════
   QR Payment Parser Tests
   Run: node test/test-qr-parsers.js
   ══════════════════════════════════════ */
const {
  parseSpayd, parseEpcQr, parseSwissQr, detectAndParse,
  validateIban, escHtml, QR_COUNTRY_FORMAT,
} = require('../public/qr-parsers.js');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; failures.push(msg); console.error('  FAIL: ' + msg); }
}

function assertThrows(fn, expectedMsg, testName) {
  try { fn(); failed++; failures.push(testName + ' — did not throw'); console.error('  FAIL: ' + testName + ' — did not throw'); }
  catch (e) {
    if (expectedMsg && !e.message.includes(expectedMsg)) {
      failed++; failures.push(testName + ' — wrong error: ' + e.message); console.error('  FAIL: ' + testName + ' — wrong error: ' + e.message);
    } else { passed++; }
  }
}

function section(name) { console.log('\n── ' + name + ' ──'); }

/* ══════════════════════════════════════
   IBAN Validation
   ══════════════════════════════════════ */
section('IBAN Validation');
assert(validateIban('DE89370400440532013000') === true, 'Valid DE IBAN');
assert(validateIban('CZ1120100000002101727312') === true, 'Valid CZ IBAN');
assert(validateIban('CH4431999123000889012') === true, 'Valid CH IBAN');
assert(validateIban('GB29NWBK60161331926819') === true, 'Valid GB IBAN');
assert(validateIban('NL91ABNA0417164300') === true, 'Valid NL IBAN');
assert(validateIban('DE89370400440532013001') === false, 'Invalid DE IBAN (wrong check)');
assert(validateIban('XX00INVALID') === false, 'Malformed IBAN');
assert(validateIban('') === false, 'Empty IBAN');
assert(validateIban('DE89 3704 0044 0532 0130 00') === true, 'IBAN with spaces');

/* ══════════════════════════════════════
   HTML Escaping
   ══════════════════════════════════════ */
section('HTML Escaping');
assert(escHtml('<script>alert("xss")</script>') === '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;', 'Escapes HTML tags');
assert(escHtml("O'Brien & Co") === "O&#39;Brien &amp; Co", 'Escapes quotes and ampersand');
assert(escHtml('') === '', 'Empty string');
assert(escHtml(null) === '', 'Null');

/* ══════════════════════════════════════
   SPAYD Parser
   ══════════════════════════════════════ */
section('SPAYD Parser');

// Basic valid
{
  const r = parseSpayd('SPD*1.0*ACC:CZ1120100000002101727312*AM:1850.00*CC:CZK');
  assert(r._format === 'SPAYD', 'SPAYD format detected');
  assert(r._version === '1.0', 'Version 1.0');
  assert(r.iban === 'CZ1120100000002101727312', 'IBAN parsed');
  assert(r.amount === 1850.00, 'Amount parsed');
  assert(r.currency === 'CZK', 'Currency parsed');
  assert(r.bic === null, 'No BIC');
}

// With BIC
{
  const r = parseSpayd('SPD*1.0*ACC:CZ1120100000002101727312+KOMBCZPP');
  assert(r.iban === 'CZ1120100000002101727312', 'IBAN with BIC');
  assert(r.bic === 'KOMBCZPP', 'BIC parsed');
}

// All optional fields
{
  const r = parseSpayd('SPD*1.0*ACC:CZ1120100000002101727312*AM:100*CC:CZK*RN:Jan Novak*RF:REF123*DT:20260101*MSG:Test msg*PT:IP*X-VS:12345*X-SS:67890*X-KS:0308');
  assert(r.recipientName === 'Jan Novak', 'Recipient name');
  assert(r.reference === 'REF123', 'Reference');
  assert(r.date === '20260101', 'Date');
  assert(r.message === 'Test msg', 'Message');
  assert(r.paymentType === 'IP', 'Payment type');
  assert(r._fields['X-VS'] === '12345', 'Variable symbol');
  assert(r._fields['X-SS'] === '67890', 'Specific symbol');
  assert(r._fields['X-KS'] === '0308', 'Constant symbol');
}

// URL-encoded values
{
  const r = parseSpayd('SPD*1.0*ACC:CZ1120100000002101727312*MSG:Hello%20World%21');
  assert(r.message === 'Hello World!', 'URL-decoded message');
}

// Error: not SPAYD
assertThrows(() => parseSpayd('BCD\n001'), 'SPD', 'SPAYD: rejects non-SPD');

// Error: missing version
assertThrows(() => parseSpayd('SPD*'), 'version', 'SPAYD: missing version');

// Error: missing ACC
assertThrows(() => parseSpayd('SPD*1.0*CC:CZK'), 'ACC', 'SPAYD: missing ACC');

// IBAN warning
{
  const r = parseSpayd('SPD*1.0*ACC:CZ0000000000000000000000');
  assert(r._warnings && r._warnings.length > 0, 'SPAYD: warns on bad IBAN checksum');
}

/* ══════════════════════════════════════
   EPC QR Parser
   ══════════════════════════════════════ */
section('EPC QR Parser');

// Version 002, full fields
{
  const qr = 'BCD\n002\n1\nSCT\nBFSWDE33BER\nJohn Doe\nDE89370400440532013000\nEUR123.45\nGDDS\nInvoice 7654321\n\nExtra info';
  const r = parseEpcQr(qr);
  assert(r._format === 'EPC', 'EPC format');
  assert(r._version === '002', 'Version 002');
  assert(r.bic === 'BFSWDE33BER', 'BIC parsed');
  assert(r.recipientName === 'John Doe', 'Name parsed');
  assert(r.iban === 'DE89370400440532013000', 'IBAN parsed');
  assert(r.amount === 123.45, 'Amount parsed');
  assert(r.currency === 'EUR', 'Currency EUR');
  assert(r.purpose === 'GDDS', 'Purpose parsed');
  assert(r.remittanceUnstructured === 'Invoice 7654321', 'Unstructured remittance');
  assert(!r.remittanceStructured, 'No structured remittance');
  assert(r.information === 'Extra info', 'Information parsed');
}

// Version 001
{
  const qr = 'BCD\n001\n1\nSCT\n\nJane Smith\nNL91ABNA0417164300\nEUR50.00\n\nPayment for order 42';
  const r = parseEpcQr(qr);
  assert(r._version === '001', 'Version 001');
  assert(r.bic === null, 'No BIC (empty)');
  assert(r.recipientName === 'Jane Smith', 'Name');
  assert(r.iban === 'NL91ABNA0417164300', 'NL IBAN');
  assert(r.amount === 50.00, 'Amount 50');
}

// No amount
{
  const qr = 'BCD\n002\n1\nSCT\n\nMax Mustermann\nDE89370400440532013000\n\n\nRef-123';
  const r = parseEpcQr(qr);
  assert(r.amount === null, 'No amount');
  assert(r.remittanceUnstructured === 'Ref-123', 'Remittance without amount');
}

// Structured remittance only
{
  const qr = 'BCD\n002\n1\nSCT\n\nTest Corp\nDE89370400440532013000\nEUR99.99\n\n\nRF18539007547034';
  const r = parseEpcQr(qr);
  assert(!r.remittanceUnstructured, 'No unstructured');
  assert(r.remittanceStructured === 'RF18539007547034', 'Structured remittance');
}

// Both remittance warning
{
  const qr = 'BCD\n002\n1\nSCT\n\nTest\nDE89370400440532013000\nEUR10\n\nFreetext\nRF18539007547034';
  const r = parseEpcQr(qr);
  assert(r._warnings && r._warnings.some(w => w.includes('Both')), 'EPC: warns on both remittance types');
}

// Errors
assertThrows(() => parseEpcQr('SPD*1.0'), 'BCD', 'EPC: rejects non-BCD');
assertThrows(() => parseEpcQr('BCD\n003\n1\nSCT'), 'version', 'EPC: rejects version 003');
assertThrows(() => parseEpcQr('BCD\n002\n9\nSCT'), 'character set', 'EPC: rejects charset 9');
assertThrows(() => parseEpcQr('BCD\n002\n1\nIST'), 'identification', 'EPC: rejects non-SCT');
assertThrows(() => parseEpcQr('BCD\n002\n1\nSCT\n\nName\n'), 'IBAN', 'EPC: missing IBAN');
assertThrows(() => parseEpcQr('BCD\n002\n1\nSCT\n\n\nDE89370400440532013000'), 'name', 'EPC: missing name');
assertThrows(() => parseEpcQr('BCD\n002\n1\nSCT\n\nName\nDE89370400440532013000\n123.45'), 'amount', 'EPC: bad amount format');

// IBAN checksum warning
{
  const qr = 'BCD\n002\n1\nSCT\n\nTest\nDE00000000000000000000\nEUR1';
  const r = parseEpcQr(qr);
  assert(r._warnings && r._warnings.some(w => w.includes('IBAN')), 'EPC: warns on bad IBAN');
}

// CRLF line endings
{
  const qr = 'BCD\r\n002\r\n1\r\nSCT\r\n\r\nTest Name\r\nDE89370400440532013000\r\nEUR10';
  const r = parseEpcQr(qr);
  assert(r.recipientName === 'Test Name', 'EPC: handles CRLF');
  assert(r.amount === 10, 'EPC: amount with CRLF');
}

/* ══════════════════════════════════════
   Swiss QR Parser
   ══════════════════════════════════════ */
section('Swiss QR Parser');

// Full SIX reference example
{
  const qr = [
    'SPC', '0200', '1',
    'CH4431999123000889012',
    'S', 'Robert Schneider AG', 'Rue du Lac 1268', '2b', '2501', 'Biel', 'CH',
    '', '', '', '', '', '', '',
    '1949.75', 'CHF',
    'S', 'Pia-Maria Rutschmann-Schnyder', 'Grosse Marktgasse', '28', '9400', 'Rorschach', 'CH',
    'QRR', '210000000003139471430009017',
    'Order from 15.10.2020',
    'EPD',
    '',
    '', '',
  ].join('\n');
  const r = parseSwissQr(qr);
  assert(r._format === 'SwissQR', 'Swiss format');
  assert(r.iban === 'CH4431999123000889012', 'IBAN');
  assert(r.creditor.name === 'Robert Schneider AG', 'Creditor name');
  assert(r.creditor.type === 'S', 'Creditor structured address');
  assert(r.creditor.street === 'Rue du Lac 1268', 'Creditor street');
  assert(r.creditor.city === 'Biel', 'Creditor city');
  assert(r.creditor.country === 'CH', 'Creditor country');
  assert(r.amount === 1949.75, 'Amount');
  assert(r.currency === 'CHF', 'Currency CHF');
  assert(r.debtor.name === 'Pia-Maria Rutschmann-Schnyder', 'Debtor name');
  assert(r.debtor.city === 'Rorschach', 'Debtor city');
  assert(r.referenceType === 'QRR', 'Reference type QRR');
  assert(r.reference === '210000000003139471430009017', 'QR reference');
  assert(r.message === 'Order from 15.10.2020', 'Message');
  assert(r.recipientName === 'Robert Schneider AG', 'recipientName alias');
}

// Combined address type (K)
{
  const qr = [
    'SPC', '0200', '1',
    'CH5800791123000889012',
    'K', 'Robert Schneider AG', 'Rue du Lac 1268, 2b', '2501 Biel', '', '', 'CH',
    '', '', '', '', '', '', '',
    '199.95', 'CHF',
    '', '', '', '', '', '', '',
    'SCOR', 'RF18539007547034',
    '',
    'EPD',
  ].join('\n');
  const r = parseSwissQr(qr);
  assert(r.creditor.type === 'K', 'Combined address type');
  assert(r.creditor.addressLine1 === 'Rue du Lac 1268, 2b', 'Combined addr line 1');
  assert(r.creditor.addressLine2 === '2501 Biel', 'Combined addr line 2');
  assert(r.referenceType === 'SCOR', 'SCOR reference');
  assert(r.reference === 'RF18539007547034', 'ISO reference');
}

// No amount, EUR currency
{
  const qr = [
    'SPC', '0200', '1',
    'CH4431999123000889012',
    'S', 'Acme Corp', 'Main St', '1', '8001', 'Zurich', 'CH',
    '', '', '', '', '', '', '',
    '', 'EUR',
    '', '', '', '', '', '', '',
    'NON', '',
    '',
    'EPD',
  ].join('\n');
  const r = parseSwissQr(qr);
  assert(r.amount === null, 'No amount');
  assert(r.currency === 'EUR', 'EUR currency');
  assert(r.referenceType === 'NON', 'NON reference');
  assert(r.debtor === null, 'No debtor');
  assert(r.ultimateCreditor === null, 'No ultimate creditor');
}

// NON reference with reference present → warning
{
  const qr = [
    'SPC', '0200', '1',
    'CH4431999123000889012',
    'S', 'Test', '', '', '', '', 'CH',
    '', '', '', '', '', '', '',
    '10', 'CHF',
    '', '', '', '', '', '', '',
    'NON', 'ShouldNotBeHere',
    '',
    'EPD',
  ].join('\n');
  const r = parseSwissQr(qr);
  assert(r._warnings && r._warnings.some(w => w.includes('NON')), 'Swiss: warns NON with reference');
}

// Wrong trailer → warning (not error)
{
  const qr = [
    'SPC', '0200', '1',
    'CH4431999123000889012',
    'S', 'Test', '', '', '', '', 'CH',
    '', '', '', '', '', '', '',
    '10', 'CHF',
    '', '', '', '', '', '', '',
    'NON', '',
    '',
    'XYZ',
  ].join('\n');
  const r = parseSwissQr(qr);
  assert(r._warnings && r._warnings.some(w => w.includes('EPD')), 'Swiss: warns on wrong trailer');
}

// Errors
assertThrows(() => parseSwissQr('BCD\n001'), 'SPC', 'Swiss: rejects non-SPC');
assertThrows(() => parseSwissQr('SPC\n0100\n1'), 'version', 'Swiss: rejects version 0100');
assertThrows(() => parseSwissQr('SPC\n0200\n2'), 'coding', 'Swiss: rejects coding 2');

// Invalid currency
{
  const qr = [
    'SPC', '0200', '1',
    'CH4431999123000889012',
    'S', 'Test', '', '', '', '', 'CH',
    '', '', '', '', '', '', '',
    '10', 'USD',
    '', '', '', '', '', '', '',
    'NON', '', '', 'EPD',
  ].join('\n');
  assertThrows(() => parseSwissQr(qr), 'currency', 'Swiss: rejects USD');
}

// CRLF line endings
{
  const qr = [
    'SPC', '0200', '1',
    'CH4431999123000889012',
    'S', 'Test CRLF', '', '', '', '', 'CH',
    '', '', '', '', '', '', '',
    '5.50', 'CHF',
    '', '', '', '', '', '', '',
    'NON', '', '', 'EPD',
  ].join('\r\n');
  const r = parseSwissQr(qr);
  assert(r.creditor.name === 'Test CRLF', 'Swiss: handles CRLF');
}

/* ══════════════════════════════════════
   Auto-detection
   ══════════════════════════════════════ */
section('Auto-detection');

{
  const r = detectAndParse('SPD*1.0*ACC:CZ1120100000002101727312');
  assert(r._format === 'SPAYD', 'Detects SPAYD');
}
{
  const r = detectAndParse('BCD\n002\n1\nSCT\n\nTest\nDE89370400440532013000\nEUR10');
  assert(r._format === 'EPC', 'Detects EPC');
}
{
  const qr = ['SPC','0200','1','CH4431999123000889012','S','Test','','','','','CH',
    '','','','','','','','10','CHF','','','','','','','','NON','','','EPD'].join('\n');
  const r = detectAndParse(qr);
  assert(r._format === 'SwissQR', 'Detects Swiss QR');
}
assertThrows(() => detectAndParse('UNKNOWN FORMAT'), 'Unknown', 'Auto-detect: rejects unknown');
assertThrows(() => detectAndParse(''), 'Unknown', 'Auto-detect: rejects empty');

/* ══════════════════════════════════════
   XSS / Malicious input
   ══════════════════════════════════════ */
section('XSS / Malicious Input');

// SPAYD with HTML injection in fields
{
  const r = parseSpayd('SPD*1.0*ACC:CZ1120100000002101727312*MSG:<script>alert(1)</script>');
  assert(r.message === '<script>alert(1)</script>', 'SPAYD: preserves raw malicious input');
  assert(escHtml(r.message).includes('&lt;script&gt;'), 'escHtml neutralizes script tag');
}

// EPC with HTML in name
{
  const qr = 'BCD\n002\n1\nSCT\n\n<img onerror=alert(1)>\nDE89370400440532013000\nEUR10';
  const r = parseEpcQr(qr);
  assert(r.recipientName === '<img onerror=alert(1)>', 'EPC: preserves raw malicious name');
  assert(escHtml(r.recipientName).includes('&lt;img'), 'escHtml neutralizes img tag');
}

/* ══════════════════════════════════════
   Country mapping
   ══════════════════════════════════════ */
section('Country Mapping');
assert(QR_COUNTRY_FORMAT['CZ'] === 'SPAYD', 'CZ → SPAYD');
assert(QR_COUNTRY_FORMAT['DE'] === 'EPC', 'DE → EPC');
assert(QR_COUNTRY_FORMAT['CH'] === 'SwissQR', 'CH → SwissQR');
assert(QR_COUNTRY_FORMAT['TH'] === undefined, 'TH → no QR format');
assert(QR_COUNTRY_FORMAT['JP'] === undefined, 'JP → no QR format');

/* ══════════════════════════════════════
   Strict amount validation (regression for review-0001 #4)
   parseFloat() silently truncates "10abc" → 10, which would change the
   encoded payment instruction. Both Swiss QR and SPAYD amounts must be
   complete non-negative decimals or be rejected outright.
   ══════════════════════════════════════ */
section('Swiss QR strict amount validation');
function swissQrWithAmount(amt) {
  return [
    'SPC', '0200', '1',
    'CH4431999123000889012',
    'S', 'Test', '', '', '', '', 'CH',
    '', '', '', '', '', '', '',
    amt, 'CHF',
    '', '', '', '', '', '', '',
    'NON', '', '', 'EPD',
  ].join('\n');
}
// Valid amounts continue to parse.
{
  const r = parseSwissQr(swissQrWithAmount('1949.75'));
  assert(r.amount === 1949.75, 'valid 1949.75 parses');
}
{
  const r = parseSwissQr(swissQrWithAmount('10'));
  assert(r.amount === 10, 'integer amount parses');
}
{
  const r = parseSwissQr(swissQrWithAmount(''));
  assert(r.amount === null, 'empty amount → null');
}
// Malformed amounts must throw, not silently truncate.
assertThrows(() => parseSwissQr(swissQrWithAmount('10abc')), 'amount', 'Swiss: rejects "10abc"');
assertThrows(() => parseSwissQr(swissQrWithAmount('abc')), 'amount', 'Swiss: rejects "abc"');
assertThrows(() => parseSwissQr(swissQrWithAmount('1.234')), 'amount', 'Swiss: rejects 3-decimal');
assertThrows(() => parseSwissQr(swissQrWithAmount('-10')), 'amount', 'Swiss: rejects negative');
assertThrows(() => parseSwissQr(swissQrWithAmount('1e5')), 'amount', 'Swiss: rejects scientific notation');
assertThrows(() => parseSwissQr(swissQrWithAmount('10.')), 'amount', 'Swiss: rejects trailing dot');
assertThrows(() => parseSwissQr(swissQrWithAmount('.5')), 'amount', 'Swiss: rejects bare ".5"');
assertThrows(() => parseSwissQr(swissQrWithAmount('10 50')), 'amount', 'Swiss: rejects internal space');
assertThrows(() => parseSwissQr(swissQrWithAmount('NaN')), 'amount', 'Swiss: rejects NaN literal');

section('SPAYD strict amount validation');
{
  const r = parseSpayd('SPD*1.0*ACC:CZ1120100000002101727312*AM:1850.00*CC:CZK');
  assert(r.amount === 1850, 'valid 1850.00 parses');
}
assertThrows(() => parseSpayd('SPD*1.0*ACC:CZ1120100000002101727312*AM:100abc*CC:CZK'), 'amount', 'SPAYD: rejects "100abc"');
assertThrows(() => parseSpayd('SPD*1.0*ACC:CZ1120100000002101727312*AM:abc*CC:CZK'), 'amount', 'SPAYD: rejects "abc"');
assertThrows(() => parseSpayd('SPD*1.0*ACC:CZ1120100000002101727312*AM:-50*CC:CZK'), 'amount', 'SPAYD: rejects negative amount');
assertThrows(() => parseSpayd('SPD*1.0*ACC:CZ1120100000002101727312*AM:1e3*CC:CZK'), 'amount', 'SPAYD: rejects scientific notation');

/* ══════════════════════════════════════
   Summary
   ══════════════════════════════════════ */
console.log('\n══════════════════════════════════');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.log('\nFailures:');
  failures.forEach(f => console.log('  ✗ ' + f));
}
console.log('══════════════════════════════════');
process.exit(failed > 0 ? 1 : 0);
